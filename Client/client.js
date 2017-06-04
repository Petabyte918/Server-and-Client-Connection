var socket = io ();
var canvas = document.getElementById('Canvas');
canvas.addEventListener('mousemove',function(event){mouseMoved(event);});
canvas.addEventListener('click',function(event){mouseClicked(event);});
document.addEventListener('keydown',function(event){keyDown(event);});
document.addEventListener('keyup',function(event){keyUp(event);});


var ctx = canvas.getContext('2d');


var mapSize;
var player;
var option;

var s = {width:canvas.width,height:canvas.height};
var sM;
var rectSize = 50;

var keyList = [];

var serverDraw = [];

function mouseClicked(mouse){
  if(option == 'createUnit'){
    socket.emit('createUnit',{x:mouse.x + sM.x - (s.width/2)-10,y:mouse.y + sM.y - (s.height/2)-10});
  }else if(option == 'controlUnit'){
    socket.emit('controlUnit',{x:mouse.x + sM.x - (s.width/2)-10,y:mouse.y + sM.y - (s.height/2)-10,radius:1});
  }
}
function keyDown(key){
  if(key.keyCode == 49)
    option = 'createUnit';
  else if(key.keyCode == 50)
    option = 'controlUnit';
  else if(!keyList.includes(key.keyCode))
    keyList.push(key.keyCode);
}
function keyUp(key){
  keyList.splice(keyList.indexOf(key.keyCode),1);
}
function mouseMoved(mouse){}





function animLoop(){
  window.requestAnimationFrame(animLoop);
  gameLoop();
}



function gameLoop(){
  update();
  ctx.fillStyle = "#696969";
    ctx.clearRect(0,0,800,800);
    ctx.fillRect(0,0,800,800);
    ctx.beginPath();

    var sMx0 = sM.x - (s.width/2);
    var sMy0 = sM.y - (s.height/2);

    drawGrid(sMx0,sMy0);

    var objsToDraw = serverDraw.filter(function(obj){
      return obj.x + obj.radius >= sMx0 &&
             obj.x - obj.radius <= sMx0 + s.width  &&
             obj.y + obj.radius >= sMy0  &&
             obj.y - obj.radius <= sMy0 +s.height ;
    });
    for(var i= 0 ; i < objsToDraw.length;i++){
      drawCircle(objsToDraw[i],sMx0,sMy0);
    }
}

function drawGrid(sMx0,sMy0){
  ctx.beginPath();
  for(var x = rectSize - (sMx0 % rectSize); x < s.width + sM.x;x+= rectSize){
    ctx.moveTo(x,0);
    ctx.lineTo(x,s.height);
  }
  for(var y = rectSize-  (sMy0 % rectSize) ; y < s.height + sM.y ;y+= rectSize){
    ctx.moveTo(0,y);
    ctx.lineTo(s.width,y);
  }
  ctx.stroke();

  //Draws the borders of the map
  //Left-Vertical
  ctx.fillStyle = "#000000";
  if (sM.x <= s.width/2) {
        ctx.fillRect(0,0,s.width/2 - sM.x,s.height);
  }
    // Top-horizontal.
    if (sM.y <= s.height/2) {
        ctx.fillRect(0,0,s.width,s.height/2 - sM.y);
   }
    // Right-vertical.
    if (mapSize.width - sM.x <= s.width/2) {
        ctx.fillRect(mapSize.width + s.width/2 - sM.x,0,mapSize.width + s.width/2 - sM.x,s.height);
  }
    // Bottom-horizontal.
    if (mapSize.height - sM.y <= s.height/2) {
        ctx.fillRect(0,mapSize.height + s.height/2 - sM.y,s.width,mapSize.height + s.height/2 - sM.y);
  }
}
function drawCircle(obj,screenX0,screenY0){
  ctx.beginPath();
  ctx.arc(obj.x-screenX0,obj.y-screenY0,obj.radius,0,2 * Math.PI, false);
  ctx.fillStyle = obj.color;
  ctx.fill();
  ctx.stroke();
}
function update(){
  if(keyList.includes(87) && sM.y-5 > 0)
    sM.y-=5
  if(keyList.includes(68) && sM.x+5 < mapSize.width)
    sM.x+=5;
  if(keyList.includes(65) && sM.x-5 > 0)
    sM.x-=5;
  if(keyList.includes(83) && sM.y+5 < mapSize.height)
    sM.y+=5;
}




socket.on('connection',function(data){
  player = data.player;
  mapSize = data.mapSize;
  option = 'createUnit';
  sM ={x: Math.floor((Math.random() * mapSize.width)),y: Math.floor((Math.random() * mapSize.height))};
  console.log(data);
  animLoop();
});

socket.on('serverDraw',function(drawPack){
  serverDraw = drawPack;
});
