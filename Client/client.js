var socket = io ();
var canvas = document.getElementById('Canvas');
canvas.addEventListener('mousemove',function(event){mouseMoved(event);});
canvas.addEventListener('click',function(event){mouseClicked(event);});
document.addEventListener('keypress',function(event){keyPressed(event);});

var ctx = canvas.getContext('2d');
