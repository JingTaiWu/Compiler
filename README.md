2015 Compiler
==============

Part 1 (Lexer and parser)
-------------------------

Write a complete lexer and parser that validates the source code for Our Language Grammar

1. Do no do any semantic analysis.

2. The lexer is not as simple as the examples in class.

3. PRovide both errors and warnings. Warnings are non-fatal mistakes or omissions that your compiler can and will correct. Forgeting the $ after Block in the Program production is one example. If this happens please output a warning and then add the missing symbol so that compilation continues.

4. When you detect an error, report it in helpful detail including where it was found.

5. If there are errors in lex, do not continue to parse.

6. If there are errors in parse, do not show the CST.

7. Include verbose output functionality that traces the stages of the parser inlcuding the consturction of the symbol table.

Part 2 (Semantic Analysis)
--------------------------

1. Fix any deficiencies with your lexer and parser from Project One.

2. Modify your parser to create a concrete syntax tree while parsing. Display the CST as well. Make it neat, if not also pretty.

3. Write a semantic analyzer that scope-checks and type-checks the CST for the [Our Language Grammar](http://www.labouseur.com/courses/compilers/grammar.pdf)
    a. Create and display a symbol table with type and scope information.
    b. Create and siaply the abstract syntax tree(AST).