var express = require('express');
var app = express();
var server = require('http').Server(app);
var path = require('path');

var sockets = {};
var players  [];




app.get('/',function(req, res){
  res.sendFile(path.join(__dirname+'/../client/page.html'));
});
app.use('/client',express.static(path.join(__dirname +'/../client')));
server.listen(3000);





var io = require('socket.io')(server,{});
io.sockets.on('connection',function(socket){
//Creates a new player
  var player = {
    id:Math.random(),
    unitsToCreate:10,
    teamColor:"#000000",
    groups:[]
  }
  players.push(player);
  socket.id = player.id;
  sockets[socket.id] = socket;
});





function Unit(x,y,radius,color){

  var self = {
    id:Math.random(),
    color:color,
    x:x,
    y:y,
    color:color,
    health:1,
    moveUpdate:false,
    statsUpdate:false
  }

  //can take damage
  self.takeDamage = function(damage){
    self.health -= damage;
    if(self.health <= 0)
      self.destroy();
    self.statsUpdate = true;
  }


  //can heal
  self.health = function(health){
    self.health = self.health + health <= 1 ? self.health + health : 1;
    self.statsUpdate = true;
  }
  //can call for an update
  //can move
  self.move = function(moveX,moveY){
    self.x += moveX;
    self.y += moveY;
    self.moveUpdate = true;
  }
  //can shoot
  self.shoot = function(damage,target){
    Bullet(self.x,self.y,damage,target);
  }
  return self;
}

function Group(){
  //can update
  //can  have a target
  //can add or remove units
}

function Bullet(x,y,damage,target){
  var self = {
    x:x,
    y:y,
    damage:damage,
    target:target,
    radius:5,
    color:"#000000"
  }
  //can move
  //can cause damage
  //can have a target
  return self;
}
