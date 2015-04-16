/*
    Node Class for creating the Concrete Syntax Tree(CST) or Abstract Syntax Tree(AST)
*/
module Compiler {
    export class Node {
        private children: Node[];
        private parentNode: Node;
        private name: string;
        private lineNumber: number;
        public isChar: boolean = false;

        constructor(name: string) {
            this.children = [];
            this.name = name;
        }

        // Getter and Setter
        public setName(newName: string): void {
            this.name = newName;
        }

        public getName(): string {
            return this.name;
        }

        public setParentNode(newNode: Node): void {
            this.parentNode = newNode;
        }

        public getParentNode(): Node {
            return this.parentNode;
        }

        // addChild - add a new node to the children list
        public addChild(newNode: Node): void {
            this.children.push(newNode);
        }

        public getChildren(): Node[] {
            return this.children;
        }
        
        // check if the current node is leaf node
        public isLeafNode(): boolean {
            if(this.children.length == 0) {
                return true;
            } else {
                return false;
            }
        }

        public getLineNumber(): number {
            return this.lineNumber;
        }

        public setLineNumber(num: number): void {
            this.lineNumber = num;
        }
    }
}
