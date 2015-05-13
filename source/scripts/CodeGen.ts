/// <reference path="Node.ts"/>
/// <reference path="SymbolTable.ts"/>
/*
	Code Generation - translate the AST into machine code (6502a instruction page)
*/
module Compiler {
    export class CodeGeneration {
        public ExecutableImage: Byte[];
        private StaticTable: TempVar[];
        private TempVarCount: number;
        private JumpTable: JumpVar[];
        private scopeNumber: number;
        private index: number;
        private heapIndex: number;
        private symbolTable: SymbolTable;
        constructor(symbolTable: SymbolTable) {
            this.ExecutableImage = [];
            this.TempVarCount = 0;
            this.StaticTable = [];
            this.JumpTable = [];
            this.scopeNumber = 0;
            this.index = 0;
            this.heapIndex = 255;
            this.symbolTable = symbolTable;
        }

        public toExecutableImage(node: Node): void {
            this.toMachineCode(node);
            console.log("Index: " + this.index);
            this.replaceTemp();
        }

        // Take the AST and convert it to machine code (Temp/Jump not replaced)
        public toMachineCode(node: Node): void {
            // traverse the AST
            if(node.getName() == "Block") {
                this.scopeNumber++;
            }

            if(node.getName() == "VarDecl") {
                var varName = node.getChildren()[1].getName();
                // Integer
                if(node.getChildren()[0].getName() == "int") {
                    // Machine code for integer declaration:
                    // A9 00 -> Store ACC with constant 00 (default value for int)
                    this.addByte(new Byte("A9"), this.index, false);
                    this.addByte(new Byte("00"), this.index, false);
                    // 8D T0 XX -> Store the accumulator in memory (T0 XX represents a memory location in stack)
                    this.addByte(new Byte("8D"), this.index, false);
                    // Check the static table for the variable
                    var tempVar = this.checkTempTable(varName, this.scopeNumber);
                    if(!tempVar) {
                        tempVar = new TempVar(this.TempVarCount++, varName, this.scopeNumber);
                        this.StaticTable[tempVar.tempName] = tempVar;
                    }
                    var tempByte = new Byte(tempVar.tempName);
                    tempByte.isTempVar = true;
                    this.addByte(tempByte, this.index, false);
                    this.addByte(new Byte("00"), this.index, false);
                }
            }

            if(node.getName() == "AssignmentStatement") {
                var varName = node.getChildren()[0].getName();
                var varType = this.getType(varName, this.scopeNumber, this.symbolTable.getRoot());
                // Integer
                if(varType == "int") {
                    var value = node.getChildren()[1].getName();
                    // Pad the 0 for numbers
                    if (value.length < 2) { value = "0" + value;}
                    // A9 value -> Store ACC with the given constant
                    this.addByte(new Byte("A9"), this.index, false);
                    this.addByte(new Byte(value), this.index, false);
                    // 8D T0 XX
                    this.addByte(new Byte("8D"), this.index, false);
                    var tempVar = this.checkTempTable(varName, this.scopeNumber);
                    if(!tempVar) {
                        tempVar = new TempVar(this.TempVarCount++, varName, this.scopeNumber);
                        this.StaticTable[tempVar.tempName] = tempVar;
                    }
                    var tempByte = new Byte(tempVar.tempName);
                    tempByte.isTempVar = true;
                    this.addByte(tempByte, this.index, false);
                    this.addByte(new Byte("00"), this.index, false);
                }
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
                throw "Index exceeds maxmium size of the executable image.";
            }

            if(this.ExecutableImage[index] != null && !isReplacing) {
                throw "There is already a byte at index " + index + " .";
            }

            this.ExecutableImage[index] = byte;
            this.index++;
        }

        public getType(varName: string, scopeNumber: number, node: ScopeNode) {
            if(scopeNumber == node.scopeNumber) {
                return node.getSymbol(varName).type;
            }

            for (var i = 0; i < node.getChildren().length; i++) {
                this.getType(varName, scopeNumber, node.getChildren()[i]);
            }
        }

        public checkTempTable(varName: string, scope: number): TempVar {
            var retVal = null;

            for(var key in this.StaticTable) {
                var entry = this.StaticTable[key];
                if(entry.variable == varName && entry.scope == scope) {
                    retVal = entry;
                }
            }
            return retVal;
        }

        // After all the instructions have been set, we need to go back to the Temporary variables and replace them with
        // actual locations
        public replaceTemp(): void {
            // Print the static
            for (var key in this.StaticTable) {
                console.log(this.StaticTable[key].tempName + " " + this.StaticTable[key].scope + " " + this.StaticTable[key].offset);
            }
            for (var i = 0; i < this.ExecutableImage.length; i++) {
                var tempByte = this.ExecutableImage[i];
                if(tempByte.isTempVar) {
                    // Look up the variable in the static table and get the offset
                    var offset = this.StaticTable[tempByte.byte].offset + this.index;
                    if(offset > 255) {
                        throw "Index Out Of Bound";
                    }
                    // Convert offset to a hex string
                    var offsetString = offset.toString(16).toUpperCase();
                    tempByte.byte = offsetString;
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
    export class TempVar {
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