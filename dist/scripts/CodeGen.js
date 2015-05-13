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
            this.TempVarCount = 0;
            this.StaticTable = [];
            this.JumpTable = [];
            this.scopeNumber = 0;
            this.index = 0;
            this.heapIndex = 255;
            this.symbolTable = symbolTable;
        }
        // Take the AST and convert it to machine code
        CodeGeneration.prototype.toMachineCode = function (node) {
            // traverse the AST
            if (node.getName() == "Block") {
                this.scopeNumber++;
            }
            if (node.getName() == "VarDecl") {
                var varName = node.getChildren()[1].getName();
                // Integer
                if (node.getChildren()[0].getName() == "int") {
                    // Machine code for integer declaration:
                    // A9 00 -> Store ACC with constant 00 (default value for int)
                    this.addByte(new Byte("A9"), this.index, false);
                    this.addByte(new Byte("00"), this.index, false);
                    // 8D T0 XX -> Store the accumulator in memory (T0 XX represents a memory location in stack)
                    this.addByte(new Byte("8D"), this.index, false);
                    // Check the static table for the variable
                    var tempVar = this.checkTempTable(varName, this.scopeNumber);
                    if (!tempVar) {
                        tempVar = new TempVar(this.TempVarCount++, varName, this.scopeNumber);
                        this.StaticTable.push(tempVar);
                    }
                    var tempByte = new Byte(tempVar.tempName);
                    tempByte.isTempVar = true;
                    this.addByte(tempByte, this.index, false);
                    this.addByte(new Byte("XX"), this.index, false);
                }
            }
            if (node.getName() == "AssignmentStatement") {
                var varName = node.getChildren()[0].getName();
                var varType = this.getType(varName, this.scopeNumber, this.symbolTable.getRoot());
                // Integer
                if (varType == "int") {
                    var value = node.getChildren()[1].getName();
                    // Pad the 0 for numbers
                    if (value.length < 2) {
                        value = "0" + value;
                    }
                    // A9 value -> Store ACC with the given constant
                    this.addByte(new Byte("A9"), this.index, false);
                    this.addByte(new Byte(value), this.index, false);
                    // 8D T0 XX
                    this.addByte(new Byte("8D"), this.index, false);
                    var tempVar = this.checkTempTable(varName, this.scopeNumber);
                    if (!tempVar) {
                        tempVar = new TempVar(this.TempVarCount++, varName, this.scopeNumber);
                        this.StaticTable.push(tempVar);
                    }
                    var tempByte = new Byte(tempVar.tempName);
                    tempByte.isTempVar = true;
                    this.addByte(tempByte, this.index, false);
                    this.addByte(new Byte("XX"), this.index, false);
                }
            }
            for (var i = 0; i < node.getChildren().length; i++) {
                this.toMachineCode(node.getChildren()[i]);
            }
            if (node.getName() == "Block") {
                this.scopeNumber--;
            }
        };
        CodeGeneration.prototype.addByte = function (byte, index, isReplacing) {
            // The total size of the executable image is 256 bytes startings from 0 to 255
            if (index >= 256) {
                throw "Index exceeds maxmium size of the executable image.";
            }
            if (this.ExecutableImage[index] != null && !isReplacing) {
                throw "There is already a byte at index " + index + " .";
            }
            this.ExecutableImage[index] = byte;
            this.index++;
        };
        CodeGeneration.prototype.getType = function (varName, scopeNumber, node) {
            if (scopeNumber == node.scopeNumber) {
                return node.getSymbol(varName).type;
            }
            for (var i = 0; i < node.getChildren().length; i++) {
                this.getType(varName, scopeNumber, node.getChildren()[i]);
            }
        };
        CodeGeneration.prototype.checkTempTable = function (varName, scope) {
            var retVal = null;
            for (var i = 0; i < this.StaticTable.length; i++) {
                var tempVar = this.StaticTable[i];
                if (tempVar.variable == varName && tempVar.scope == scope) {
                    retVal = tempVar;
                }
            }
            return retVal;
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
    var TempVar = (function () {
        function TempVar(count, variable, scope) {
            this.tempName = "T" + count;
            this.variable = variable;
            this.scope = scope;
            this.offset = count;
        }
        return TempVar;
    })();
    Compiler.TempVar = TempVar;
    // To keep track of the jump offset for branching
    var JumpVar = (function () {
        function JumpVar() {
        }
        return JumpVar;
    })();
    Compiler.JumpVar = JumpVar;
})(Compiler || (Compiler = {}));
