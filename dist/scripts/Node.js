/*
Node Class for creating the Concrete Syntax Tree(CST) or Abstract Syntax Tree(AST)
*/
var Compiler;
(function (Compiler) {
    var Node = (function () {
        function Node(name) {
            this.children = [];
            this.name = name;
        }
        // Getter and Setter
        Node.prototype.setName = function (newName) {
            this.name = newName;
        };

        Node.prototype.getName = function () {
            return this.name;
        };

        Node.prototype.setParentNode = function (newNode) {
            this.parentNode = newNode;
        };

        Node.prototype.getParentNode = function () {
            return this.parentNode;
        };

        // addChild - add a new node to the children list
        Node.prototype.addChild = function (newNode) {
            this.children.push(newNode);
        };

        Node.prototype.getChildren = function () {
            return this.children;
        };

        // check if the current node is leaf node
        Node.prototype.isLeafNode = function () {
            if (this.children.length == 0) {
                return true;
            } else {
                return false;
            }
        };

        Node.prototype.getLineNumber = function () {
            return this.lineNumber;
        };

        Node.prototype.setLineNumber = function (num) {
            this.lineNumber = num;
        };
        return Node;
    })();
    Compiler.Node = Node;
})(Compiler || (Compiler = {}));
