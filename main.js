const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let img = new Image();
let scalePoints = [];
let snakePoints = [];
let pixelsPerCM = null;

document.getElementById('imageLoader').addEventListener('change', function(e) {
  const reader = new FileReader();
  reader.onload = function(event) {
    img.onload = function() {
      // Fit canvas to screen
      const maxWidth = window.innerWidth - 40;
      const scaleFactor = img.width > maxWidth ? maxWidth / img.width : 1;
      canvas.width = img.width * scaleFactor;
      canvas.height = img.height * scaleFactor;
      ctx.setTransform(scaleFactor, 0, 0, scaleFactor, 0, 0);
      ctx.drawImage(img, 0, 0);
      resetPoints();
      document.getElementById('info').innerText = 'Click two points on the scale.';
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(e.target.files[0]);
});

canvas.addEventListener('click', function(e) {
  if (!img.src) return;

  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left);
  const y = (e.clientY - rect.top);

  if (scalePoints.length < 2) {
    scalePoints.push({x, y});
    drawDot(x, y, 'red');
    if (scalePoints.length === 2) {
      drawLine(scalePoints[0], scalePoints[1], 'red');
      const pixelDist = getDistance(scalePoints[0], scalePoints[1]);
      const knownCM = prompt("Enter the real-world length (in cm) between the first two points:");
      if (knownCM && !isNaN(knownCM)) {
        pixelsPerCM = pixelDist / parseFloat(knownCM);
        document.getElementById('info').innerText = 'Now click along the snake’s body to trace it. Double click to finish.';
      }
    }
  } else {
    snakePoints.push({x, y});
    const len = snakePoints.length;
    drawDot(x, y, 'blue');
    if (len > 1) drawLine(snakePoints[len - 2], snakePoints[len - 1], 'blue');
  }
});

canvas.addEventListener('dblclick', function() {
  if (snakePoints.length > 1 && pixelsPerCM) {
    let totalPixels = 0;
    for (let i = 0; i < snakePoints.length - 1; i++) {
      totalPixels += getDistance(snakePoints[i], snakePoints[i + 1]);
    }
    const realLength = totalPixels / pixelsPerCM;
    document.getElementById('info').innerText = `Measured snake length: ${realLength.toFixed(2)} cm`;
  }
});

function drawDot(x, y, color = 'black') {
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawLine(p1, p2, color = 'black') {
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function getDistance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function resetPoints() {
  scalePoints = [];
  snakePoints = [];
  pixelsPerCM = null;
}

function reset() {
  if (img.src) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    resetPoints();
    document.getElementById('info').innerText = 'Click two points on a known scale, then trace the snake’s path.';
  }
}
canvas.addEventListener('contextmenu', function(e) {
  e.preventDefault(); // prevent right-click menu

  if (snakePoints.length > 0 && scalePoints.length === 2) {
    snakePoints.pop(); // remove last point

    // Redraw everything
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Re-scale canvas to fit image again
    const maxWidth = window.innerWidth - 40;
    const scaleFactor = img.width > maxWidth ? maxWidth / img.width : 1;
    canvas.width = img.width * scaleFactor;
    canvas.height = img.height * scaleFactor;
    ctx.setTransform(scaleFactor, 0, 0, scaleFactor, 0, 0);
    ctx.drawImage(img, 0, 0);

    // Redraw scale points and line
    scalePoints.forEach(p => drawDot(p.x, p.y, 'red'));
    if (scalePoints.length === 2) drawLine(scalePoints[0], scalePoints[1], 'red');

    // Redraw snake trace
    snakePoints.forEach((p, i) => {
      drawDot(p.x, p.y, 'blue');
      if (i > 0) drawLine(snakePoints[i - 1], p, 'blue');
    });

    document.getElementById('info').innerText = `Last point removed. Remaining points: ${snakePoints.length}`;
  }
});