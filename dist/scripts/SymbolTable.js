/// <reference path="ConcreteSyntaxTree.ts"/>
/*
    SymbolTable - Scope checking and type checking is done while traversing the AST.
*/
var Compiler;
(function (Compiler) {
    var SymbolTable = (function () {
        function SymbolTable() {
            this.scopeNum = 0;
        }
        SymbolTable.prototype.create = function (node) {
            // If it finds a block, start a new scope
            if (node.getName() == "Block") {
                // Start a new scope
                var newScope = new ScopeNode();
                // Assign a new scope number
                newScope.scopeNumber = ++this.scopeNum;
                //console.log("Block detected. " + this.scopeNum);
                this.addScope(newScope);
            }
            // If it is VarDecl, add the variable to the symbol table
            if (node.getName() == "VarDecl") {
                var varName = node.getChildren()[1].getName();
                // first check if variable name is already declared in the scope
                if (this.currentNode.getSymbol(varName)) {
                    var errStr = "Variable <strong>" + varName + "</strong> on line " + node.getChildren()[1].getLineNumber() + " is already declared!";
                    throw errStr;
                }
                var symbol = new Symbol();
                // First Child of the node is the type
                symbol.type = node.getChildren()[0].getName();
                // Second Child of the node is the variable name
                symbol.name = varName;
                symbol.lineNumber = node.getChildren()[1].getLineNumber();
                symbol.scopeNumber = this.currentNode.scopeNumber;
                this.currentNode.addSymbol(symbol);
            }
            // If it is AssignmentStatment, type check
            if (node.getName() == "AssignmentStatement") {
                // Look up the type of the ID
                var id = node.getChildren()[0].getName();
                var idSymbol = this.findId(id);
                if (!idSymbol) {
                    // If it doesn't find it, throw an error;
                    var errStr = "Undeclared Variable <strong>" + id + "</strong> on line " + node.getChildren()[0].getLineNumber() + ".";
                    throw errStr;
                }
                else {
                    // If it does, Type check
                    var idType = idSymbol.type;
                    var assignedType;
                    if (node.getChildren()[1].isIdentifier) {
                        // If the right hand side is an identifier, need to find it's real type
                        var tempSymbol = this.findId(node.getChildren()[1].getName());
                        if (!tempSymbol) {
                            var errStr = "Undeclared Variable <strong>" + id + "</strong> on line " + node.getChildren()[0].getLineNumber() + ".";
                            throw errStr;
                        }
                        else {
                            assignedType = tempSymbol.type;
                        }
                    }
                    else {
                        assignedType = node.getChildren()[1].getName();
                    }
                    var errStr = "Type Mismatch: variable <strong>[" + id + "]</strong> on line " + node.getChildren()[0].getLineNumber() + ".";
                    if (idType == "string") {
                        // if the id type is a string, the assigned type should be a string expression.
                        if (assignedType == "StringExpr" || assignedType == "string") {
                        }
                        else {
                            throw errStr;
                        }
                    }
                    else if (idType == "boolean") {
                        if (assignedType == "true" || assignedType == "false" || assignedType == "==" || assignedType == "!=" || assignedType == "boolean") {
                        }
                        else {
                            throw errStr;
                        }
                    }
                    else if (idType == "int") {
                        var digit = /^[0-9]$/;
                        if (assignedType == "+" || digit.test(assignedType) || assignedType == "int") {
                        }
                        else {
                            throw errStr;
                        }
                    }
                    // Mark the ID as initialized
                    idSymbol.isInitialized = true;
                }
            }
            if (node.getName() == "+") {
                // Just need to check if the second child is the right type
                var child = node.getChildren()[1];
                if (child.isIdentifier) {
                    var symbol = this.findId(child.getName());
                    if (symbol) {
                        if (symbol.type == "int") {
                            // Epsilon
                            symbol.isUsed = true;
                        }
                        else {
                            var errStr = "Type Mismatch: variable <strong>[" + child.getName() + "]</strong> on line " + child.getLineNumber() + ".";
                            throw errStr;
                        }
                    }
                    else {
                        var errStr = "Undeclared Variable <strong>" + child.getName() + "</strong> on line " + child.getLineNumber() + ".";
                        throw errStr;
                    }
                }
                else if (child.getName() == "+" || child.isDigit) {
                }
                else {
                    var errStr = "Type Mismatch: variable <strong>[" + child.getName() + "]</strong> on line " + child.getLineNumber() + ".";
                    throw errStr;
                }
            }
            if (node.getName() == "==" || node.getName() == "!=") {
                // Compare the left and the right operand
                var first = node.getChildren()[0];
                var second = node.getChildren()[1];
                var firstType = first.getName();
                var secondType = second.getName();
                var boolval = /^((false)|(true))$/;
                var digit = /^[0-9]$/;
                var boolop = /^((==)|(!=))$/;
                // A few special cases 
                if (boolval.test(firstType) || boolop.test(firstType)) {
                    firstType = "boolean";
                }
                if (boolval.test(secondType) || boolop.test(secondType)) {
                    secondType = "boolean";
                }
                if (digit.test(firstType)) {
                    firstType = "int";
                }
                if (digit.test(secondType)) {
                    secondType = "int";
                }
                if (first.isIdentifier) {
                    var symbol = this.findId(first.getName());
                    if (symbol) {
                        firstType = (symbol.type == "string") ? "StringExpr" : symbol.type;
                        symbol.isUsed = true;
                    }
                    else {
                        var errStr = "Undeclared Variable <strong>" + first.getName() + "</strong> on line " + first.getLineNumber() + ".";
                        throw errStr;
                    }
                }
                if (second.isIdentifier) {
                    var symbol = this.findId(second.getName());
                    if (symbol) {
                        secondType = (symbol.type == "string") ? "StringExpr" : symbol.type;
                        symbol.isUsed = true;
                    }
                    else {
                        var errStr = "Undeclared Variable <strong>" + second.getName() + "</strong> on line " + second.getLineNumber() + ".";
                        throw errStr;
                    }
                }
                if (firstType != secondType) {
                    var errStr = "Type Mismatch between <strong>[" + first.getName()
                        + "]</strong> and <strong>[" + second.getName() + "]</strong> on line " + first.getLineNumber() + ".";
                    throw errStr;
                }
            }
            if (node.getName() == "PrintStatement") {
                if (node.getChildren().length == 1) {
                    var child = node.getChildren()[0];
                    if (child.isIdentifier) {
                        var symbol = this.findId(child.getName());
                        if (!symbol) {
                            var errStr = "Undeclared Variable <strong>" + child.getName() + "</strong> on line " + child.getLineNumber() + ".";
                            throw errStr;
                        }
                        else {
                            symbol.isUsed = true;
                        }
                    }
                }
            }
            // Traverse the AST to create scope for each variable
            for (var i = 0; i < node.getChildren().length; i++) {
                this.create(node.getChildren()[i]);
            }
            //console.log("Exiting Scope " + this.currentNode.scopeNumber);
            // Exit scope if the node is a block
            if (node.getName() == "Block") {
                this.exitScope();
            }
        };
        SymbolTable.prototype.findId = function (id) {
            var curScope = this.currentNode;
            var retVal;
            while (curScope != null || curScope != undefined) {
                // Try to find it 
                retVal = curScope.getSymbol(id);
                if (retVal) {
                    // If it finds it, assign the result to the variable
                    // and break from the while loop
                    break;
                }
                else {
                    // If not, go up the scope
                    curScope = curScope.parent;
                }
            }
            return retVal;
        };
        SymbolTable.prototype.addScope = function (scope) {
            if (!this.root || this.root == null) {
                this.root = scope;
            }
            else {
                scope.parent = this.currentNode;
                this.currentNode.addNode(scope);
            }
            this.currentNode = scope;
        };
        SymbolTable.prototype.exitScope = function () {
            if (this.currentNode == this.root) {
                return;
            }
            if (this.currentNode.parent) {
                this.currentNode = this.currentNode.parent;
            }
            else {
                console.log("This shouldn't really happen.");
            }
        };
        SymbolTable.prototype.getRoot = function () {
            return this.root;
        };
        return SymbolTable;
    })();
    Compiler.SymbolTable = SymbolTable;
    var ScopeNode = (function () {
        function ScopeNode() {
            this.members = [];
            this.children = [];
        }
        ScopeNode.prototype.addSymbol = function (sym) {
            this.members[sym.name] = sym;
        };
        ScopeNode.prototype.addNode = function (node) {
            this.children.push(node);
        };
        ScopeNode.prototype.getSymbol = function (id) {
            return this.members[id];
        };
        ScopeNode.prototype.getChildren = function () {
            return this.children;
        };
        return ScopeNode;
    })();
    Compiler.ScopeNode = ScopeNode;
    var Symbol = (function () {
        function Symbol() {
            this.isUsed = false;
            this.isInitialized = false;
        }
        return Symbol;
    })();
    Compiler.Symbol = Symbol;
})(Compiler || (Compiler = {}));
