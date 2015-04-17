/// <reference path="ConcreteSyntaxTree.ts"/>
/*
    SymbolTable - For scope checking
*/
module Compiler {
    export class SymbolTable {
        private scopeNum: number;
        private root: ScopeNode;
        private currentNode: ScopeNode;
        constructor() {
            this.scopeNum = 0;
        }

        public create(node: Node): void {
            // If it finds a block, start a new scope
            if(node.getName() == "Block") {
                // Start a new scope
                var newScope = new ScopeNode();
                // Assign a new scope number
                newScope.scopeNumber = ++this.scopeNum;
                //console.log("Block detected. " + this.scopeNum);
                this.addScope(newScope);
            }
            // If it is VarDecl, add the variable to the symbol table
            if(node.getName() == "VarDecl") {
                var symbol = new Symbol();
                // First Child of the node is the type
                symbol.type = node.getChildren()[0].getName();
                // Second Child of the node is the variable name
                symbol.name = node.getChildren()[1].getName();
                symbol.lineNumber = node.getLineNumber();
                symbol.scopeNumber = this.currentNode.scopeNumber;

                this.currentNode.addSymbol(symbol);

                //console.log("New Symbol: " + symbol.type + " " + symbol.name + " Scope: " + symbol.scopeNumber);
            }
            // If it is AssignmentStatment, type check
            if(node.getName() == "AssignmentStatement") {
            	// Look up the type of the ID
                var id = node.getChildren()[0].getName();
                var idSymbol;
                var curScope = this.currentNode;
                while(curScope != null || curScope != undefined) {
                	// Try to find it 
                    idSymbol = curScope.getSymbol(id);
                    if(idSymbol) {
                    	// If it finds it, assign the result to the variable
                    	// and break from the while loop
                        break;
                    } else {
                    	// If not, go up the scope
                        curScope = curScope.parent;
                    }
                }

                if(!idSymbol) {
                	// If it doesn't find it, throw an error;
                    var errStr = "Undeclared Variable <strong>" + id + "</strong> on line " + node.getChildren()[0].getLineNumber() + ".";
                    throw errStr;
                } else {
                	// If not, Type check
                }
            }
            // Traverse the AST to create scope for each variable
            if (node.getChildren().length != 0 || node.getChildren()) {
                for (var i = 0; i < node.getChildren().length; i++) {
                    this.create(node.getChildren()[i]);
                }
            }

            //console.log("Exiting Scope " + this.currentNode.scopeNumber);
            // Return to Parent after going through all the children
            this.returnToParent();
        }

        public addScope(scope: ScopeNode): void {
            if(!this.root || this.root == null) {
                this.root = scope;
            } else {
                scope.parent = this.currentNode;
                this.currentNode.addNode(scope);
            }

            this.currentNode = scope;
        }

        public returnToParent(): void {
            if(this.currentNode == this.root) {
                return;
            }

            if(this.currentNode.parent) {
                this.currentNode = this.currentNode.parent;
            } else {
                console.log("This shouldn't really happen.");
            }
        }
    }

    export class ScopeNode {
        public scopeNumber: number;
        public members;
        public parent: ScopeNode;
        public children: ScopeNode[];

        constructor() {
            this.members = {};
            this.children = [];
        }

        public addSymbol(sym: Symbol): void {
            this.members[sym.name] = sym;
        }

        public addNode(node: ScopeNode): void {
            this.children.push(node);
        }

        public getSymbol(id: string): Symbol {
            return this.members[id];
        }
    }

    export class Symbol {
        public type: string;
        public name: string;
        public lineNumber: number;
        public scopeNumber: number;
        public isUsed: boolean = false;
        public isInitialized: boolean = false;

        // constructor(type, name, lineNumber, scope) {
        //     this.type = type;
        //     this.name = name;
        //     this.lineNumber = lineNumber;
        //     this.scopeNumber = scope;
        // }
    }
}
