var express = require('express');
var app = express();
var server = require('http').Server(app);
var path = require('path');

var sockets = {};
var players = [];
var groups = [];
var bullets = [];

const mapSize = {width:700,height:700};



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
    groups:[],
    selectedGroup:null
  }
  players.push(player);
  socket.id = player.id;
  sockets[socket.id] = socket;
  console.log("connection");

  player.createUnit = function(pos){
    if(player.unitsToCreate <= 0)
      return "Not Enough Units To Create";

    var unit = Unit(pos.x,pos.y,10,player.color);
    if(unit.x-unit.radius < 0 ||unit.y-unit.radius <0 ||unit.y +unit.radius > mapSize.height ||unit.x + unit.radius > mapSize.width)
       return "Out of Bounds";
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

  player.controlUnit = function(pos){
    var clickedGroups = groups.filter(function(group){
      return group.cont(pos);
    });

    if(clickedGroups.length > 1)
      return "Too many groups selected";
    else if(clickedGroups.length == 0){
      if(player.selectedGroup != null && player.selectedGroup.owner == player.id)
        player.selectedGroup.target.setTarget(pos);
      else
        return "Nothing Selected";
    }
    else if(player.selectedGroup == null)
      player.selectedGroup = clickedGroups[0];
    else if(player.selectedGroup.owner != player.id)
      player.selectedGroup = clickedGroups[0];
    else if(player.selectedGroup.id == clickedGroups[0].id)
      player.selectedGroup = null;
    else if(player.selectedGroup.owner == player.id && clickedGroups[0].owner != player.id)
      player.selectedGroup.target.setTarget(clickedGroups[0]);


      return 'success';
  }







  socket.on('createUnit',function(pos){
    var outcome = player.createUnit(pos);
  });
  socket.on('controlUnit',function(pos){
    var outcome = player.controlUnit(pos);
    if(outcome == 'success'){
      socket.emit('unitControlling',player);
    }
  })


  socket.emit('connection',{player:player,mapSize:mapSize});
});




function Unit(x,y,radius,color){
  var self = {
    x:x,
    y:y,
    id:Math.random(),
    radius:radius,
    color:color,
    health:1,
    statsUpdate:false
  }

  //can take damage
  self.takeDamage = function(dmg){
    self.health -= dmg;
    self.statsUpdate = true;
  }


  //can heal
  self.heal = function(health){
    self.health = self.health + health <= 1 ? self.health + health : 1;
    self.statsUpdate = true;
  }
  //can call for an update
  //can move
  self.move = function(moveX,moveY){
    self.x += moveX;
    self.y += moveY;
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
  self.x = self.units[0].x;
  self.y = self.units[0].y;
  self.attackRange = 50;
  self.moveSpeed = 1;
  self.lastAttack = serverClock - 5;
  self.lastHeal = serverClock - 5;
  self.bulletDamage = .1;

  //can update
  self.update = function(){
    var statsUpdate = self.units.some(function(unit){return unit.statsUpdate == true;});
    //checks if a unit needs a stat update
    if(statsUpdate){
      self.units.map(function(unit){
        if(unit.health <= 0){
          self.units.splice(unit,1);
        }
      });
      if(self.units.length == 0){
        groups = groups.filter(function(group){
          return group.id != self.id;
        });
      }
    }
    //checks if a unit needs a move update
    if(self.target.getTarget() != null && self.target.getTarget().units != undefined && self.target.getTarget().units.length == 0)
      self.target.setTarget(null);
    if(self.target.getTarget() != null && distance(self,self.target.getTarget()) > (self.target.getTarget().units != undefined ? self.attackRange : self.moveSpeed)){
      var rise = (self.target.getTarget().y - self.y);
        var run  = (self.target.getTarget().x - self.x);
        var length = Math.sqrt(Math.pow(run,2) + Math.pow(rise,2));

        self.units.map(function(unit){
          unit.move((run/length)*self.moveSpeed,(rise/length)*self.moveSpeed);
        });
        var avgStats = {x:0,y:0};
       self.units.map(function(unit){
         avgStats.x += unit.x;
         avgStats.y += unit.y;
       });
       self.x = avgStats.x / self.units.length;
       self.y = avgStats.y / self.units.length;
    }else if(self.target.getTarget() != null && self.target.getTarget().units == undefined){
      self.target.setTarget(null);
    }else if(serverClock - self.lastAttack >= 120 && self.target.getTarget() != null && distance(self,self.target.getTarget()) <= self.attackRange){
      self.units.map(function(unit){
        unit.shoot(self.bulletDamage,self.target.getTarget().units[0]);
      });
      self.lastAttack = serverClock;
    }
    if(statsUpdate){
      self.units.map(function(unit){
        unit.statsUpdate = false;
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
    var avgStats = {x:0,y:0};
    self.units.map(function(unit){
      avgStats.x += unit.x;
      avgStats.y += unit.y;
    });
    self.x = avgStats.x / self.units.length;
    self.y = avgStats.y / self.units.length;
  }
  self.drawPack = function(){
    return {id:self.id,target:self.target.getTarget(),units:self.units,x:self.x,y:self.y};
  }
  //can add or remove units
}

function Bullet(x,y,dmg,target){
  //can have a target
  var self = {
    x:x,
    y:y,
    dmg:dmg,
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
    self.target.takeDamage(self.dmg);

    for(var i =0; i < bullets.length;i++){
      if(self.id == bullets[i].id)
        bullets.splice(i,1);
      return;
    }
  }

  self.drawPack = function(){
    return {x:self.x,y:self.y,color:self.color,radius:self.radius};
  }
  return self;
}


function drawLoop(){
  var drawPack = [];
  for(var i =0; i < groups.length;i++)
    drawPack = drawPack.concat(groups[i].drawPack());
  for(var i =0; i < bullets.length;i++)
    drawPack = drawPack.concat(bullets[i].drawPack());

  for(var i in sockets){
    var socket = sockets[i];
    socket.emit('serverDraw',drawPack);
  }
}
var serverClock = 0;
function gameLoop(){
  serverClock++;
  for(var i =0; i < groups.length;i++)
    groups[i].update();
  for(var i =0; i < bullets.length;i++)
    bullets[i].move();
}
setInterval(drawLoop,1000/60);
setInterval(gameLoop,1000/30);


function Target(){
  var moveLocation = null;
  var groupAttacking = null;
  var groupsDefending = [];
  this.setTarget = function(item){
    groupAttacking = null;
    moveLocation = null;
    if(item == null)
      return;
    else if(item.units != undefined){
      groupAttacking = item;
    }else if(item != null){
      moveLocation = item;
    }
  }
  this.getTarget = function(){
    if(moveLocation != null)
      return moveLocation;
    if(groupAttacking != null)
      return groupAttacking;
    return null;
  }
  this.cont = function(grp){
    return groupsDefending.some(function(group){
      return grp.id == group.id;
    }) && (groupAttacking != null && rp.id != groupAttacking.id);
  }
  this.addAttacker = function(grp){
    if(!this.cont(grp))
      groupsDefending.push(grp);
  }
  this.removeAttacker = function(grp){
    groupsDefending = groupsDefending.filter(function(group){
      grp.id != group.id;
    });
  }
  this.getTotalTargets = function(){
    return groupAttacking != null && !this.cont(groupAttacking) ? groupsDefending.concat(groupAttacking) : groupsDefending;
  }
}
function distance(item1,item2){
  return Math.sqrt(Math.pow(item2.x - item1.x,2) + Math.pow(item2.y - item1.y,2));
}
function randomColor(){
  return '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
}
