/// <reference path="ConcreteSyntaxTree.ts"/>
/// <reference path="Token.ts"/>
/// <reference path="Node.ts"/>
/// <reference path="Control.ts"/>
/*
Parser - LL1 (Left most derivation with one token look ahead)
Grammar for parsing: http://www.labouseur.com/courses/compilers/grammar.pdf
*/
var Compiler;
(function (Compiler) {
    var Parser = (function () {
        // Constructor - Takes in a token stream
        function Parser(tokenStream) {
            this.tokenStream = tokenStream;
            this.index = 0;
            this.errorCount = 0;
            this.CST = new Compiler.ConcreteSyntaxTree();
        }
        // parse - The beginning step of parsing
        Parser.prototype.parse = function () {
            // Grab the next token
            this.currentToken = this.getNextToken();
            this.stdOut("Begin Parsing...");

            // Program is our ultimate production
            this.parseProgram();
            return true;
        };

        // parseProgram - Program ::== Block $
        Parser.prototype.parseProgram = function () {
            // Expecting a block and an EOF
            this.stdOut("Parsing a program.");

            // Make a node for CST
            var newNode = new Compiler.Node("Program");
            this.CST.addNode(newNode, "BRANCH");
            this.parseBlock();
            this.checkToken("EOF_TOKEN");
            //this.CST.returnToParent();
        };

        // parseBlock - Block ::== {StatementList}
        Parser.prototype.parseBlock = function () {
            this.stdOut("Parsing a <strong>Block</strong>");
            this.CST.addNode(new Compiler.Node("Block"), "BRANCH");
            this.checkToken("OPEN_BRACE_TOKEN");
            this.parseStatementList();
            this.checkToken("CLOSE_BRACE_TOKEN");
            this.CST.returnToParent();
        };

        // parseStatementList - StatementList ::== Statement StatementList
        //                                    ::== epsilon
        Parser.prototype.parseStatementList = function () {
            this.stdOut("Parsing a <strong>StatementList</strong>.");
            this.CST.addNode(new Compiler.Node("StatementList"), "BRANCH");

            // Need to check for the next token
            if (this.currentToken.getKind() == "PRINT_KEYWORD_TOKEN" || this.currentToken.getKind() == "IDENTIFIER_TOKEN" || this.currentToken.getKind() == "TYPE_TOKEN" || this.currentToken.getKind() == "WHILE_KEYWORD_TOKEN" || this.currentToken.getKind() == "IF_KEYWORD_TOKEN" || this.currentToken.getKind() == "OPEN_BRACE_TOKEN") {
                this.parseStatement();
                this.parseStatementList();
            } else {
                // Epsilon
            }
            this.CST.returnToParent();
        };

        // parseStatement - Statement ::== PrintStatement
        //                            ::== AssignmentStatement
        //                            ::== VarDecl
        //                            ::== WhileStatement
        //                            ::== IfStatement
        //                            ::== Block
        Parser.prototype.parseStatement = function () {
            this.stdOut("Parsing a <strong>Statement</strong>.");
            this.CST.addNode(new Compiler.Node("Statement"), "BRANCH");

            // Need to check for the next token
            if (this.currentToken.getKind() == "PRINT_KEYWORD_TOKEN") {
                this.parsePrintStatement();
            } else if (this.currentToken.getKind() == "IDENTIFIER_TOKEN") {
                this.parseAssignmentStatement();
            } else if (this.currentToken.getKind() == "TYPE_TOKEN") {
                this.parseVarDecl();
            } else if (this.currentToken.getKind() == "WHILE_KEYWORD_TOKEN") {
                this.parseWhileStatement();
            } else if (this.currentToken.getKind() == "IF_KEYWORD_TOKEN") {
                this.parseIfStatement();
            } else {
                this.parseBlock();
            }
            this.CST.returnToParent();
        };

        // parsePrintStatement - PrintStatement ::== print(Expr)
        Parser.prototype.parsePrintStatement = function () {
            this.stdOut("Parsing a <strong>PrintStatement</strong>.");
            this.CST.addNode(new Compiler.Node("PrintStatement"), "BRANCH");
            this.checkToken("PRINT_KEYWORD_TOKEN");
            this.checkToken("OPEN_PARENTHESIS_TOKEN");
            this.parseExpr();
            this.checkToken("CLOSE_PARENTHESIS_TOKEN");
            this.CST.returnToParent();
        };

        // parseAssignmentStatement - AssignmentStatement ::== Id = Expr
        Parser.prototype.parseAssignmentStatement = function () {
            this.stdOut("Parsing an <strong>AssignementStatement</strong>.");
            this.CST.addNode(new Compiler.Node("AssignmentStatement"), "BRANCH");
            this.parseId();
            this.checkToken("ASSIGN_OP_TOKEN");
            this.parseExpr();
            this.CST.returnToParent();
        };

        // parseVarDecl - VarDecl ::== type Id
        Parser.prototype.parseVarDecl = function () {
            this.stdOut("Parsing <strong>VarDeclaration</strong>.");
            this.CST.addNode(new Compiler.Node("VarDecl"), "BRANCH");
            this.checkToken("TYPE_TOKEN");
            this.parseId();
            this.CST.returnToParent();
        };

        // parseWhileStatement - WhileStatement ::== while BooleanExpr Block
        Parser.prototype.parseWhileStatement = function () {
            this.stdOut("Parsing <strong>WhileStatement</strong>");
            this.CST.addNode(new Compiler.Node("WhileStatement"), "BRANCH");
            this.checkToken("WHILE_KEYWORD_TOKEN");
            this.parseBooleanExpr();
            this.parseBlock();
            this.CST.returnToParent();
        };

        // parseIfStatement - IfStatement ::== if BooleanExpr Block
        Parser.prototype.parseIfStatement = function () {
            this.stdOut("Parsing <strong>IfStatement</strong>.");
            this.CST.addNode(new Compiler.Node("IfStatement"), "BRANCH");
            this.checkToken("IF_KEYWORD_TOKEN");
            this.parseBooleanExpr();
            this.parseBlock();
            this.CST.returnToParent();
        };

        // parseExpr - Expr ::== IntExpr
        //                  ::== StringExpr
        //                  ::== BooleanExpr
        //                  ::== Id
        Parser.prototype.parseExpr = function () {
            this.stdOut("Parsing an <strong>ExpressionStatement</strong>.");
            this.CST.addNode(new Compiler.Node("Expr"), "BRANCH");
            if (this.currentToken.getKind() == "DIGIT_TOKEN") {
                this.parseIntExpr();
            } else if (this.currentToken.getKind() == "QUOTATION_TOKEN") {
                this.parseStringExpr();
            } else if (this.currentToken.getKind() == "BOOL_VAL_TOKEN" || this.currentToken.getKind() == "OPEN_PARENTHESIS_TOKEN") {
                this.parseBooleanExpr();
            } else {
                this.parseId();
            }
            this.CST.returnToParent();
        };

        // parseIntExpr - IntExpr ::== digit intop Expr
        //                        ::== digit
        Parser.prototype.parseIntExpr = function () {
            var nextToken = this.tokenStream[this.index];
            this.CST.addNode(new Compiler.Node("IntExpr"), "BRANCH");
            if (nextToken.getKind() == "INT_OP_TOKEN") {
                this.stdOut("Parsing an <strong>IntegerStatement</strong> (digit intop expr).");
                this.checkToken("DIGIT_TOKEN");
                this.checkToken("INT_OP_TOKEN");
                this.parseExpr();
            } else {
                this.stdOut("Parsing an <strong>IntegerStatement</strong> (digit).");
                this.checkToken("DIGIT_TOKEN");
            }
            this.CST.returnToParent();
        };

        // parseStringExpr - StringExpr ::== " CharList "
        Parser.prototype.parseStringExpr = function () {
            this.stdOut("Parsing a <strong>StringExpression</strong>.");
            this.CST.addNode(new Compiler.Node("StringExpr"), "BRANCH");
            this.checkToken("QUOTATION_TOKEN");
            this.parseCharList();
            this.checkToken("QUOTATION_TOKEN");
            this.CST.returnToParent();
        };

        // parseBooleanExpr - BooleanExpr ::== (Expr boolop Expr)
        //                                ::== boolval
        Parser.prototype.parseBooleanExpr = function () {
            this.stdOut("Parse a <strong>BooleanExpression</strong>.");
            this.CST.addNode(new Compiler.Node("BooleanExpr"), "BRANCH");
            if (this.currentToken.getKind() == "OPEN_PARENTHESIS_TOKEN") {
                this.checkToken("OPEN_PARENTHESIS_TOKEN");
                this.parseExpr();
                this.checkToken("BOOL_OP_TOKEN");
                this.parseExpr();
                this.checkToken("CLOSE_PARENTHESIS_TOKEN");
            } else {
                this.checkToken("BOOL_VAL_TOKEN");
            }
            this.CST.returnToParent();
        };

        // parseId - Id ::== char
        Parser.prototype.parseId = function () {
            this.stdOut("Parsing an <strong>ID</strong>.");
            this.CST.addNode(new Compiler.Node("Id"), "BRANCH");
            this.checkToken("IDENTIFIER_TOKEN");
            this.CST.returnToParent();
        };

        // parseCharList - CharList ::== char CharList
        //                          ::== space CharList
        //                          ::== epsilon
        Parser.prototype.parseCharList = function () {
            //var nextToken = this.peek();
            this.stdOut("Parsing an <strong>CharList</strong>.");
            this.CST.addNode(new Compiler.Node("CharList"), "BRANCH");
            if (this.currentToken.getKind() == "CHARACTER_TOKEN") {
                this.checkToken("CHARACTER_TOKEN");
                this.parseCharList();
            } else if (this.currentToken.getKind() == "SPACE_TOKEN") {
                this.checkToken("SPACE_TOKEN");
                this.parseCharList();
            } else {
                // Epsilon
            }
            this.CST.returnToParent();
        };

        // checkToken - check if the current Token matches the expected type. Print an error if it doesn't.
        Parser.prototype.checkToken = function (expectedKind) {
            //this.stdOut("Current Index " + this.index);
            if (this.currentToken.getKind() == expectedKind) {
                this.stdOut("Expecting <strong> [ " + expectedKind + " ]</strong>. Found <strong>[ " + this.currentToken.getValue() + " ]</strong>.");
                var newNode = new Compiler.Node(this.currentToken.getValue());
                newNode.setLineNumber(this.currentToken.getLineNumber());
                if (this.currentToken.getKind() == "CHARACTER_TOKEN" || this.currentToken.getKind() == "SPACE_TOKEN") {
                    newNode.isChar = true;
                }
                if (this.currentToken.getKind() == "IDENTIFIER_TOKEN") {
                    newNode.isIdentifier = true;
                }
                if (this.currentToken.getKind() == "DIGIT_TOKEN") {
                    newNode.isDigit = true;
                }
                if (this.currentToken.getKind() == "BOOL_VAL_TOKEN") {
                    newNode.isBoolVal = true;
                }
                this.CST.addNode(newNode, "LEAF");
                this.currentToken = this.getNextToken();
                return true;
            } else {
                var errStr = "Expecting <strong>[ " + expectedKind + " ]</strong>. Found <strong>[ " + this.currentToken.getValue() + " ]</strong>. On line " + this.currentToken.getLineNumber();
                this.errorCount++;
                throw errStr;
            }
        };

        // getNextToken - return the token at current index and increment the index
        Parser.prototype.getNextToken = function () {
            // Assume the current token is EOF
            var thisToken = new Compiler.Token("", "", 0);
            if (this.index < this.tokenStream.length) {
                thisToken = this.tokenStream[this.index];

                //this.stdOut("Current Token: " + thisToken.getValue() + ". Token Kind: " + thisToken.getKind() + ".");
                this.index++;
            }

            return thisToken;
        };

        // peek - returns the next token
        Parser.prototype.peek = function () {
            var nextIndex = this.index + 1;
            var thisToken = new Compiler.Token("", "", 0);
            if (nextIndex < this.tokenStream.length) {
                thisToken = this.tokenStream[nextIndex];
            }

            return thisToken;
        };

        Parser.prototype.stdOut = function (msg) {
            Compiler.Control.stdOut("PARSER", msg);
        };

        Parser.prototype.getCST = function () {
            return this.CST;
        };
        return Parser;
    })();
    Compiler.Parser = Parser;
})(Compiler || (Compiler = {}));
