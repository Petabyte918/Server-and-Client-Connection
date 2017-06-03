var socket = io ();
var canvas = document.getElementById('Canvas');
canvas.addEventListener('mousemove',function(event){mouseMoved(event);});
canvas.addEventListener('click',function(event){mouseClicked(event);});
document.addEventListener('keypress',function(event){keyPressed(event);});

var ctx = canvas.getContext('2d');


var mapSize;
var player;
var option;

var s = {width:canvas.width,height:canvas.height};
var sM;

function mouseClicked(mouse){
  if(option == 'createUnit'){
    socket.emit('createUnit',{x:mouse.x + sM.x - (s.width/2),y:mouse.y + sM.y - (s.height/2)});
    console.log(mouse.y + " " + sM.y + " " + s.height);
  }
}
function keyPressed(key){
  console.log(key.keyCode);
  if(key.keyCode == 49)
    option = 'createUnit';
  else if(key.keyCode = 50)
    option = 'controlUnit';
}

function mouseMoved(mouse){}










socket.on('connection',function(data){
  player = data.player;
  mapSize = data.mapSize;
  option = 'createUnit';
  sM ={x: mapSize.width/2,y: mapSize.height/2};
  console.log(data);
});
