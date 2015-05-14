/// <reference path="Node.ts"/>
/// <reference path="SymbolTable.ts"/>
/*
    Code Generation - translate the AST into machine code (6502a instruction page)
    Due to a lack of time, I couldn't write this code in a more elegant way.
*/
var Compiler;
(function (Compiler) {
    var CodeGeneration = (function () {
        function CodeGeneration(symbolTable) {
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
        CodeGeneration.prototype.tableToArray = function (node) {
            this.symbolArray.push(node);
            for (var i = 0; i < node.getChildren().length; i++) {
                this.tableToArray(node.getChildren()[i]);
            }
        };
        CodeGeneration.prototype.toExecutableImage = function (node) {
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
        };
        // Take the AST and convert it to machine code (Temp/Jump not replaced)
        CodeGeneration.prototype.toMachineCode = function (node) {
            // traverse the AST
            if (node.getName() == "Block") {
                this.scopeNumber++;
                // Need to keep track of the amount of bytes in a block for jump
                this.JumpOffset = this.index;
                for (var i = 0; i < this.symbolArray.length; i++) {
                    if (this.symbolArray[i].scopeNumber == this.scopeNumber) {
                        this.curScopeNode = this.symbolArray[i];
                    }
                }
            }
            if (node.getName() == "VarDecl") {
                var varName = node.getChildren()[1].getName();
                // Integer
                if (node.getChildren()[0].getName() == "int") {
                    // Machine code for integer declaration:
                    // A9 00 -> Store ACC with constant 00 (default value for int)
                    this.LoadAccWithConst("0");
                    // 8D TX XX -> Store the accumulator in memory (T0 XX represents a memory location in stack)
                    this.StoreAccInMem(varName);
                }
                else if (node.getChildren()[0].getName() == "string") {
                    // String
                    // For a string declaration, simply add an entry to the static table
                    this.checkStaticTable(varName);
                }
                else if (node.getChildren()[0].getName() == "boolean") {
                    // default value for boolean is false
                    this.LoadAccWithConst((245).toString(16));
                    this.StoreAccInMem(varName);
                }
            }
            if (node.getName() == "AssignmentStatement") {
                var varName = node.getChildren()[0].getName();
                var varType = this.getType(varName, this.scopeNumber, this.symbolTable.getRoot());
                if (varType == "int") {
                    var value = node.getChildren()[1].getName();
                    // A9 value -> Store ACC with the given constant
                    this.LoadAccWithConst(value);
                    // 8D TX XX
                    this.StoreAccInMem(varName);
                }
                else if (varType == "string") {
                    // for string assignment, write the characters to heap
                    var str = node.getChildren()[1].getChildren()[0].getName();
                    // A9 XX (XX is the starting location of the string)
                    var memLocation = this.StoreStringToHeap(str);
                    this.LoadAccWithConst(memLocation);
                    // 8D TX XX
                    this.StoreAccInMem(varName);
                }
                else if (varType == "boolean") {
                    // Store the address of true and false into accumulator
                    // Location of true string in heap is 251
                    // Location of false string in heap is 245
                    var address = (node.getChildren()[1].getName() == "true") ? 251 : 245;
                    var addressStr = address.toString(16);
                    this.LoadAccWithConst(addressStr);
                    this.StoreAccInMem(varName);
                }
            }
            if (node.getName() == "PrintStatement") {
                // Case 1: Identifier
                if (node.getChildren()[0].getName().match(/^[a-z]$/g)) {
                    var varName = node.getChildren()[0].getName();
                    // AC TX XX - Load Y Reg from mem
                    // A2 01 - Load X Reg with constant
                    // FF - System call
                    this.LoadYRegFromMem(varName);
                    // If X register is 01, then prints a string from address stored in Y reg
                    // If X register is 02, print integer stored in Y reg
                    var varType = this.getType(node.getChildren()[0].getName(), this.scopeNumber, this.symbolTable.getRoot());
                    var constant = (varType == "int") ? "01" : "02";
                    this.LoadXRegWithConst(constant);
                }
                else if (node.getChildren()[0].getName() == "StringExpr") {
                    // Case 2: string literal
                    var strLit = node.getChildren()[0].getChildren()[0].getName();
                    var memoryLocation = this.StoreStringToHeap(strLit);
                    this.LoadYRegWithConst(memoryLocation);
                    this.LoadXRegWithConst("02");
                }
                // Ends with a system call
                this.SystemCall();
            }
            if (node.getName() == "IfStatement") {
                if (node.getChildren()[0].getName() == "==") {
                    console.log("== detected!");
                    this.generateEquality(node.getChildren()[0]);
                }
            }
            if (node.getName() == "WhileStatement") {
                this.generateEquality(node.getChildren()[0]);
            }
            for (var i = 0; i < node.getChildren().length; i++) {
                this.toMachineCode(node.getChildren()[i]);
            }
            if (node.getName() == "Block") {
                // Calculate jump offset
                if (this.JumpTable["J" + this.scopeNumber]) {
                    this.JumpTable["J" + this.scopeNumber].distance = this.index - this.JumpOffset;
                }
                this.scopeNumber--;
                this.JumpOffset = 0;
            }
        };
        CodeGeneration.prototype.addByte = function (byte, index, isAtHeap) {
            // The total size of the executable image is 256 bytes startings from 0 to 255
            if (index >= this.ImageSize) {
                throw "Index exceeds maxmium size of the executable image.";
            }
            if (this.ExecutableImage[index] != null) {
                throw "Out of Stack Space.";
            }
            this.ExecutableImage[index] = byte;
            if (isAtHeap) {
                this.heapIndex--;
            }
            else {
                this.index++;
            }
        };
        CodeGeneration.prototype.getType = function (varName, scopeNumber, node) {
            var retVal = null;
            var tempNode = null;
            tempNode = this.curScopeNode;
            retVal = tempNode.getSymbol(varName).type;
            //retVal = tempNode.getSymbol(varName).type;
            while (!retVal && tempNode != this.symbolTable.getRoot()) {
                tempNode = tempNode.parent;
                if (tempNode) {
                    if (tempNode.getSymbol(varName)) {
                        retVal = tempNode.getSymbol(varName).type;
                    }
                }
            }
            return retVal;
        };
        // checkStaticTable - check to see if the variable already exist in the
        // static table. If yes, just return the entry. If not, create a new instance
        // and return it
        CodeGeneration.prototype.checkStaticTable = function (varName) {
            var retVal = null;
            for (var key in this.StaticTable) {
                var entry = this.StaticTable[key];
                if (entry.variable == varName) {
                    retVal = entry;
                }
            }
            if (!retVal) {
                retVal = new StaticVar(this.StaticVarCount++, varName, this.scopeNumber);
                this.StaticTable[retVal.tempName] = retVal;
            }
            return retVal;
        };
        // After all the instructions have been set, we need to go back to the Temporary variables and replace them with
        // actual locations
        CodeGeneration.prototype.replaceTemp = function () {
            // Add a TEMP address for comparison
            var newTempStaticVar = new StaticVar(this.StaticVarCount++, null, null);
            newTempStaticVar.tempName = "TT";
            this.StaticTable[newTempStaticVar.tempName] = newTempStaticVar;
            // Print the static
            for (var key in this.StaticTable) {
                console.log(this.StaticTable[key].tempName + " " + this.StaticTable[key].scope + " " + this.StaticTable[key].offset);
            }
            for (var key in this.JumpTable) {
                console.log(this.JumpTable[key].tempName + " " + this.JumpTable[key].distance);
            }
            for (var i = 0; i < this.ExecutableImage.length; i++) {
                var tempByte = this.ExecutableImage[i];
                if (tempByte.isTempVar) {
                    // Look up the variable in the static table and get the offset
                    var offset = this.StaticTable[tempByte.byte].offset + this.index + 1;
                    if (offset > 255) {
                        throw "Index Out Of Bound";
                    }
                    // Convert offset to a hex string
                    var offsetString = offset.toString(16).toUpperCase();
                    offsetString = (offsetString.length < 2) ? "0" + offsetString : offsetString;
                    tempByte.byte = offsetString;
                }
                else if (tempByte.isJumpVar) {
                    var offsetString = this.JumpTable[tempByte.byte].distance.toString(16).toUpperCase();
                    offsetString = (offsetString.length < 2) ? "0" + offsetString : offsetString;
                    tempByte.byte = offsetString;
                }
            }
        };
        /// fill - fill the empty bytes with 00
        CodeGeneration.prototype.fill = function () {
            for (var i = 0; i < this.ImageSize; i++) {
                if (!this.ExecutableImage[i]) {
                    this.ExecutableImage[i] = new Byte("00");
                }
            }
        };
        // Assmebly Instructions
        // 8D TX XX - Store the accumulator in memory 
        CodeGeneration.prototype.StoreAccInMem = function (varName) {
            this.addByte(new Byte("8D"), this.index, false);
            var tempVar;
            if (varName == "TT") {
                tempVar = new StaticVar(this.StaticVarCount, null, null);
                tempVar.tempName = "TT";
            }
            else {
                tempVar = this.checkStaticTable(varName);
            }
            var tempByte = new Byte(tempVar.tempName);
            tempByte.isTempVar = true;
            this.addByte(tempByte, this.index, false);
            this.addByte(new Byte("00"), this.index, false);
        };
        // A9 XX - load accumulator with a constant
        CodeGeneration.prototype.LoadAccWithConst = function (constant) {
            this.addByte(new Byte("A9"), this.index, false);
            this.addByte(new Byte(constant), this.index, false);
        };
        // AC TX XX - load Y register from memory
        CodeGeneration.prototype.LoadYRegFromMem = function (varName) {
            this.addByte(new Byte("AC"), this.index, false);
            var tempVar = this.checkStaticTable(varName);
            var tempByte = new Byte(tempVar.tempName);
            tempByte.isTempVar = true;
            this.addByte(tempByte, this.index, false);
            this.addByte(new Byte("00"), this.index, false);
        };
        // A2 XX - load X Register with constant
        CodeGeneration.prototype.LoadXRegWithConst = function (constant) {
            this.addByte(new Byte("A2"), this.index, false);
            this.addByte(new Byte(constant), this.index, false);
        };
        // A0 XX - load the Y Register with constant
        CodeGeneration.prototype.LoadYRegWithConst = function (constant) {
            this.addByte(new Byte("A0"), this.index, false);
            this.addByte(new Byte(constant), this.index, false);
        };
        // D0 XX - branch if z flag is zero
        CodeGeneration.prototype.BranchNotEqual = function () {
            this.addByte(new Byte("D0"), this.index, false);
            var jumpTemp = new JumpVar("J" + this.scopeNumber);
            var tempByte = new Byte(jumpTemp.tempName);
            tempByte.isJumpVar = true;
            this.JumpTable[jumpTemp.tempName] = jumpTemp;
            this.addByte(tempByte, this.index, false);
        };
        // EC XX XX - compare memory to x register
        CodeGeneration.prototype.CompareMemoryToXReg = function (varName) {
            this.addByte(new Byte("EC"), this.index, false);
            var tempVar;
            if (varName == "TT") {
                tempVar = new StaticVar(this.StaticVarCount, null, null);
                tempVar.tempName = "TT";
            }
            else {
                tempVar = this.checkStaticTable(varName);
            }
            var tempByte = new Byte(tempVar.tempName);
            tempByte.isTempVar = true;
            this.addByte(tempByte, this.index, false);
            this.addByte(new Byte("00"), this.index, false);
        };
        // FF - system call
        CodeGeneration.prototype.SystemCall = function () {
            this.addByte(new Byte("FF"), this.index, false);
        };
        // Store string to heap -  returns the start of the memory location
        CodeGeneration.prototype.StoreStringToHeap = function (str) {
            // trim out the quotation marks
            str = str.substring(1, str.length - 1);
            // Add "00" to the end of string
            this.addByte(new Byte("00"), this.heapIndex, true);
            for (var i = str.length - 1; i > -1; i--) {
                var hexVal = str.charCodeAt(i).toString(16);
                this.addByte(new Byte(hexVal), this.heapIndex, true);
            }
            return (this.heapIndex + 1).toString(16);
        };
        // generate boolean statement
        CodeGeneration.prototype.generateEquality = function (node) {
            var firstOperand = node.getChildren()[0];
            var secondOperand = node.getChildren()[1];
            // string to string comparison
            if (firstOperand.getName() == "==" || secondOperand.getName() == "!=") {
                throw "Nested boolean expr is not supported yet.";
            }
            else if (firstOperand.getName() == "StringExpr" && secondOperand.getName() == "StringExpr") {
                var firstStr = firstOperand.getChildren()[0];
                var secondStr = secondOperand.getChildren()[0];
                // Going to cheat with javascript comparison
                if (firstStr == secondStr) {
                }
            }
            else if (firstOperand.getName() == "StringExpr" || secondOperand.getName() == "StringExpr") {
                throw "ID to String comparison is not supported yet.";
            }
            else {
                // all other comparison
                if (firstOperand.getName().match(/^[0-9]$/g) && secondOperand.getName().match(/^[0-9]$/g)) {
                    // Integer to Integer
                    var firstInt = firstOperand.getName();
                    var secondInt = secondOperand.getName();
                    this.LoadXRegWithConst(firstInt);
                    this.LoadAccWithConst(secondInt);
                    this.StoreAccInMem("TT");
                    this.CompareMemoryToXReg("TT");
                    this.BranchNotEqual();
                }
            }
        };
        return CodeGeneration;
    })();
    Compiler.CodeGeneration = CodeGeneration;
    // Bytes represented in the executable image
    var Byte = (function () {
        function Byte(byte) {
            this.isTempVar = false;
            this.isJumpVar = false;
            if (byte.length > 2) {
                throw "Invalid Byte";
            }
            // Pad the string if it is less than size 2
            if (byte.length < 2) {
                byte = "0" + byte;
            }
            this.byte = byte.toUpperCase();
        }
        return Byte;
    })();
    Compiler.Byte = Byte;
    // To keep track of the position of the temp variables in the executable image
    var StaticVar = (function () {
        function StaticVar(count, variable, scope) {
            this.tempName = "T" + count;
            this.variable = variable;
            this.scope = scope;
            this.offset = count;
        }
        return StaticVar;
    })();
    Compiler.StaticVar = StaticVar;
    // To keep track of the jump offset for branching
    var JumpVar = (function () {
        function JumpVar(str) {
            this.tempName = str;
        }
        return JumpVar;
    })();
    Compiler.JumpVar = JumpVar;
})(Compiler || (Compiler = {}));
