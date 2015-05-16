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

        CodeGeneration.prototype.addScope = function (scope) {
            if (!this.root || this.root == null) {
                this.root = scope;
            } else {
                scope.parent = this.currentNode;
                this.currentNode.children.push(scope);
            }

            this.currentNode = scope;
        };

        CodeGeneration.prototype.exitScope = function () {
            if (this.currentNode == this.root) {
                return;
            }

            if (this.currentNode.parent) {
                this.currentNode = this.currentNode.parent;
            } else {
                console.log("This shouldn't really happen.");
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

                var newScope = new StaticNode();
                newScope.scopeNumber = this.scopeNumber;
                this.addScope(newScope);
            }

            if (node.getName() == "VarDecl") {
                var varName = node.getChildren()[1].getName();

                // Integer
                if (node.getChildren()[0].getName() == "int") {
                    this.addToStaticTable(varName);

                    // Machine code for integer declaration:
                    // A9 00 -> Store ACC with constant 00 (default value for int)
                    this.LoadAccWithConst("0");

                    // 8D TX XX -> Store the accumulator in memory (T0 XX represents a memory location in stack)
                    this.StoreAccInMem(this.findStaticVar(varName));
                } else if (node.getChildren()[0].getName() == "string") {
                    // String
                    // For a string declaration, simply add an entry to the static table
                    this.addToStaticTable(varName);
                } else if (node.getChildren()[0].getName() == "boolean") {
                    this.addToStaticTable(varName);

                    // default value for boolean is false
                    this.LoadAccWithConst((245).toString(16));
                    this.StoreAccInMem(this.findStaticVar(varName));
                }
            }

            if (node.getName() == "AssignmentStatement") {
                var varName = node.getChildren()[0].getName();
                var varType = this.getType(varName, this.scopeNumber, this.symbolTable.getRoot());

                if (varType == "int") {
                    if (node.getChildren()[1].getName() == "+") {
                        // clear TS
                        this.LoadAccWithConst("00");
                        this.StoreAccInMem("TS");
                        this.generateIntExpr(node.getChildren()[1]);
                        this.LoadAccFromMem("TS");
                        this.StoreAccInMem(this.findStaticVar(varName));
                    } else {
                        var value = node.getChildren()[1].getName();

                        // A9 value -> Store ACC with the given constant
                        this.LoadAccWithConst(value);

                        // 8D TX XX
                        this.StoreAccInMem(this.findStaticVar(varName));
                    }
                } else if (varType == "string") {
                    // for string assignment, write the characters to heap
                    var str = node.getChildren()[1].getChildren()[0].getName();

                    // A9 XX (XX is the starting location of the string)
                    var memLocation = this.StoreStringToHeap(str);
                    this.LoadAccWithConst(memLocation);

                    // 8D TX XX
                    this.StoreAccInMem(this.findStaticVar(varName));
                } else if (varType == "boolean") {
                    // Store the address of true and false into accumulator
                    // Location of true string in heap is 251
                    // Location of false string in heap is 245
                    var address = (node.getChildren()[1].getName() == "true") ? 251 : 245;
                    var addressStr = address.toString(16);
                    this.LoadAccWithConst(addressStr);
                    this.StoreAccInMem(this.findStaticVar(varName));
                }
            }

            if (node.getName() == "PrintStatement") {
                // Case 1: Identifier
                if (node.getChildren()[0].getName().match(/^[a-z]$/g)) {
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
                } else if (node.getChildren()[0].getName() == "StringExpr") {
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
                    this.generateEquality(node.getChildren()[0]);
                }
            }

            if (node.getName() == "WhileStatement") {
                if (node.getChildren()[0].getName() == "==") {
                    this.generateEquality(node.getChildren()[0]);
                }
                throw "While statement is not supported.";
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
                if (this.curScopeNode.parent) {
                    this.curScopeNode = this.curScopeNode.parent;
                }

                this.exitScope();
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
            } else {
                this.index++;
            }
        };

        CodeGeneration.prototype.getType = function (varName, scopeNumber, node) {
            var retVal = null;
            var tempNode = null;
            tempNode = this.curScopeNode;
            while (!retVal || tempNode != this.symbolTable.getRoot()) {
                if (tempNode) {
                    if (tempNode.getSymbol(varName)) {
                        retVal = tempNode.getSymbol(varName).type;
                    }
                }
                if (tempNode.parent) {
                    tempNode = tempNode.parent;
                }
            }

            return retVal;
        };

        // checkStaticTable - check to see if the variable already exist in the
        // static table. If yes, just return the entry. If not, create a new instance
        // and return it
        CodeGeneration.prototype.addToStaticTable = function (varName) {
            var retVal = null;
            retVal = new StaticVar(this.StaticVarCount++, varName, this.scopeNumber);
            this.StaticTable[retVal.tempName] = retVal;
            this.currentNode.members[varName] = retVal;
        };

        // findStaticVar - finds the static variable name with the real variable name
        CodeGeneration.prototype.findStaticVar = function (varName) {
            var retVal = null;
            var tempNode = this.currentNode;
            while (tempNode != null || tempNode != undefined) {
                retVal = tempNode.members[varName];
                if (retVal) {
                    break;
                }
                tempNode = tempNode.parent;
            }
            retVal = tempNode.members[varName].tempName;
            return retVal;
        };

        // After all the instructions have been set, we need to go back to the Temporary variables and replace them with
        // actual locations
        CodeGeneration.prototype.replaceTemp = function () {
            // Add a TEMP address for comparison
            var newTempStaticVar = new StaticVar(this.StaticVarCount++, null, null);
            newTempStaticVar.tempName = "TT";
            this.StaticTable[newTempStaticVar.tempName] = newTempStaticVar;
            newTempStaticVar = new StaticVar(this.StaticVarCount++, null, null);
            newTempStaticVar.tempName = "TS";
            this.StaticTable[newTempStaticVar.tempName] = newTempStaticVar;

            for (var key in this.StaticTable) {
                console.log(this.StaticTable[key].tempName + " " + this.StaticTable[key].scope + " " + this.StaticTable[key].variable);
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
                } else if (tempByte.isJumpVar) {
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
            var tempByte = new Byte(varName);
            tempByte.isTempVar = true;
            this.addByte(tempByte, this.index, false);
            this.addByte(new Byte("00"), this.index, false);
        };

        // A9 XX - load accumulator with a constant
        CodeGeneration.prototype.LoadAccWithConst = function (constant) {
            this.addByte(new Byte("A9"), this.index, false);
            this.addByte(new Byte(constant), this.index, false);
        };

        // AD XX XX - load accumulator from memory
        CodeGeneration.prototype.LoadAccFromMem = function (varName) {
            this.addByte(new Byte("AD"), this.index, false);
            var tempByte = new Byte(varName);
            tempByte.isTempVar = true;
            this.addByte(tempByte, this.index, false);
            this.addByte(new Byte("00"), this.index, false);
        };

        // AC TX XX - load Y register from memory
        CodeGeneration.prototype.LoadYRegFromMem = function (varName) {
            this.addByte(new Byte("AC"), this.index, false);
            var tempByte = new Byte(varName);
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

        // AE XX XX - load X register from memory
        CodeGeneration.prototype.LoadXRegFromMem = function (varName) {
            this.addByte(new Byte("AE"), this.index, false);
            var tempByte = new Byte(varName);
            tempByte.isTempVar = true;
            this.addByte(tempByte, this.index, false);
            this.addByte(new Byte("00"), this.index, false);
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
            var tempByte = new Byte(varName);
            tempByte.isTempVar = true;
            this.addByte(tempByte, this.index, false);
            this.addByte(new Byte("00"), this.index, false);
        };

        // 6D - Add with carry
        CodeGeneration.prototype.AddWithCarry = function (varName) {
            this.addByte(new Byte("6D"), this.index, false);
            var tempByte = new Byte(varName);
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
            } else if (firstOperand.getName() == "StringExpr" && secondOperand.getName() == "StringExpr") {
                var firstStr = firstOperand.getChildren()[0].getName();
                var secondStr = secondOperand.getChildren()[0].getName();

                // Going to cheat with javascript comparison
                if (firstStr == secondStr) {
                    this.LoadXRegWithConst("01");
                } else {
                    this.LoadXRegWithConst("02");
                }
                this.LoadAccWithConst("01");
                this.StoreAccInMem("TT");
                this.CompareMemoryToXReg("TT");
                this.BranchNotEqual();
            } else if (firstOperand.getName() == "StringExpr" || secondOperand.getName() == "StringExpr") {
                throw "ID to String comparison is not supported yet.";
            } else {
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
                } else if (firstOperand.getName().match(/^[a-z]$/g) && secondOperand.getName().match(/^[a-z]$/g)) {
                    // ID to ID
                    this.LoadXRegFromMem(this.findStaticVar(firstOperand.getName()));
                    this.CompareMemoryToXReg(this.findStaticVar(secondOperand.getName()));
                    this.BranchNotEqual();
                } else if (firstOperand.getName().match(/^((true)|(false))$/g) || secondOperand.getName().match(/^((true)|(false))$/g)) {
                    // ID to boolean
                    if (firstOperand.getName().match(/^((true)|(false))$/g)) {
                        if (firstOperand.getName() == "true") {
                            this.LoadAccWithConst("FB");
                        } else {
                            this.LoadAccWithConst("F5");
                        }
                    } else {
                        if (secondOperand.getName() == "true") {
                            this.LoadAccWithConst("FB");
                        } else {
                            this.LoadAccWithConst("F5");
                        }
                    }
                    this.StoreAccInMem("TT");
                    if (firstOperand.getName().match(/^[a-z]$/g)) {
                        this.LoadXRegFromMem(this.findStaticVar(firstOperand.getName()));
                    } else {
                        this.LoadXRegFromMem(this.findStaticVar(secondOperand.getName()));
                    }
                    this.CompareMemoryToXReg("TT");
                    this.BranchNotEqual();
                } else if (firstOperand.getName().match(/^[0-9]$/g) || secondOperand.getName().match(/^[0-9]$/g)) {
                    if (firstOperand.getName().match(/^[a-z]$/g)) {
                        this.LoadXRegFromMem(this.findStaticVar(firstOperand.getName()));
                    } else {
                        this.LoadXRegFromMem(this.findStaticVar(secondOperand.getName()));
                    }

                    if (firstOperand.getName().match(/^[0-9]$/g)) {
                        this.LoadAccWithConst(firstOperand.getName());
                    } else {
                        this.LoadAccWithConst(secondOperand.getName());
                    }

                    this.StoreAccInMem("TT");
                    this.CompareMemoryToXReg("TT");
                    this.BranchNotEqual();
                }
            }
        };

        // Basically nagate equality
        CodeGeneration.prototype.generateInequality = function (node) {
            this.generateEquality(node);
            throw "Inequality not supported yet.";
        };

        // Generate integer expression
        CodeGeneration.prototype.generateIntExpr = function (node) {
            var firstOperand = node.getChildren()[0];
            var secondOperand = node.getChildren()[1];
            if (secondOperand.getName() == "+") {
                this.generateIntExpr(secondOperand);
            } else {
                if (firstOperand.getName().match(/^[a-z]$/g)) {
                    this.LoadAccFromMem(this.findStaticVar(firstOperand.getName()));
                } else {
                    this.LoadAccWithConst(firstOperand.getName());
                }

                if (secondOperand.getName().match(/^[a-z]$/g)) {
                    this.AddWithCarry(this.findStaticVar(secondOperand.getName()));
                } else {
                    this.StoreAccInMem("TT");
                    this.LoadAccWithConst(secondOperand.getName());
                    this.AddWithCarry("TT");
                }

                // ACC has the saum
                this.AddWithCarry("TS");
                this.StoreAccInMem("TS");
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

    var StaticNode = (function () {
        function StaticNode() {
            this.children = [];
            this.members = [];
        }
        return StaticNode;
    })();
    Compiler.StaticNode = StaticNode;
})(Compiler || (Compiler = {}));
