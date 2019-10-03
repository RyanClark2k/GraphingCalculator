// global constants
var NUM_GRAPH_POINTS = 500;
var FLOAT = "FLOAT";
var PLUS = "PLUS";
var MINUS = "MINUS";
var EOF = "EOF";
var MUL = "MUL";
var DIV = "DIV";
var POW = "POW";
var LPAREN = '(';
var RPAREN = ')';
var VAR = 'x';
var EXP = "EXP";
var SIN = "SIN";
var COS = "COS";
var TAN = "TAN";
var ASIN = "ASIN";
var ACOS = "ACOS";
var ATAN = "ATAN";
var LN = "LN";
var FLOOR = "FLOOR";
var CEIL = "CEIL";
var ABS = "ABS";
var SQRT = "SQRT";
var PI = "PI";
var E = "E";

// other global variables
var plot1Data = [];
var plot2Data = [];
var plot3Data = [];
var renderPlot1 = true;
var renderPlot2 = false;
var renderPlot3 = false;
var plot1Changed = true;
var plot2Changed = true;
var plot3Changed = true;

// inserts characters into string at position idx
String.prototype.splice = function(idx, rem, str) {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
};


var active = [true, false, false];
var colors = ['#ff0000', '#0000ff', '#00bb00'];
var current_exps = ['', '', '']
var c = document.getElementById("graphing-calc");
var ctx = c.getContext("2d");
var width = c.width;
var height = c.height;
var graphMinX = -5;
var graphMaxX = 5;
var graphMinY = -5;
var graphMaxY = 5;
var xAxisMax = 0.97 * width;
var xAxisMin = 0.03 * width;
var yAxisMax = 0.98 * height;
var yAxisMin = 0.03 * height;


function getPlotData(input){

    var currentX = graphMinX;
    var stepSize = (graphMaxX - graphMinX) / NUM_GRAPH_POINTS;
    
    var text = preLex(input).toLowerCase();
    var lexer = new Lexer(text);
    var parser = new Parser(lexer);
    var interpreter = new Interpreter(parser);
    try{
        interpreter.interpret(true);
    }
    catch(err){
        console.log(err);
    }
    var plotXData = [];
    var plotYData = [];

    for(var i = 0; i < NUM_GRAPH_POINTS; i++){
        interpreter.independentVar = currentX;
        plotXData[i] = currentX;
        plotYData[i] = interpreter.interpret(false);
        currentX += stepSize;
    }
    return [plotXData, plotYData];
}

function wipeCanvas() {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
}

function drawAxes(){
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(width / 2, 0.05 * height);
    ctx.lineTo(width / 2, height * 0.95);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0.05 * width, height / 2);
    ctx.lineTo(width * 0.95, height / 2);
    ctx.stroke();
    ctx.font = "15px Ariel";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText(graphMaxX, xAxisMax, height * 0.51);
    ctx.fillText(graphMinX, xAxisMin, height * 0.51); 
    ctx.fillText(graphMinY, width * 0.5, yAxisMax);
    ctx.fillText(graphMaxY, width * 0.5, yAxisMin); 
}

function updatePlot(){
    wipeCanvas();
    drawAxes();
    for (i = 0; i < 3; i++){
        if (active[i]) {
            expression = current_exps[i];
            color = colors[i];
            plot(expression, color);
        }
    }
}

function updateEquation(eqnNumber, isOn){
    active[eqnNumber - 1] = isOn;
    current_exps[eqnNumber - 1] = document.getElementById('eqn' + eqnNumber).value;
    updatePlot();
}

function updateSize(id){
    new_size = document.getElementById(id).value;
    if (!isNaN(new_size)){
        if (id == "xScale"){
            xScale = Math.abs(Number(new_size));
            graphMinX = -xScale;
            graphMaxX = xScale;
        }
        else if (id == "yScale"){
            yScale = Math.abs(Number(new_size));
            graphMinY = -yScale;
            graphMaxY = yScale;
        }
        updatePlot();
    }
}

function plot(expression, color){
    [plotXData, plotYData] = getPlotData(expression);
    ctx.strokeStyle = color;
    for(var i = 0; i < NUM_GRAPH_POINTS - 1; i++){
        [xStart, yStart] = toCanvasCoords(plotXData[i], plotYData[i]);
        if (xStart < xAxisMin || xStart > xAxisMax || yStart < xAxisMin || yStart > yAxisMax) {
            continue;
        }
        ctx.beginPath();
        ctx.moveTo(xStart, yStart);
        [xEnd, yEnd] = toCanvasCoords(plotXData[i + 1], plotYData[i + 1]);
        if (xEnd < xAxisMin || xEnd > xAxisMax || yEnd < xAxisMin || yEnd > yAxisMax) {
            continue;
        }
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();
    }
}

function toCanvasCoords(x, y){
    canvasX = x * width / (graphMaxX - graphMinX);
    canvasY = y * height / (graphMaxY - graphMinY);
    canvasX = +canvasX + width / 2;
    canvasY = -canvasY + height / 2;
    return [canvasX, canvasY]
}

updateSize('xScale');
updateSize('yScale');
updateEquation(1, true);



/*
THIS IS WHERE THE FUN BEGINS
BELOW THIS POINT IS THE ARITHMETIC INTERPRETER CODE
*/

// simple conditionals for prelexer
function isX(str){
  return str == "x";
}
function isLetter(str) {
  return str.length === 1 && str.match(/[a-z]/i);
}
function isLParen(ch){
  return ch=='(';
}
function isRParen(ch){
  return ch == ')';
}
function isSpace(ch){
  return ' \t\n\r\v'.indexOf(ch) > -1;
}

// recursively insert * symbols where not explicit
function preLex(str){
  var startLength = str.length;
  for(var i = 0; i < startLength-1; i++){
    if(!isNaN(str.charAt(i)) && isLetter(str.charAt(i+1))){
      var result = str.splice(i+1, 0, '*');
      return preLex(result);
    }
    if(!isNaN(str.charAt(i)) && isLParen(str.charAt(i+1))){
      var result = str.splice(i+1, 0, '*');
      return preLex(result);
    }
    if(isX(str.charAt(i)) && isLParen(str.charAt(i+1))){
      var result = str.splice(i+1, 0, '*');
      return preLex(result);
    }
    if(isRParen(str.charAt(i)) && isLetter(str.charAt(i+1))){
      var result = str.splice(i+1, 0, '*');
      return preLex(result);
    }
    if(isRParen(str.charAt(i)) && isLParen(str.charAt(i+1))){
      var result = str.splice(i+1, 0, '*');
      return preLex(result);
    }
    if(isX(str.charAt(i)) && isLetter(str.charAt(i+1))
    && str.charAt(i-1) != "e" && str.charAt(i+1) != "p"){
      var result = str.splice(i+1, 0, '*');
      return preLex(result);
    }
  }
  return str;
}

// store type and value of lexical token
function Token(type, value){
  this.type = type;
  this.value = value;
  Token.prototype.__str__ = function(){
    return "Token("+this.type+","+this.value+")";
  };
  Token.prototype.__repr__ = function(){
    return this.__str__();
  };
}

// break equation from characters to tokens
function Lexer(text){
  this.text = text;
  this.pos= 0;
  this.current_char = this.text.charAt(this.pos);
  
  Lexer.prototype.error = function(){
    throw "Invalid character";
  };
  
  // move position forward, update current character
  Lexer.prototype.advance = function(){
    this.pos += 1;
    if(this.pos > this.text.length-1){
      this.current_char = null;
    }
    else {
      this.current_char = this.text.charAt(this.pos);
    }
  };
  
  // advance amt times
  Lexer.prototype.multi_advance = function(amt){
    for(var i = 0; i < amt; i++){
      this.advance();
    }
  }
  
  // view character amt places ahead of pos
  Lexer.prototype.peek = function(amt) {
  var peekPos = this.pos + amt;
  if (peekPos > this.text.length - 1)
  	return null;
  else
  	return this.text.charAt(peekPos);
	};
  
  // ignore whitespace and advance
  Lexer.prototype.skip_whitespace = function(){
    while(this.current_char !== null && isSpace(this.current_char)){
      this.advance();
    }
  };
  
  // parse float when dealing with numbers and decimals
  // all integers treated as floats
  Lexer.prototype.float = function(){
    var result= '';
    while(this.current_char !== null && (!isNaN(this.current_char)||this.current_char=='.')){
      result += this.current_char;
      this.advance();
    }
    return parseFloat(result);
  };
  
  // handle current token with boolean logic and advance
  Lexer.prototype.get_next_token = function(){
    
    while(this.current_char !== null){
      
      if(isSpace(this.current_char)){
        this.skip_whitespace();
        continue;
      }
      if(!isNaN(this.current_char)||this.current_char=='.'){
        return new Token(FLOAT, this.float());
      }
      if(this.current_char == "x"){
        this.advance();
        return new Token(VAR, "x");
      }
      if(this.current_char == "+"){
        this.advance();
        return new Token(PLUS, "+");
      }
      if(this.current_char == "-"){
        this.advance();
        return new Token(MINUS, "-");
      }
      if(this.current_char == "*"){
        this.advance();
        return new Token(MUL, "*");
      }
      if(this.current_char == "/"){
        this.advance();
        return new Token(DIV, "/");
      }
      if(this.current_char == "^"){
        this.advance();
        return new Token(POW, "^");
      }
      if(this.current_char == "("){
        this.advance();
        return new Token(LPAREN, "(");
      }
      if(this.current_char == ")"){
        this.advance();
        return new Token(RPAREN, ")");
      }
      if(this.current_char == "e"){
        if(this.peek(1) == "x" && this.peek(2) == "p"){
          this.multi_advance(3);
          return new Token(EXP, "EXP");
        }
        else {
          this.advance();
          return new Token(E, "E");
        }
      }
      if(this.current_char == "s"){
        if(this.peek(1) == "i" && this.peek(2) == "n"){
          this.multi_advance(3);
          return new Token(SIN, "SIN");
        }
        else if (this.peek(1) == "q" && this.peek(2) == "r" && this.peek(3) == "t"){
          this.multi_advance(4);
          return new Token(SQRT, "SQRT");
        }
      }
      if(this.current_char == "c"){
        if(this.peek(1) == "o" && this.peek(2) == "s"){
          this.multi_advance(3);
          return new Token(COS, "COS");
        }
        else if (this.peek(1) == "e" && this.peek(2) == "i" && this.peek(3) == "l"){
          this.multi_advance(4);
          return new Token(CEIL, "CEIL");
        }
      }
      if(this.current_char == "t"){
        if(this.peek(1) == "a" && this.peek(2) == "n"){
          this.multi_advance(3);
          return new Token(TAN, "TAN");
        }
      }
      if(this.current_char == "a"){
        if(this.peek(1) == "s" && this.peek(2) == "i" && this.peek(3) == "n"){
          this.multi_advance(4);
          return new Token(ASIN, "ASIN");
        }
        if(this.peek(1) == "c" && this.peek(2) == "o" && this.peek(3) == "s"){
          this.multi_advance(4);
          return new Token(ACOS, "ACOS");
        }
        if(this.peek(1) == "t" && this.peek(2) == "a" && this.peek(3) == "n"){
          this.multi_advance(4);
          return new Token(ATAN, "ATAN");
        }
        if(this.peek(1) == "b" && this.peek(2) == "s"){
          this.multi_advance(3);
          return new Token(ABS, "ABS");
        }
      }
      if(this.current_char == "l"){
        if(this.peek(1) == "n"){
          this.multi_advance(2);
          return new Token(LN, "LN");
        }
      }
      if(this.current_char == "f"){
        if(this.peek(1) == "l" && this.peek(2) == "o" && this.peek(3) == "o" && this.peek(4) == "r"){
          this.multi_advance(5);
          return new Token(FLOOR, "FLOOR");
        }
      }
      if(this.current_char == "p"){
        if(this.peek(1) == "i"){
          this.multi_advance(2);
          return new Token(PI, "PI");
        }
      }
      this.error();
    }
    return new Token(EOF, null);
  };
}

// parent class of Abstract syntax tree
function AST(){}

// operation in tree with two inputs
function binOp(initLeft, initOp, initRight) {
	this.left = initLeft;
	this.token = initOp;
	this.op = initOp;
	this.right = initRight;
}
binOp.prototype = new AST();

// operation in tree with one input
function unaryOp(initOp, initExpr) {
	this.token = initOp;
	this.op = initOp;
	this.expr = initExpr;
}
unaryOp.prototype = new AST();

// number in tree
function num(initToken) {
	this.token = initToken;
	this.value = initToken.value;
}
num.prototype = new AST();

// X variable in tree
function variable(initToken) {
  this.token = initToken;
  this.value = initToken.value;
}
variable.prototype = new AST();

// build AST from tokens
function Parser(lexer) {
  this.lexer = lexer;
  this.current_token = this.lexer.get_next_token();
  
  Parser.prototype.error = function(){
    throw "Invalid syntax";
  };
  
  // check type of current char before advancing
  Parser.prototype.eat = function(token_type){
    if(this.current_token.type === token_type){
      this.current_token = this.lexer.get_next_token();
    }
    else {
      this.error();
    }
  };
  
  // handles unary ops, parens and numbers
  Parser.prototype.factor = function(){
    var token = this.current_token;
    if (token.type == PLUS) {
      this.eat(PLUS);
      return new unaryOp(token, this.factor());
    }
 		else if (token.type == MINUS) {
      this.eat(MINUS);
      return new unaryOp(token, this.factor());
    }
    else if (token.type == EXP){
      this.eat(EXP);
      return new unaryOp(token, this.factor());
    }
    else if (token.type == SIN){
      this.eat(SIN);
      return new unaryOp(token, this.factor());
    }
    else if (token.type == COS){
      this.eat(COS);
      return new unaryOp(token, this.factor());
    }
    else if (token.type == TAN){
      this.eat(TAN);
      return new unaryOp(token, this.factor());
    }
    else if (token.type == ASIN){
      this.eat(ASIN);
      return new unaryOp(token, this.factor());
    }
    else if (token.type == ACOS){
      this.eat(ACOS);
      return new unaryOp(token, this.factor());
    }
    else if (token.type == ATAN){
      this.eat(ATAN);
      return new unaryOp(token, this.factor());
    }
    else if (token.type == LN){
      this.eat(LN);
      return new unaryOp(token, this.factor());
    }
    else if (token.type == FLOOR){
      this.eat(FLOOR);
      return new unaryOp(token, this.factor());
    }
    else if (token.type == CEIL){
      this.eat(CEIL);
      return new unaryOp(token, this.factor());
    }
    else if (token.type == ABS){
      this.eat(ABS);
      return new unaryOp(token, this.factor());
    }
    else if (token.type == SQRT){
      this.eat(SQRT);
      return new unaryOp(token, this.factor());
    }
 		else if (token.type == FLOAT) {
      this.eat(FLOAT);
      return new num(token);
    }
    else if (token.type == PI){
      this.eat(PI);
      return new num(token);
    }
    else if (token.type == E){
      this.eat(E);
      return new num(token);
    }
    else if (token.type == VAR){
       this.eat(VAR);
       return new variable(token);
    }
    else if (token.type == LPAREN){
      this.eat(LPAREN);
      var node = this.expr();
      this.eat(RPAREN);
      return node;
    }
  };
  
  // handles multiplication, division, and exponentiation
  Parser.prototype.term = function(){
    var node = this.factor();
    while(this.current_token.type == MUL || this.current_token.type == DIV
    || this.current_token.type == POW){
      var token = this.current_token;
      if(token.type == MUL){
        this.eat(MUL);
      }
      else if(token.type == DIV){
        this.eat(DIV);
      }
      else if(token.type == POW){
        this.eat(POW);
      }
      node = new binOp(node, token, this.factor());
    }
    return node;
  };
  
  // handles binary +/-
  Parser.prototype.expr = function(){
    var node = this.term();
    while(this.current_token.type == PLUS || this.current_token.type == MINUS){
      var token = this.current_token;
      if(token.type == PLUS){
        this.eat(PLUS);
      }
      else if (token.type == MINUS){
        this.eat(MINUS);
      }
      node = new binOp(node, token, this.term());
    }
    return node;
  };
  
  // build AST
  Parser.prototype.parse = function(){
    return this.expr();
  };
}

// traverse AST and return numerical value
function Interpreter(parser){
  
  this.parser = parser;
  this.tree = null;
  this.independentVar = 0;
  
  // calculate result of binary operations
  Interpreter.prototype.visit_BinOp = function(node){
    if(node.op.type == PLUS){
      return this.visit(node.left) + this.visit(node.right);
    }
    if(node.op.type == MINUS){
      return this.visit(node.left) - this.visit(node.right);
    }
    if(node.op.type == MUL){
      return this.visit(node.left) * this.visit(node.right);
    }
    if(node.op.type == DIV){
      return this.visit(node.left) / this.visit(node.right);
    }
    if(node.op.type == POW){
      return Math.pow(this.visit(node.left), this.visit(node.right));
    }
  };
  
  // calculate result of unary operations
  this.visitUnaryOp = function(node) {
    var op = node.op.type;
    if (op == "PLUS") {
     return +this.visit(node.expr);
    }
    else if (op == "MINUS") {
     return -this.visit(node.expr);
    }
    else if (op == EXP){
      return Math.exp(this.visit(node.expr));
    }
    else if (op == SIN){
      return Math.sin(this.visit(node.expr));
    }
    else if (op == COS){
      return Math.cos(this.visit(node.expr));
    }
    else if (op == TAN){
      return Math.tan(this.visit(node.expr));
    }
    else if (op == ASIN){
      return Math.asin(this.visit(node.expr));
    }
    else if (op == ACOS){
      return Math.acos(this.visit(node.expr));
    }
    else if (op == ATAN){
      return Math.atan(this.visit(node.expr));
    }
    else if (op == LN){
      return Math.log(this.visit(node.expr));
    }
    else if (op == FLOOR){
      return Math.floor(this.visit(node.expr));
    }
    else if (op == CEIL){
      return Math.ceil(this.visit(node.expr));
    }
    else if (op == ABS){
      return Math.abs(this.visit(node.expr));
    }
    else if (op == SQRT){
      return Math.sqrt(this.visit(node.expr));
    }
  };
  
  // return numbers and constants
  Interpreter.prototype.visit_Num = function(node){
    if(node.value == "PI")
      return 3.14159;
    else if(node.value == "E")
      return 2.71828;
    return node.value;
  };
  
  // return the global dependent variable
  Interpreter.prototype.visit_Variable = function(node){
    return this.independentVar;
  };
  
  // determine which node to visit
  Interpreter.prototype.visit = function(node) {
    
		if (node instanceof binOp)
			return this.visit_BinOp(node);
		else if (node instanceof num)
			return this.visit_Num(node);
		else if (node instanceof unaryOp)
			return this.visitUnaryOp(node);
		else if (node instanceof variable)
    return this.visit_Variable(node);
  else
			return this.genericVisit(node);
	};

	Interpreter.prototype.genericVisit = function(node) {
  //throw "No visit method for node type";
	};
  
  // build tree if necessary and traverse
  Interpreter.prototype.interpret = function(buildTree){
    if(buildTree)
      this.tree = this.parser.parse();
    return this.visit(this.tree);
  };
}
