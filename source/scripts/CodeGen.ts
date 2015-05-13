/// <reference path="Node.ts"/>
/// <reference path="SymbolTable.ts"/>
/*
	Code Generation - translate the AST into machine code (6502a instruction page)
*/
module Compiler {
    export class CodeGeneration {
        public ExecutableImage: Byte[];
        private StaticTable: TempVar[];
        private JumpTable: JumpVar[];
        private scopeNumber: number;
        private index: number;
        private heapIndex: number;
        private symbolTable: SymbolTable;
        constructor(symbolTable: SymbolTable) {
            this.ExecutableImage = [];
            this.StaticTable = [];
            this.JumpTable = [];
            this.scopeNumber = -1;
            this.index = 0;
            this.heapIndex = 255;
            this.symbolTable = symbolTable;
        }

        // Take the AST and convert it to machine code
        public toMachineCode(node: Node): void {
            // traverse the AST
            if(node.getName() == "Block") {
                this.scopeNumber++;
            }

            if(node.getName() == "VarDecl") {
                // Integer
                if(node.getChildren()[0].getName() == "int") {
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

            if(node.getName() == "AssignmentStatement") {
                
            }

            for (var i = 0; i < node.getChildren().length; i++) {
                this.toMachineCode(node.getChildren()[i]);
            }

            if(node.getName() == "Block") {
                this.scopeNumber--;
            }
        }

        public addByte(byte: Byte, index: number, isReplacing: boolean): void {
            // The total size of the executable image is 256 bytes startings from 0 to 255
            if(index >= 256) {
                throw "Index exceeds maxmium size of the executable image."
            }

            if(this.ExecutableImage[index] != null && !isReplacing) {
                throw "There is already a byte at index " + index + " ."
            }

            this.ExecutableImage[index] = byte;
        }

        public getType(varName: string, scopeNumber: number, node: ScopeNode) {
            if(scopeNumber == node.scopeNumber) {
                return node.getSymbol(varName).type;
            }

            for (var i = 0; i < node.getChildren().length; i++) {
                this.getType(varName, scopeNumber, node.getChildren()[i]);
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
    export class TempVar {
        public temp: string;
        public variable: string;
        public scope: string;
        public offset: number;
    }

    // To keep track of the jump offset for branching
    export class JumpVar {
        public temp: string;
        public distance: number;
    }
}