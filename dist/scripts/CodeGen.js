/// <reference path="Node.ts"/>
/// <reference path="SymbolTable.ts"/>
/*
    Code Generation - translate the AST into machine code (6502a instruction page)
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
            this.scopeNumber = 0;
            this.index = 0;
            this.heapIndex = 255;
            this.symbolTable = symbolTable;
        }
        CodeGeneration.prototype.toExecutableImage = function (node) {
            this.toMachineCode(node);
            //this.fill();
            this.replaceTemp();
        };
        // Take the AST and convert it to machine code (Temp/Jump not replaced)
        CodeGeneration.prototype.toMachineCode = function (node) {
            // traverse the AST
            if (node.getName() == "Block") {
                this.scopeNumber++;
            }
            if (node.getName() == "VarDecl") {
                console.log("VarDecl");
                var varName = node.getChildren()[1].getName();
                // Integer
                if (node.getChildren()[0].getName() == "int") {
                    // Machine code for integer declaration:
                    // A9 00 -> Store ACC with constant 00 (default value for int)
                    this.addByte(new Byte("A9"), this.index);
                    this.addByte(new Byte("00"), this.index);
                    // 8D T0 XX -> Store the accumulator in memory (T0 XX represents a memory location in stack)
                    this.addByte(new Byte("8D"), this.index);
                    // Check the static table for the variable
                    var tempVar = this.checkStaticTable(varName);
                    var tempByte = new Byte(tempVar.tempName);
                    tempByte.isTempVar = true;
                    this.addByte(tempByte, this.index);
                    this.addByte(new Byte("00"), this.index);
                }
                else if (node.getChildren()[0].getName() == "string") {
                    // String
                    // For a string declaration, simply add an entry to the static table
                    this.checkStaticTable(varName);
                }
            }
            if (node.getName() == "AssignmentStatement") {
                var varName = node.getChildren()[0].getName();
                var varType = this.getType(varName, this.scopeNumber, this.symbolTable.getRoot());
                console.log("AssignmentStatment (var type " + varType + ").");
                if (varType == "int") {
                    console.log("Assign int");
                    var value = node.getChildren()[1].getName();
                    // Pad the 0 for numbers
                    if (value.length < 2) {
                        value = "0" + value;
                    }
                    // A9 value -> Store ACC with the given constant
                    this.addByte(new Byte("A9"), this.index);
                    this.addByte(new Byte(value), this.index);
                    // 8D T0 XX
                    this.addByte(new Byte("8D"), this.index);
                    var tempVar = this.checkStaticTable(varName);
                    var tempByte = new Byte(tempVar.tempName);
                    tempByte.isTempVar = true;
                    this.addByte(tempByte, this.index);
                    this.addByte(new Byte("00"), this.index);
                }
                else if (varType == "string") {
                }
            }
            for (var i = 0; i < node.getChildren().length; i++) {
                this.toMachineCode(node.getChildren()[i]);
            }
            if (node.getName() == "Block") {
                this.scopeNumber--;
            }
        };
        CodeGeneration.prototype.addByte = function (byte, index) {
            // The total size of the executable image is 256 bytes startings from 0 to 255
            if (index >= 256) {
                throw "Index exceeds maxmium size of the executable image.";
            }
            if (this.ExecutableImage[index] != null) {
                throw "There is already a byte at index " + index + " .";
            }
            this.ExecutableImage[index] = byte;
            this.index++;
        };
        CodeGeneration.prototype.getType = function (varName, scopeNumber, node) {
            var retVal = null;
            var tempNode = null;
            findNode(scopeNumber, node);
            retVal = tempNode.getSymbol(varName).type;
            while (!retVal && tempNode != this.symbolTable.getRoot()) {
                tempNode = tempNode.parent;
                retVal = tempNode.getSymbol(varName).type;
            }
            return retVal;
            function findNode(scopeNumber, node) {
                if (node.scopeNumber == scopeNumber) {
                    tempNode = node;
                }
                for (var i = 0; i < node.getChildren().length; i++) {
                    findNode(scopeNumber, node.getChildren()[i]);
                }
            }
        };
        // checkStaticTable - check to see if the variable already exist in the
        // static table. If yes, just return the entry. If not, create a new instance
        // and return it
        CodeGeneration.prototype.checkStaticTable = function (varName) {
            var retVal = null;
            for (var key in this.StaticTable) {
                var entry = this.StaticTable[key];
                if (entry.variable == varName && entry.scope == this.scopeNumber) {
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
            // Print the static
            // for (var key in this.StaticTable) {
            //     console.log(this.StaticTable[key].tempName + " " + this.StaticTable[key].scope + " " + this.StaticTable[key].offset);
            // }
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
        return CodeGeneration;
    })();
    Compiler.CodeGeneration = CodeGeneration;
    // Bytes represented in the executable image
    var Byte = (function () {
        function Byte(byte) {
            this.isTempVar = false;
            this.isJumpVar = false;
            this.byte = byte;
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
        function JumpVar() {
        }
        return JumpVar;
    })();
    Compiler.JumpVar = JumpVar;
})(Compiler || (Compiler = {}));
