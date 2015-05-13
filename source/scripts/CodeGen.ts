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
        private scopeNumber: number;
        private index: number;
        private heapIndex: number;
        private symbolTable: SymbolTable;
        constructor(symbolTable: SymbolTable) {
            this.ExecutableImage = [];
            this.ImageSize = 256;
            this.StaticVarCount = 0;
            this.StaticTable = [];
            this.JumpTable = [];
            this.scopeNumber = 0;
            this.index = 0;
            this.heapIndex = 255;
            this.symbolTable = symbolTable;
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
                    hexVal = (hexVal.length < 2) ? "0" + hexVal : hexVal;
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
            }

            if(node.getName() == "VarDecl") {
                console.log("VarDecl");
                var varName = node.getChildren()[1].getName();
                // Integer
                if(node.getChildren()[0].getName() == "int") {
                    // Machine code for integer declaration:
                    // A9 00 -> Store ACC with constant 00 (default value for int)
                    this.addByte(new Byte("A9"), this.index, false);
                    this.addByte(new Byte("00"), this.index, false);
                    // 8D TX XX -> Store the accumulator in memory (T0 XX represents a memory location in stack)
                    this.addByte(new Byte("8D"), this.index, false);
                    // Check the static table for the variable
                    var tempVar = this.checkStaticTable(varName);
                    var tempByte = new Byte(tempVar.tempName);
                    tempByte.isTempVar = true;
                    this.addByte(tempByte, this.index, false);
                    this.addByte(new Byte("00"), this.index, false);
                } else if(node.getChildren()[0].getName() == "string") {
                    // String
                    // For a string declaration, simply add an entry to the static table
                    this.checkStaticTable(varName);
                }
            }

            if(node.getName() == "AssignmentStatement") {
                var varName = node.getChildren()[0].getName();
                var varType = this.getType(varName, this.scopeNumber, this.symbolTable.getRoot());
                
                if(varType == "int") {
                    var value = node.getChildren()[1].getName();
                    // Pad the 0 for numbers
                    if (value.length < 2) { value = "0" + value;}
                    // A9 value -> Store ACC with the given constant
                    this.addByte(new Byte("A9"), this.index, false);
                    this.addByte(new Byte(value), this.index, false);
                    // 8D TX XX
                    this.addByte(new Byte("8D"), this.index, false);
                    var tempVar = this.checkStaticTable(varName);
                    var tempByte = new Byte(tempVar.tempName);
                    tempByte.isTempVar = true;
                    this.addByte(tempByte, this.index, false);
                    this.addByte(new Byte("00"), this.index, false);
                } else if(varType == "string") {
                    // for string assignment, write the characters to heap
                    var str = node.getChildren()[1].getChildren()[0].getName();
                    // trim out the quotation marks
                    str = str.substring(1, str.length - 1);
                    // Add "00" to the end of string
                    this.addByte(new Byte("00"), this.heapIndex, true);
                    for (var i = str.length - 1; i > -1; i--) {
                        var hexVal = str.charCodeAt(i).toString(16);
                        hexVal = (hexVal.length < 2) ? "0" + hexVal : hexVal;
                        this.addByte(new Byte(hexVal), this.heapIndex, true);
                    }

                    // A9 XX (XX is the starting location of the string)
                    this.addByte(new Byte("A9"), this.index, false);
                    var memLocation = (this.heapIndex + 1).toString(16);
                    memLocation = (memLocation.length < 2) ? "0" + memLocation : memLocation;
                    this.addByte(new Byte(memLocation), this.index, false);
                    // 8D TX XX
                    this.addByte(new Byte("8D"), this.index, false);
                    var tempVar = this.checkStaticTable(varName);
                    var tempByte = new Byte(tempVar.tempName);
                    tempByte.isTempVar = true;
                    this.addByte(tempByte, this.index, false);
                    this.addByte(new Byte("00"), this.index, false);
                } else if(varType = "boolean") {
                    // True or False
                }
            }

            if(node.getName() == "PrintStatement") {
                // Case 1: Identifier
                if(node.getChildren()[0].getName().match(/^[a-z]$/g)) {
                    var varName = node.getChildren()[0].getName();
                    // AC TX XX - Load Y Reg from mem
                    // A2 01 - Load X Reg with constant
                    // FF - System call
                    var tempVar = this.checkStaticTable(varName);
                    this.addByte(new Byte("AC"), this.index, false);
                    var tempByte = new Byte(tempVar.tempName);
                    tempByte.isTempVar = true;
                    this.addByte(tempByte, this.index, false);
                    this.addByte(new Byte("00"), this.index, false);
                    // If X register is 01, then prints a string from address stored in Y reg
                    // If X register is 02, print integer stored in Y reg
                    this.addByte(new Byte("A2"), this.index, false);
                    var varType = this.getType(tempVar.variable, this.scopeNumber, this.symbolTable.getRoot());
                    if(varType == "int") {
                        this.addByte(new Byte("01"), this.index, false);
                    } else {
                        this.addByte(new Byte("02"), this.index, false);
                    }
                }

                // Ends with a system call
                this.addByte(new Byte("FF"), this.index, false);
            }

            for (var i = 0; i < node.getChildren().length; i++) {
                this.toMachineCode(node.getChildren()[i]);
            }

            if(node.getName() == "Block") {
                this.scopeNumber--;
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

            byte.byte = byte.byte.toUpperCase();
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
            findNode(scopeNumber, node);
            retVal = tempNode.getSymbol(varName).type;
            while(!retVal && tempNode != this.symbolTable.getRoot()) {
                tempNode = tempNode.parent;
                retVal = tempNode.getSymbol(varName).type;
            }

            return retVal;

            function findNode(scopeNumber: number, node: ScopeNode) {
                if(node.scopeNumber == scopeNumber) {
                    tempNode = node;
                }
                for (var i = 0; i < node.getChildren().length; i++) {
                    findNode(scopeNumber, node.getChildren()[i]);
                }
            }
        }

        // checkStaticTable - check to see if the variable already exist in the
        // static table. If yes, just return the entry. If not, create a new instance
        // and return it
        public checkStaticTable(varName: string): StaticVar {
            var retVal = null;

            for(var key in this.StaticTable) {
                var entry = this.StaticTable[key];
                if(entry.variable == varName && entry.scope == this.scopeNumber) {
                    retVal = entry;
                }
            }

            if(!retVal) {
                retVal = new StaticVar(this.StaticVarCount++, varName, this.scopeNumber);
                this.StaticTable[retVal.tempName] = retVal;
            }
            return retVal;
        }

        // After all the instructions have been set, we need to go back to the Temporary variables and replace them with
        // actual locations
        public replaceTemp(): void {
            // Print the static
            // for (var key in this.StaticTable) {
            //     console.log(this.StaticTable[key].tempName + " " + this.StaticTable[key].scope + " " + this.StaticTable[key].offset);
            // }

            for (var i = 0; i < this.ExecutableImage.length; i++) {
                var tempByte = this.ExecutableImage[i];
                if(tempByte.isTempVar) {
                    // Look up the variable in the static table and get the offset
                    var offset = this.StaticTable[tempByte.byte].offset + this.index + 1;
                    if(offset > 255) {
                        throw "Index Out Of Bound";
                    }
                    // Convert offset to a hex string
                    var offsetString = offset.toString(16).toUpperCase();
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
    }

    // Bytes represented in the executable image
    export class Byte {
        public byte: string;
        public isTempVar: boolean = false;
        public isJumpVar: boolean = false;

        constructor(byte: string) {
            this.byte = byte;
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
        public temp: string;
        public distance: number;
    }
}