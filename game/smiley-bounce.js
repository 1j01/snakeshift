// Create a full-screen canvas
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.zIndex = '999';

// Set canvas size to the window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 50,
  dx: 0.1,
  dy: 0.1
};

function drawSmiley() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#FFD700'; // Yellow
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#000000'; // Black
  ctx.stroke();

  // Eyes
  ctx.beginPath();
  ctx.arc(ball.x - 20, ball.y - 15, 5, 0, Math.PI * 2);
  ctx.arc(ball.x + 20, ball.y - 15, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#000000'; // Black
  ctx.fill();

  // Mouth
  ctx.beginPath();
  ctx.arc(ball.x, ball.y + 15, 20, 0, Math.PI, false);
  ctx.stroke();
}

var t = Date.now(); // performance.now() is better but not supported in Kindle 4.x
function update() {
  var dt = Date.now() - t;
  t = Date.now();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Bounce off the walls
  if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
    ball.dx *= -1;
  }
  if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
    ball.dy *= -1;
  }

  // Update position
  ball.x += ball.dx * dt
  ball.y += ball.dy * dt

  drawSmiley();
}

setInterval(update, 1000);

window.addEventListener('resize', function () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
