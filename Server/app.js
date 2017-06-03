var express = require('express');
var app = express();
var server = require('http').Server(app);
var path = require('path');

var sockets = {};
var players = [];
var groups = [];
var bullets = [];




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

function Group(owner,unit){
  var self = {
    id:Math.random(),
    owner:owner,
    units:[unit]
  }
  groups.push(self);
  //can  have a target
  self.target = new Target();

  //can update
  self.update = function(){
    var moveUpdate = self.units.some(function(unit){return unit.statsUpdate == true;});
    var statsUpdate = self.units.some(function(unit){return unit.moveUpdate == true;});
    //checks if a unit needs a stat update
    if(statsUpdate){

    }
    //checks if a unit needs a move update
    if(moveUpdate){

    }
    if(moveUpdate || statsUpdate){
      self.units.map(function(unit){
        unit.statsUpdate = false;
        unit.moveUpdate = false;
      });
    }
    return;
  }
  //can add or remove units
}

function Bullet(x,y,damage,target){
  //can have a target
  var self = {
    x:x,
    y:y,
    damage:damage,
    target:target,
    radius:5,
    color:"#000000"
  }
  bullets.push(self);
  //can move
  self.move = function(){
    var rise = (self.target.y - self.y);
    var run  = (self.target.x - self.x);
    var length = Math.sqrt(Math.pow(run,2) + Math.pow(rise,2));

    self.x += (run/length) * 3;
    self.y += (rise/length) * 3;

    if(distance(self,self.target) <= 3.1)
      self.damage();
  }
  //can cause damage
  self.damage = function(){
    self.target.damage(self.damage);

    for(var i =0; i < bullets.length;i++){
      if(self.id == bullets[i].id)
        bullets.splice(i,1);
      return;
    }
  }
  return self;
}


function Target(){
  var moveLocation = null;
  var groupAttacking = null;
  var groupsDefending = [];
}
