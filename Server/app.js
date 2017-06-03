var express = require('express');
var app = express();
var server = require('http').Server(app);
var path = require('path');

var sockets = {};
var players = [];
var groups = [];
var bullets = [];

const mapSize = {width:2000,height:2000};



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
    color:randomColor(),
    groups:[]
  }
  players.push(player);
  socket.id = player.id;
  sockets[socket.id] = socket;
  console.log("connection");

  player.createUnit = function(pos){
    if(player.unitsToCreate <= 0)
      return "Not Enough Units To Create";

    var unit = Unit(pos.x,pos.y,10,player.color);
    var clickedGroups = groups.filter(function(group){
      return group.cont(unit);
    });

    if(clickedGroups.length > 1)
      return "Cannot create a Unit touching two groups";

    else if(clickedGroups.length == 0)
      player.groups.push(Group(unit,player.id));

    else if(clickedGroups[0].owner != player.id)
      return "Cannot create unit ontop of enemy";

    else if(clickedGroups[0].owner == player.id)
      clickedGroups[0].add(unit);

    player.unitsToCreate--;
    return "success"
  }







  socket.on('createUnit',function(pos){
    var outcome = player.createUnit(pos);
    console.log(outcome + " " + groups.length);
  });


  socket.emit('connection',{player:player,mapSize:mapSize});
});




function Unit(x,y,radius,color){
  var self = {
    x:x,
    y:y,
    id:Math.random(),
    radius:radius,
    color:color,
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

function Group(unit,owner){
  var self = {
    id:Math.random(),
    units:[unit],
    owner:owner
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

  self.cont = function(pos){
    return self.units.filter(function(unit){
      return distance(unit,pos) <= pos.radius + unit.radius;
    }).length > 0;
  }
  self.add = function(unit){
    self.units.push(unit);
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
function distance(item1,item2){
  return Math.sqrt(Math.pow(item2.x - item1.x,2) + Math.pow(item2.y - item1.y,2));
}
function randomColor(){
  var randomColor = '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
  return Players.filter(function(player){
    return player.color == randomColor;
  }).length == 0 ? randomColor : randomColor();
}
