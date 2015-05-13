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
            this.StaticTable = [];
            this.JumpTable = [];
            this.scopeNumber = -1;
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
                // Integer
                if (node.getChildren()[0].getName() == "int") {
                    // Machine code for integer declaration:
                    // A9 00 -> Store ACC with constant 00 (default value for int)
                    this.addByte(new Byte("A9"), this.index, false);
                    this.addByte(new Byte("00"), this.index, false);
                    // 8D T0 XX -> Store the accumulator in memory (T0 XX represents a memory location in stack)
                    this.addByte(new Byte("8D"), this.index, false);
                    var tempByte = new Byte("T0");
                    tempByte.isTempVar = true;
                    this.addByte(tempByte, this.index, false);
                    this.addByte(new Byte("XX"), this.index, false);
                    this.index += 5;
                }
            }
            if (node.getName() == "AssignmentStatement") {
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
        };
        CodeGeneration.prototype.getType = function (varName, scopeNumber, node) {
            if (scopeNumber == node.scopeNumber) {
                return node.getSymbol(varName).type;
            }
            for (var i = 0; i < node.getChildren().length; i++) {
                this.getType(varName, scopeNumber, node.getChildren()[i]);
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
    var TempVar = (function () {
        function TempVar() {
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
