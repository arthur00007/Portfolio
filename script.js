// Dynamic & Reactive Particle Background
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let particles = [];
const particleCount = 70;
let w = window.innerWidth, h = window.innerHeight;

function resizeCanvas() {
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Particle {
  constructor() {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.radius = 1.5 + Math.random() * 2.2;
    this.speedX = (Math.random() - 0.5) * 0.8;
    this.speedY = (Math.random() - 0.5) * 0.8;
    this.color = `rgba(${50+Math.random()*205},${100+Math.random()*155},255,${0.5+Math.random()*0.5})`;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    // Bounce off the edges
    if (this.x < 0 || this.x > w) this.speedX *= -1;
    if (this.y < 0 || this.y > h) this.speedY *= -1;
  }
}

function createParticles() {
  particles = [];
  for (let i = 0; i < particleCount; i++) particles.push(new Particle());
}
createParticles();

// Mouse interaction
let mouse = {x: null, y: null, radius: 90};
canvas.addEventListener('mousemove', function(e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
canvas.addEventListener('mouseleave', function() {
  mouse.x = null;
  mouse.y = null;
});

function connectParticles() {
  for(let a = 0; a < particles.length; a++) {
    for(let b = a+1; b < particles.length; b++) {
      let dx = particles[a].x - particles[b].x;
      let dy = particles[a].y - particles[b].y;
      let dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 120) {
        ctx.strokeStyle = 'rgba(30, 136, 229, ' + (1-dist/120)*0.5 + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(particles[a].x, particles[a].y);
        ctx.lineTo(particles[b].x, particles[b].y);
        ctx.stroke();
      }
    }
  }
}

function animate() {
  ctx.clearRect(0, 0, w, h);
  for (let p of particles) {
    p.update();
    // Reactive: Move away from mouse
    if (mouse.x && mouse.y) {
      let dx = p.x - mouse.x;
      let dy = p.y - mouse.y;
      let dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < mouse.radius) {
        let angle = Math.atan2(dy, dx);
        let move = (mouse.radius - dist) * 0.06;
        p.x += Math.cos(angle) * move;
        p.y += Math.sin(angle) * move;
      }
    }
    p.draw();
  }
  connectParticles();
  requestAnimationFrame(animate);
}
animate();