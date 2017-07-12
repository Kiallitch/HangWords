const express = require('express');
const path = require('path');
const mustache = require('mustache-express');
const fs = require('fs');
const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");
const morgan = require('morgan');
const session = require('express-session');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const app = express();

app.engine('mustache',mustache())
app.set('view engine','mustache')
app.set('views',['./views','./views/admin'])

app.use('/static', express.static(path.join(__dirname, 'public')))

app.use(session({
  secret: 'ironyard',
  resave: false,
  saveUninitialized: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());

app.use(morgan('combined'));

var start = true;

function gameSetup(req){
  req.session.solutionArray = [];
  req.session.playerArray = [];
  req.session.playerStatus = "";
  req.session.lettersGuessed = "";
  req.session.matchIndex = [];
  req.session.wasMatch = false;
  req.session.word = getRandomWord();
  console.log("Our word is: " + req.session.word);
  makeArrays(req);
  console.log("User guesses array: " + req.session.playerArray);
  console.log("Solution array: " + req.session.solutionArray);
};

function getRandomWord(){
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  return words[getRandomInt(0, 235887)];
};

function makeArrays(req){
  req.session.solutionArray = Array.from(req.session.word);
  req.session.playerArray = req.session.solutionArray.map(function(x) {
    return x = "_";
  });
};

function currentGuesses(req){
  req.session.playerStatus = req.session.playerArray.join(" ");
  if (req.session.solutionArray.join(" ") === req.session.playerArray.join(" ")) {
    playerWin(req);
  };
  if (req.session.wasMatch === false) {
    req.session.turns -= 1;
  }
};

function processLetter(req, res){
  req.session.wasMatch = false;
  req.session.matchIndex = {};
  console.log("The player guessed: " + req.body.letter);

  req.session.lettersGuessed += req.body.letter + ", ";
  req.session.guesses = req.session.lettersGuessed;
  req.session.matchIndex = [];
  req.session.solutionArray.forEach(function(element, index){
    if (element === req.body.letter) {
      req.session.matchIndex.push(index);
    }
  });

  console.log("req.session.matchIndex: " + req.session.matchIndex);
  req.session.solutionArray.forEach(function(element, index){
    for (var i = 0; i < req.session.matchIndex.length; i++) {
      let tempIndex = req.session.matchIndex[i];
      if (req.session.solutionArray[index] === req.session.solutionArray[tempIndex]){
        req.session.wasMatch = true;
        console.log("Matching pair!! " + req.session.wasMatch);
        req.session.playerArray.splice(index, 1, req.session.solutionArray[tempIndex]);
      }
    }
  });
  console.log("findIndex of player's guess: " + req.session.matchIndex);
  console.log("String of player's guesses: " + req.session.lettersGuessed);
};

function gameOver(req){
  console.log("Lose!");

  playAgain(req);
};

function playerWin(req){
  console.log("Win!")
  playAgain(req);
};

function playAgain(req){

};

app.get('/', function(req, res){
  if (start === true){
   start = false;
   req.session.turns = 9;

   gameSetup(req);
  }
  console.log("Turns is now: " + req.session.turns);
  if (req.session.turns >= 0) {
    currentGuesses(req);
  } else {
    gameOver(req);
  }
  console.log("Current player status: " + req.session.playerStatus);
  res.render('index', { game : req.session });
});

app.post('/', function(req, res){
  req.checkBody("letter", "You must enter one letter, a-z").isAlpha();
  var errors = req.validationErrors();
    if (errors) {
      var html = errors;
      res.send(html);
    } else {
      req.session.wasMatch = false;
      processLetter(req, res);
    }
  console.log(req.session);
  res.redirect('/');
});


app.listen(3000, function () {
  console.log('App listening on port 3000!')
});
