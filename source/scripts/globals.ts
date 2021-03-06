/*
    Global Variables
*/

var LEXER: Compiler.Lexer = null;
var PARSER: Compiler.Parser = null;
var CST: Compiler.ConcreteSyntaxTree = null;
var AST: Compiler.AbstractSyntaxTree = null;
var SYMBOL_TABLE: Compiler.SymbolTable = null;
var SEMANTIC_ANALYZER: Compiler.SemanticAnalysis = null;
var CODE_GEN: Compiler.CodeGeneration = null;
var isVerbose: boolean = true;