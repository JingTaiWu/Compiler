/// <reference path="Node.ts"/>
/// <reference path="SymbolTable.ts"/>
/*
	Code Generation - translate the AST into machine code (6502a instruction page)
    Due to a lack of time, I couldn't write this code in a more elegant way.
*/
module Compiler {
    export class CodeGeneration {
        public ExecutableImage: Byte[];
        private ImageSize: number;
        private StaticTable: StaticVar[];
        private StaticVarCount: number;
        private JumpTable: JumpVar[];
        private JumpVarCount: number;
        private JumpOffset: number;
        private scopeNumber: number;
        private index: number;
        private heapIndex: number;
        private symbolTable: SymbolTable;
        private symbolArray;
        private curScopeNode: ScopeNode;
        private root: StaticNode;
        private currentNode: StaticNode;
        constructor(symbolTable: SymbolTable) {
            this.ExecutableImage = [];
            this.ImageSize = 256;
            this.StaticVarCount = 0;
            this.StaticTable = [];
            this.JumpTable = [];
            this.JumpOffset = 0;
            this.scopeNumber = 0;
            this.index = 0;
            this.heapIndex = 255;
            this.JumpVarCount = 0;
            this.symbolTable = symbolTable;
            this.symbolArray = [];
            this.tableToArray(this.symbolTable.getRoot());
        }

        public tableToArray(node: ScopeNode) {
            this.symbolArray.push(node);
            for (var i = 0; i < node.getChildren().length; i++) {
                this.tableToArray(node.getChildren()[i]);
            }
        }

        public addScope(scope: StaticNode): void {
            if(!this.root || this.root == null) {
                this.root = scope;
            } else {
                scope.parent = this.currentNode;
                this.currentNode.children.push(scope);
            }

            this.currentNode = scope;
        }

        public exitScope(): void {
            if(this.currentNode == this.root) {
                return;
            }

            if(this.currentNode.parent) {
                this.currentNode = this.currentNode.parent;
            } else {
                console.log("This shouldn't really happen.");
            }
        }

        public toExecutableImage(node: Node): void {
            // Write true and false to heap
            // Location of true in heap is 251
            // Location of false in heap is 245
            var boolVal = ["true", "false"];
            for (var j = 0; j < boolVal.length; j++) {
                this.addByte(new Byte("00"), this.heapIndex, true);
                for (var i = boolVal[j].length - 1; i > -1; i--) {
                    var hexVal = boolVal[j].charCodeAt(i).toString(16);
                    this.addByte(new Byte(hexVal), this.heapIndex, true);
                }
            }

            // Convert to machine code
            this.toMachineCode(node);
            this.fill();
            this.replaceTemp();
        }

        // Take the AST and convert it to machine code (Temp/Jump not replaced)
        public toMachineCode(node: Node): void {
            // traverse the AST
            if(node.getName() == "Block") {
                this.scopeNumber++;
                // Need to keep track of the amount of bytes in a block for jump
                this.JumpOffset = this.index;
                for (var i = 0; i < this.symbolArray.length; i++) {
                    if(this.symbolArray[i].scopeNumber == this.scopeNumber) {
                        this.curScopeNode = this.symbolArray[i];
                    }
                }

                var newScope = new StaticNode();
                newScope.scopeNumber = this.scopeNumber;
                this.addScope(newScope);
            }

            if(node.getName() == "VarDecl") {
                var varName = node.getChildren()[1].getName();
                // Integer
                if(node.getChildren()[0].getName() == "int") {
                    this.addToStaticTable(varName);
                    // Machine code for integer declaration:
                    // A9 00 -> Store ACC with constant 00 (default value for int)
                    this.LoadAccWithConst("0");
                    // 8D TX XX -> Store the accumulator in memory (T0 XX represents a memory location in stack)
                    this.StoreAccInMem(this.findStaticVar(varName));
                } else if(node.getChildren()[0].getName() == "string") {
                    // String
                    // For a string declaration, simply add an entry to the static table
                    this.addToStaticTable(varName);
                } else if(node.getChildren()[0].getName() == "boolean") {
                    this.addToStaticTable(varName);
                    // default value for boolean is false
                    this.LoadAccWithConst((245).toString(16));
                    this.StoreAccInMem(this.findStaticVar(varName));
                }
            }

            if(node.getName() == "AssignmentStatement") {
                var varName = node.getChildren()[0].getName();
                var varType = this.getType(varName, this.scopeNumber, this.symbolTable.getRoot());
                
                if(varType == "int") {
                    var value = node.getChildren()[1].getName();
                    // A9 value -> Store ACC with the given constant
                    this.LoadAccWithConst(value);
                    // 8D TX XX
                    this.StoreAccInMem(this.findStaticVar(varName));
                } else if(varType == "string") {
                    // for string assignment, write the characters to heap
                    var str = node.getChildren()[1].getChildren()[0].getName();
                    // A9 XX (XX is the starting location of the string)
                    var memLocation = this.StoreStringToHeap(str);
                    this.LoadAccWithConst(memLocation);
                    // 8D TX XX
                    this.StoreAccInMem(this.findStaticVar(varName));
                } else if(varType == "boolean") {
                    // Store the address of true and false into accumulator
                    // Location of true string in heap is 251
                    // Location of false string in heap is 245
                    var address = (node.getChildren()[1].getName() == "true") ? 251 : 245;
                    var addressStr = address.toString(16);
                    this.LoadAccWithConst(addressStr);
                    this.StoreAccInMem(this.findStaticVar(varName));
                }
            }

            if(node.getName() == "PrintStatement") {
                // Case 1: Identifier
                if(node.getChildren()[0].getName().match(/^[a-z]$/g)) {
                    var varName = node.getChildren()[0].getName();
                    // AC TX XX - Load Y Reg from mem
                    // A2 01 - Load X Reg with constant
                    // FF - System call
                    this.LoadYRegFromMem(this.findStaticVar(varName));
                    // If X register is 01, then prints a string from address stored in Y reg
                    // If X register is 02, print integer stored in Y reg
                    var varType = this.getType(node.getChildren()[0].getName(), this.scopeNumber, this.symbolTable.getRoot());
                    var constant = (varType == "int") ? "01" : "02";
                    this.LoadXRegWithConst(constant);
                } else if(node.getChildren()[0].getName() == "StringExpr") {
                    // Case 2: string literal
                    var strLit = node.getChildren()[0].getChildren()[0].getName();
                    var memoryLocation = this.StoreStringToHeap(strLit);
                    this.LoadYRegWithConst(memoryLocation);
                    this.LoadXRegWithConst("02");
                }
                // Ends with a system call
                this.SystemCall();
            }

            if(node.getName() == "IfStatement") {
                if(node.getChildren()[0].getName() == "==") {
                    console.log("== detected!");
                    this.generateEquality(node.getChildren()[0]);
                }
            }

            if(node.getName() == "WhileStatement") {
                this.generateEquality(node.getChildren()[0]);
            }

            for (var i = 0; i < node.getChildren().length; i++) {
                this.toMachineCode(node.getChildren()[i]);
            }

            if(node.getName() == "Block") {
                // Calculate jump offset
                if(this.JumpTable["J" + this.scopeNumber]) {
                    this.JumpTable["J" + this.scopeNumber].distance = this.index - this.JumpOffset;
                }
                this.scopeNumber--;
                this.JumpOffset = 0;
                if(this.curScopeNode.parent) {
                    this.curScopeNode = this.curScopeNode.parent;
                }

                this.exitScope();
            }
        }

        public addByte(byte: Byte, index: number, isAtHeap: boolean): void {
            // The total size of the executable image is 256 bytes startings from 0 to 255
            if(index >= this.ImageSize) {
                throw "Index exceeds maxmium size of the executable image.";
            }

            if(this.ExecutableImage[index] != null) {
                throw "Out of Stack Space.";
            }

            this.ExecutableImage[index] = byte;
            if(isAtHeap) {
                this.heapIndex--;
            } else {
                this.index++;
            }
        }

        public getType(varName: string, scopeNumber: number, node: ScopeNode): string {
            var retVal: string = null;
            var tempNode: ScopeNode = null;
            tempNode = this.curScopeNode;
            while(!retVal || tempNode != this.symbolTable.getRoot()) {
                if(tempNode) {
                    if(tempNode.getSymbol(varName)) {
                        retVal = tempNode.getSymbol(varName).type;
                    } 
                }
                if(tempNode.parent) {
                    tempNode = tempNode.parent;
                }  
            }

            return retVal;
        }

        // checkStaticTable - check to see if the variable already exist in the
        // static table. If yes, just return the entry. If not, create a new instance
        // and return it
        public addToStaticTable(varName: string): void {

            var retVal: StaticVar = null;
            // for(var key in this.StaticTable) {
            //     var entry = this.StaticTable[key];
            //     if(entry.variable == varName) {
            //         retVal = entry;
            //     }
            // }
            retVal = new StaticVar(this.StaticVarCount++, varName, this.scopeNumber);
            this.StaticTable[retVal.tempName] = retVal;
            this.currentNode.members[varName] = retVal;
        }

        // findStaticVar - finds the static variable name with the real variable name
        public findStaticVar(varName: string): string {
            var retVal = null;
            var tempNode = this.currentNode;
            while(tempNode != null || tempNode != undefined) {
                retVal = tempNode.members[varName];
                if(retVal) {
                    break;
                }
                tempNode = tempNode.parent;
            }
            retVal = tempNode.members[varName].tempName;
            return retVal;
        }

        // After all the instructions have been set, we need to go back to the Temporary variables and replace them with
        // actual locations
        public replaceTemp(): void {
            // Add a TEMP address for comparison
            var newTempStaticVar = new StaticVar(this.StaticVarCount++, null, null);
            newTempStaticVar.tempName = "TT";
            this.StaticTable[newTempStaticVar.tempName] = newTempStaticVar;
            // Print the static
            for (var key in this.StaticTable) {
                console.log(this.StaticTable[key].tempName + " " + this.StaticTable[key].scope + " " + this.StaticTable[key].variable);
            }

            for (var key in this.JumpTable) {
                console.log(this.JumpTable[key].tempName + " " + this.JumpTable[key].distance);
            }

            for (var i = 0; i < this.ExecutableImage.length; i++) {
                var tempByte = this.ExecutableImage[i];
                if(tempByte.isTempVar) {
                    console.log("Index " + i);
                    console.log("Replacing " + tempByte.byte);
                    // Look up the variable in the static table and get the offset
                    var offset = this.StaticTable[tempByte.byte].offset + this.index + 1;
                    if(offset > 255) {
                        throw "Index Out Of Bound";
                    }
                    // Convert offset to a hex string
                    var offsetString = offset.toString(16).toUpperCase();
                    offsetString = (offsetString.length < 2) ? "0" + offsetString : offsetString;
                    tempByte.byte = offsetString;
                } else if(tempByte.isJumpVar) {
                    var offsetString = this.JumpTable[tempByte.byte].distance.toString(16).toUpperCase();
                    offsetString = (offsetString.length < 2) ? "0" + offsetString : offsetString;
                    tempByte.byte = offsetString;
                }
            }
        }

        /// fill - fill the empty bytes with 00
        public fill(): void {
            for (var i = 0; i < this.ImageSize; i++) {
                if(!this.ExecutableImage[i]) {
                    this.ExecutableImage[i] = new Byte("00");
                }
            }
        }

        // Assmebly Instructions
        // 8D TX XX - Store the accumulator in memory 
        public StoreAccInMem(varName: string): void {
            this.addByte(new Byte("8D"), this.index, false);
            // var tempVar: StaticVar;
            // if(varName == "TT") {
            //     tempVar = new StaticVar(this.StaticVarCount, null, null);
            //     tempVar.tempName = "TT";
            // } else {
            //     tempVar = this.checkStaticTable(varName);
            // }
            // var tempByte = new Byte(tempVar.tempName);
            var tempByte = new Byte(varName);
            tempByte.isTempVar = true;
            this.addByte(tempByte, this.index, false);
            this.addByte(new Byte("00"), this.index, false);
        }

        // A9 XX - load accumulator with a constant
        public LoadAccWithConst(constant: string): void {
            this.addByte(new Byte("A9"), this.index, false);
            this.addByte(new Byte(constant), this.index, false);
        }

        // AC TX XX - load Y register from memory
        public LoadYRegFromMem(varName: string): void {
            this.addByte(new Byte("AC"), this.index, false);
            // var tempVar;
            // if(varName == "TT") {
            //     tempVar = new StaticVar(this.StaticVarCount, null, null);
            //     tempVar.tempName = "TT";
            // } else {
            //     tempVar = this.checkStaticTable(varName);
            // }
            // var tempByte = new Byte(tempVar.tempName);
            var tempByte = new Byte(varName);
            tempByte.isTempVar = true;
            this.addByte(tempByte, this.index, false);
            this.addByte(new Byte("00"), this.index, false);
        }

        // A2 XX - load X Register with constant
        public LoadXRegWithConst(constant: string): void {
            this.addByte(new Byte("A2"), this.index, false);
            this.addByte(new Byte(constant), this.index, false);
        }

        // A0 XX - load the Y Register with constant
        public LoadYRegWithConst(constant: string): void {
            this.addByte(new Byte("A0"), this.index, false);
            this.addByte(new Byte(constant), this.index, false);
        }

        // AE XX XX - load X register from memory
        public LoadXRegFromMem(varName: string): void {
            this.addByte(new Byte("AE"), this.index, false);
            // var tempVar;
            // if(varName == "TT") {
            //     tempVar = new StaticVar(this.StaticVarCount, null, null);
            //     tempVar.tempName = "TT";
            // } else {
            //     tempVar = this.checkStaticTable(varName);
            // }
            //var tempByte = new Byte(tempVar.tempName);
            var tempByte = new Byte(varName);
            tempByte.isTempVar = true;
            this.addByte(tempByte, this.index, false);
            this.addByte(new Byte("00"), this.index, false);
        }

        // D0 XX - branch if z flag is zero
        public BranchNotEqual(): void {
            this.addByte(new Byte("D0"), this.index, false);
            var jumpTemp: JumpVar = new JumpVar("J" + this.scopeNumber);
            var tempByte = new Byte(jumpTemp.tempName);
            tempByte.isJumpVar = true;
            this.JumpTable[jumpTemp.tempName] = jumpTemp;
            this.addByte(tempByte, this.index, false);
        }

        // EC XX XX - compare memory to x register
        public CompareMemoryToXReg(varName: string): void {
            this.addByte(new Byte("EC"), this.index, false);
            // var tempVar;
            // if(varName == "TT") {
            //     tempVar = new StaticVar(this.StaticVarCount, null, null);
            //     tempVar.tempName = "TT";
            // } else {
            //     tempVar = this.checkStaticTable(varName);
            // }
            // var tempByte = new Byte(tempVar.tempName);
            var tempByte = new Byte(varName);
            tempByte.isTempVar = true;
            this.addByte(tempByte, this.index, false);
            this.addByte(new Byte("00"), this.index, false);
        }

        // FF - system call
        public SystemCall(): void {
            this.addByte(new Byte("FF"), this.index, false);
        }

        // Store string to heap -  returns the start of the memory location
        public StoreStringToHeap(str: string): string {
            // trim out the quotation marks
            str = str.substring(1, str.length - 1);
            // Add "00" to the end of string
            this.addByte(new Byte("00"), this.heapIndex, true);
            for (var i = str.length - 1; i > -1; i--) {
                var hexVal = str.charCodeAt(i).toString(16);
                this.addByte(new Byte(hexVal), this.heapIndex, true);
            }

            return (this.heapIndex + 1).toString(16);
        }

        // generate boolean statement
        public generateEquality(node: Node): void {
            var firstOperand = node.getChildren()[0];
            var secondOperand = node.getChildren()[1];
            // string to string comparison
            if(firstOperand.getName() == "==" || secondOperand.getName() == "!=") {
                throw "Nested boolean expr is not supported yet."
            } else if(firstOperand.getName() == "StringExpr" && secondOperand.getName() == "StringExpr") {
                var firstStr = firstOperand.getChildren()[0].getName();
                var secondStr = secondOperand.getChildren()[0].getName();
                // Going to cheat with javascript comparison
                if(firstStr == secondStr) {
                    this.LoadXRegWithConst("01");
                } else {
                    this.LoadXRegWithConst("02");
                }
                this.LoadAccWithConst("01");
                this.StoreAccInMem("TT");
                this.CompareMemoryToXReg("TT");
                this.BranchNotEqual();
            } else if(firstOperand.getName() == "StringExpr" || secondOperand.getName() == "StringExpr"){
                throw "ID to String comparison is not supported yet."
            } else {
                // all other comparison
                if(firstOperand.getName().match(/^[0-9]$/g) && secondOperand.getName().match(/^[0-9]$/g)) {
                    // Integer to Integer
                    var firstInt = firstOperand.getName();
                    var secondInt = secondOperand.getName();
                    this.LoadXRegWithConst(firstInt);
                    this.LoadAccWithConst(secondInt);
                    this.StoreAccInMem("TT");
                    this.CompareMemoryToXReg("TT");
                    this.BranchNotEqual();
                } else if(firstOperand.getName().match(/^[a-z]$/g) && secondOperand.getName().match(/^[a-z]$/g)) {
                    // ID to ID
                    this.LoadXRegFromMem(this.findStaticVar(firstOperand.getName()));
                    this.CompareMemoryToXReg(this.findStaticVar(secondOperand.getName()));
                    this.BranchNotEqual();
                }
            }
        }
    }

    // Bytes represented in the executable image
    export class Byte {
        public byte: string;
        public isTempVar: boolean = false;
        public isJumpVar: boolean = false;

        constructor(byte: string) {
            if(byte.length > 2) {
                throw "Invalid Byte";
            }
            // Pad the string if it is less than size 2
            if(byte.length < 2) {
                byte = "0" + byte;
            }
            this.byte = byte.toUpperCase();
        }
    }

    // To keep track of the position of the temp variables in the executable image
    export class StaticVar {
        public tempName: string;
        public variable: string;
        public scope: number;
        public offset: number;

        constructor(count: number, variable: string, scope: number) {
            this.tempName = "T" + count;
            this.variable = variable;
            this.scope = scope;
            this.offset = count;
        }
    }

    // To keep track of the jump offset for branching
    export class JumpVar {
        public tempName: string;
        public distance: number;

        constructor(str: string) {
            this.tempName = str;
        }
    }

    export class StaticNode {
        public children: StaticNode[];
        public parent: StaticNode;
        public members: StaticVar[];
        public scopeNumber: number;

        constructor() {
            this.children = [];
            this.members = [];
        }
    }
}