/// <reference path="ConcreteSyntaxTree.ts"/>
/*
SymbolTable - For scope checking
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
                console.log("Block detected. " + this.scopeNum);
                this.addScope(newScope);
            }

            // If it is VarDecl, add the variable to the symbol table
            if (node.getName() == "VarDecl") {
                var symbol = new Symbol();

                // First Child of the node is the type
                symbol.type = node.getChildren()[0].getName();

                // Second Child of the node is the variable name
                symbol.name = node.getChildren()[1].getName();
                symbol.lineNumber = node.getLineNumber();
                symbol.scopeNumber = this.currentNode.scopeNumber;

                this.currentNode.addSymbol(symbol);

                console.log("New Symbol: " + symbol.type + " " + symbol.name + " Scope: " + symbol.scopeNumber);
            }

            // Traverse the AST to create scope for each variable
            if (node.getChildren().length == 0 || !node.getChildren()) {
                // Leaf Node
                //console.log("Hit a Leaf Node: " + node.getName());
            } else {
                for (var i = 0; i < node.getChildren().length; i++) {
                    this.create(node.getChildren()[i]);
                }
            }

            //console.log("Exiting Scope " + this.currentNode.scopeNumber);
            // Return to Parent after going through all the children
            this.returnToParent();
        };

        SymbolTable.prototype.addScope = function (scope) {
            if (!this.root || this.root == null) {
                this.root = scope;
            } else {
                scope.parent = this.currentNode;
                this.currentNode.addNode(scope);
            }

            this.currentNode = scope;
        };

        SymbolTable.prototype.returnToParent = function () {
            if (this.currentNode == this.root) {
                return;
            }

            if (this.currentNode.parent) {
                this.currentNode = this.currentNode.parent;
            } else {
                console.log("This shouldn't really happen.");
            }
        };
        return SymbolTable;
    })();
    Compiler.SymbolTable = SymbolTable;

    var ScopeNode = (function () {
        function ScopeNode() {
            this.members = {};
            this.children = [];
        }
        ScopeNode.prototype.addSymbol = function (sym) {
            this.members[sym.name] = sym;
        };

        ScopeNode.prototype.addNode = function (node) {
            this.children.push(node);
        };
        return ScopeNode;
    })();
    Compiler.ScopeNode = ScopeNode;

    var Symbol = (function () {
        function Symbol() {
            this.isUsed = false;
        }
        return Symbol;
    })();
    Compiler.Symbol = Symbol;
})(Compiler || (Compiler = {}));
