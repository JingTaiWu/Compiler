/// <reference path="ConcreteSyntaxTree.ts"/>
/*
Abstract Syntax Tree - building from concrete syntax tree
*/
var Compiler;
(function (Compiler) {
    var AbstractSyntaxTree = (function () {
        function AbstractSyntaxTree(CST) {
            this.CST = CST;
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
                this.addNode(node, false);
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

        // Convert tree to a string
        AbstractSyntaxTree.prototype.toString = function () {
            var result = "";

            // recursive function to traverse the tree
            function expand(node, depth) {
                for (var i = 0; i < depth; i++) {
                    result += "-";
                }

                var children = node.getChildren();

                // If there are no children
                if (!children || children.length == 0) {
                    // append the name of the leaf node to the string
                    result += "[" + node.getName() + "]";
                    result += "\n";
                } else {
                    // If there are children, expand each one
                    result += "<" + node.getName() + "> \n";
                    for (var j = 0; j < children.length; j++) {
                        expand(node.getChildren()[j], depth + 1);
                    }
                }
            }

            // Call the recursive function
            expand(this.root, 0);
            return result;
        };
        return AbstractSyntaxTree;
    })();
    Compiler.AbstractSyntaxTree = AbstractSyntaxTree;
})(Compiler || (Compiler = {}));
