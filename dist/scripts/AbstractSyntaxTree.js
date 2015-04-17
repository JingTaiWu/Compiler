/// <reference path="ConcreteSyntaxTree.ts"/>
/*
Abstract Syntax Tree - building from concrete syntax tree
*/
var Compiler;
(function (Compiler) {
    var AbstractSyntaxTree = (function () {
        function AbstractSyntaxTree() {
            // For string concatenation
            this.buffering = false;
            this.buffer = "";
        }
        // convert the CST to AST through traversing
        AbstractSyntaxTree.prototype.convert = function (node) {
            //var name = node.getName();
            var character = /^([a-z])|(\s)$/;
            var isBranch = false;

            //console.log("Current node in recursive call " + node.getName());
            if (node.getName() == "Block") {
                this.addNode(node, true);
                isBranch = true;
            } else if (node.getName() == "PrintStatement") {
                this.addNode(node, true);
                isBranch = true;
            } else if (node.getName() == "AssignmentStatement") {
                this.addNode(node, true);
                isBranch = true;
            } else if (node.getName() == "VarDecl") {
                this.addNode(node, true);
                isBranch = true;
            } else if (node.getName() == "WhileStatement") {
                this.addNode(node, true);
                isBranch = true;
            } else if (node.getName() == "IfStatement") {
                this.addNode(node, true);
                isBranch = true;
            } else if (node.getName() == "StringExpr") {
                this.addNode(node, true);
                isBranch = true;
            } else if (node.getName() == "Id") {
                // For Identifier token, we can skip the ID node and keep the name of ID
                node.getChildren()[0].isIdentifier = true;
                this.addNode(node.getChildren()[0], false);
                isBranch = false;
            } else if (node.getName() == "int" || node.getName() == "string" || node.getName() == "boolean") {
                this.addNode(node, false);
                isBranch = false;
            } else if (node.getName() == "IntExpr") {
                // Two cases for IntExpr
                // If there are more than one child, it's addition
                // If not, it's an integer
                if (node.getChildren().length == 1) {
                    this.addNode(node.getChildren()[0], false);
                } else {
                    var newNode = new Compiler.Node("+");
                    this.addNode(newNode, true);
                    this.addNode(node.getChildren()[0], false);
                }
            } else if (character.test(node.getName()) && node.isChar) {
                //this.addNode(node, false);
                this.buffer += node.getName();
                isBranch = false;
            } else if (node.getName() == "BooleanExpr") {
                // Two cases for BooleanExpr
                // If there are more than one child, it's an expression
                // Otherwise, it is a boolean value
                if (node.getChildren().length == 1) {
                    this.addNode(node.getChildren()[0], false);
                    isBranch = false;
                } else {
                    // The node name will be determined based on the operator used
                    var nodeName = "";
                    for (var i = 0; i < node.getChildren().length; i++) {
                        if (node.getChildren()[i].getName() == "==") {
                            nodeName = "==";
                        } else if (node.getChildren()[i].getName() == "!=") {
                            nodeName = "!=";
                        }
                    }

                    var newNode = new Compiler.Node(nodeName);
                    newNode.setLineNumber(node.getLineNumber());
                    this.addNode(newNode, true);
                    isBranch = true;
                }
            } else if (node.getName() == "\"") {
                // This step is to concat all the character tokens together
                this.buffering = !this.buffering;
                if (!this.buffering) {
                    var newNode = new Compiler.Node(this.buffer);
                    newNode.setLineNumber(node.getLineNumber());
                    this.buffer = "";
                    this.addNode(newNode, false);
                    isBranch = false;
                }
            }

            for (var i = 0; i < node.getChildren().length; i++) {
                this.convert(node.getChildren()[i]);
            }

            if (isBranch) {
                this.returnToParent();
            }
        };

        AbstractSyntaxTree.prototype.addNode = function (node, isBranch) {
            var newNode = new Compiler.Node(node.getName());
            newNode.setLineNumber(node.getLineNumber());
            newNode.isIdentifier = node.isIdentifier;
            newNode.isChar = node.isChar;
            newNode.isBoolVal = node.isBoolVal;
            newNode.isDigit = node.isDigit;
            if (!this.root || this.root == null) {
                this.root = newNode;
                this.currentNode = newNode;
            } else {
                this.currentNode.addChild(newNode);
                newNode.setParentNode(this.currentNode);
            }

            if (isBranch) {
                this.currentNode = newNode;
            }
        };

        AbstractSyntaxTree.prototype.getRootNode = function () {
            return this.root;
        };

        AbstractSyntaxTree.prototype.returnToParent = function () {
            if (this.currentNode == this.root) {
                return;
            }

            if (this.currentNode.getParentNode()) {
                this.currentNode = this.currentNode.getParentNode();
            } else {
                console.log("This shouldn't really happen.");
            }
        };
        return AbstractSyntaxTree;
    })();
    Compiler.AbstractSyntaxTree = AbstractSyntaxTree;
})(Compiler || (Compiler = {}));
