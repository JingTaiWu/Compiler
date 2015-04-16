/// <reference path="Node.ts"/>
/// <reference path="Control.ts"/>
/*
For Concrete/Abstract syntax tree
*/
var Compiler;
(function (Compiler) {
    var ConcreteSyntaxTree = (function () {
        function ConcreteSyntaxTree() {
        }
        // addBranchNode - Add a branch node to the tree
        ConcreteSyntaxTree.prototype.addNode = function (newNode, nodeKind) {
            //console.log("CurNode Name: " + newNode.getName());
            // First check if there is a root node
            if (this.root == null || (!this.root)) {
                // The newNode is the root
                this.root = newNode;
                this.curNode = newNode;
            } else {
                // The new node is a child
                // Assign the parent node
                newNode.setParentNode(this.curNode);

                // Add the new node to the Parent.Children[]
                this.curNode.addChild(newNode);
                // Update the current node of the tree to the new node
            }

            // If the current node is a branch node
            // Then update the current node
            if (nodeKind == "BRANCH") {
                this.curNode = newNode;
            }
        };

        // returnToParent - Return to the parent node of the current node
        ConcreteSyntaxTree.prototype.returnToParent = function () {
            if (this.curNode.getParentNode()) {
                //console.log("Parent Node Name: " + this.curNode.getParentNode().getName());
                this.curNode = this.curNode.getParentNode();
            } else {
                // This shouldn't really happen....
                console.log("Parent Node not found. \n Current Node: " + this.curNode.getName());
                Compiler.Control.stdErr("Tree", "Failed to return to parent. This shouldn't really happen...");
            }
        };

        ConcreteSyntaxTree.prototype.getRootNode = function () {
            return this.root;
        };

        // Convert tree to a string
        ConcreteSyntaxTree.prototype.toString = function () {
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
        return ConcreteSyntaxTree;
    })();
    Compiler.ConcreteSyntaxTree = ConcreteSyntaxTree;
})(Compiler || (Compiler = {}));
