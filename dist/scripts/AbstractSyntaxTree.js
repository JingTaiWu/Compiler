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
        AbstractSyntaxTree.prototype.convert = function (root, node) {
            if (node == null) {
                return;
            }
            if (root == null) {
                root = new Compiler.Node("Root");
            }

            //var name = node.getName();
            var IDRegEx = /^[a-z]$/;
            var newRoot = null;
            console.log("Current node in recursive call " + node.getName());
            if (node.getName() == "Block") {
                var newNode = new Compiler.Node("Block");
                newNode.setLineNumber(node.getLineNumber());

                //this.addNode(newNode, "BRANCH");
                root.addChild(newNode);
                newNode.setParentNode(root);
                newRoot = newNode;
            } else if (node.getName() == "PrintStatement") {
                var newNode = new Compiler.Node("PrintStmt");
                newNode.setLineNumber(node.getLineNumber());

                //this.addNode(newNode, "BRANCH");
                root.addChild(newNode);
                newNode.setParentNode(root);
                newRoot = newNode;
            } else if (node.getName() == "AssignmentStatement") {
                var newNode = new Compiler.Node("AssignStmt");
                newNode.setLineNumber(node.getLineNumber());

                //this.addNode(newNode, "BRANCH");
                root.addChild(newNode);
                newNode.setParentNode(root);
                newRoot = newNode;
            } else if (node.getName() == "VarDecl") {
                var newNode = new Compiler.Node("VarDecl");
                newNode.setLineNumber(node.getLineNumber());

                //this.addNode(newNode, "BRANCH");
                root.addChild(newNode);
                newNode.setParentNode(root);
                newRoot = newNode;
            } else if (node.getName() == "WhileStatement") {
                var newNode = new Compiler.Node("WhileStmt");
                newNode.setLineNumber(node.getLineNumber());

                //this.addNode(newNode, "BRANCH");
                root.addChild(newNode);
                newNode.setParentNode(root);
                newRoot = newNode;
            } else if (node.getName() == "IfStatement") {
                var newNode = new Compiler.Node("IfStmt");
                newNode.setLineNumber(node.getLineNumber());

                //this.addNode(newNode, "BRANCH");
                root.addChild(newNode);
                newNode.setParentNode(root);
                newRoot = newNode;
            } else if (node.getName() == "IntExpr") {
                // Int Expr has two cases
                // If the number of child of the current node is 1,
                // then it must be just a digit
                // Else it is an addition
                if (node.getChildren().length == 1) {
                    var child = node.getChildren()[0];
                    var newNode = new Compiler.Node(child.getName());
                    newNode.setLineNumber(child.getLineNumber());

                    //this.addNode(newNode, "LEAF");
                    root.addChild(newNode);
                    newNode.setParentNode(root);
                } else {
                    var newNode = new Compiler.Node("+");
                    newNode.setLineNumber(node.getLineNumber());

                    //this.addNode(newNode, "BRANCH");
                    root.addChild(newNode);
                    newNode.setParentNode(root);
                    newRoot = newNode;
                }
            } else if (IDRegEx.test(name)) {
                var newNode = new Compiler.Node("ID");
                newNode.setLineNumber(node.getLineNumber());

                //this.addNode(newNode, "LEAF");
                root.addChild(newNode);
                newNode.setParentNode(root);
            } else if (node.getName() == "int" || node.getName() == "string" || node.getName() == "boolean") {
                var newNode = new Compiler.Node(name);
                newNode.setLineNumber(node.getLineNumber());

                //this.addNode(newNode, "LEAF");
                root.addChild(newNode);
                newNode.setParentNode(root);
            }

            if (newRoot == null) {
                newRoot = root;
            }

            for (var i = 0; i < node.getChildren().length; i++) {
                this.convert(newRoot, node.getChildren()[i]);
            }
        };

        AbstractSyntaxTree.prototype.addNode = function (root, node) {
            // if(!this.root || this.root == null) {
            //     // Need to make a deep copy of node or else AST will get the root node of CST
            //     var newNode = new Node(node.getName());
            //     this.root = newNode;
            //     this.currentNode = this.root;
            //     console.log("Root Node set! " + this.root.getName());
            // } else {
            //     node.setParentNode(this.currentNode)
            //     this.currentNode.addChild(node);
            //     console.log("Current Node Children Number " + this.currentNode.getChildren().length);
            // }
            // if(kind == "BRANCH") {
            //     this.currentNode = node;
            // }
            if (root) {
                root.addChild(node);
                node.setParentNode(root);
            }
        };

        AbstractSyntaxTree.prototype.convertTree = function (node) {
            if (!this.root) {
                this.root = new Compiler.Node(node.getName());
                this.root.setLineNumber(node.getLineNumber());
                this.currentNode = this.root;
            }

            function expandTree(node) {
                if (node.getChildren().length == 0 || !node.getChildren()) {
                    var astNode = new Compiler.Node(node.getName());
                    astNode.setLineNumber(node.getLineNumber());
                    astNode.setParentNode(this.currentNode);
                    this.currentNode.addChild(astNode);
                } else {
                    var astNode = new Compiler.Node(node.getName());
                    astNode.setLineNumber(node.getLineNumber());
                    astNode.setParentNode(this.currentNode);
                    this.currentNode.addChild(astNode);
                    this.currentNode = astNode;
                    for (var i = 0; i < node.getChildren().length; i++) {
                        expandTree(node.getChildren()[i]);
                    }
                }
            }

            expandTree(node);
        };

        AbstractSyntaxTree.prototype.getRootNode = function () {
            return this.root;
        };

        AbstractSyntaxTree.prototype.returnToParent = function () {
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
