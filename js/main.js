/* ── Custom Cursor ── */
const cursor = document.getElementById('cursor');
const ring   = document.getElementById('cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';
});
(function animRing() {
  rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
  ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
  requestAnimationFrame(animRing);
})();

/* ── Scroll Progress Bar ── */
const progressBar = document.getElementById('scroll-progress');
function updateProgress() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = pct + '%';
}
window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

/* ── Smart Canvas Background ── */
(function() {
  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');

  const COLORS = ['#4FC3F7','#00E5FF','#7C4DFF','#E040FB'];
  const PARTICLE_COUNT = 90;
  const CONNECT_DIST   = 150;
  const MOUSE_REPEL    = 120;

  let W, H, particles = [];
  let mouseX = -9999, mouseY = -9999;

  // Soft ambient orb positions (animated separately on canvas)
  const orbs = [
    { x: 0.15, y: 0.1,  r: 320, color: '#7C4DFF', phase: 0    },
    { x: 0.85, y: 0.5,  r: 260, color: '#00E5FF', phase: 2    },
    { x: 0.45, y: 0.9,  r: 240, color: '#E040FB', phase: 4    },
    { x: 0.7,  y: 0.15, r: 180, color: '#4FC3F7', phase: 1.5  },
  ];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    initParticles();
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      particles.push({
        x:  Math.random() * W,
        y:  Math.random() * H,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r:  Math.random() * 2 + 1,
        color,
        alpha: Math.random() * 0.6 + 0.2,
      });
    }
  }

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
  });

  let t = 0;
  function draw() {
    t += 0.004;
    ctx.clearRect(0, 0, W, H);

    // Draw ambient orbs
    orbs.forEach(o => {
      const ox = o.x * W + Math.sin(t + o.phase) * 60;
      const oy = o.y * H + Math.cos(t * 0.7 + o.phase) * 40;
      const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, o.r);
      grad.addColorStop(0, hexAlpha(o.color, 0.18));
      grad.addColorStop(0.5, hexAlpha(o.color, 0.06));
      grad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(ox, oy, o.r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    });

    // Update + draw particles
    particles.forEach(p => {
      // Mouse repel
      const dx = p.x - mouseX, dy = p.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_REPEL && dist > 0) {
        const force = (MOUSE_REPEL - dist) / MOUSE_REPEL * 0.6;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }

      // Dampen velocity
      p.vx *= 0.98; p.vy *= 0.98;

      p.x += p.vx; p.y += p.vy;

      // Wrap
      if (p.x < -5) p.x = W + 5;
      if (p.x > W + 5) p.x = -5;
      if (p.y < -5) p.y = H + 5;
      if (p.y > H + 5) p.y = -5;

      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = hexAlpha(p.color, p.alpha);
      ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < CONNECT_DIST) {
          const alpha = (1 - d / CONNECT_DIST) * 0.25;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = hexAlpha(a.color, alpha);
          ctx.lineWidth   = 0.8;
          ctx.stroke();
        }
      }

      // Connect mouse to nearby particles
      const a = particles[i];
      const dx = a.x - mouseX, dy = a.y - mouseY;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < CONNECT_DIST * 1.4) {
        const alpha = (1 - d / (CONNECT_DIST * 1.4)) * 0.45;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.strokeStyle = hexAlpha('#00E5FF', alpha);
        ctx.lineWidth   = 1;
        ctx.stroke();
      }
    }

    requestAnimationFrame(draw);
  }

  function hexAlpha(hex, alpha) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
})();

/* ── Scroll Reveal ── */
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
  });
}, { threshold: 0.1 });
revealEls.forEach(el => io.observe(el));

/* ── Navbar background on scroll ── */
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  nav.style.background = window.scrollY > 50
    ? 'rgba(6,9,23,.92)'
    : 'rgba(6,9,23,.6)';
});

/* ── Photo upload ── */
const photoInput  = document.getElementById('photo-input');
const profileImg  = document.getElementById('profile-photo');
const placeholder = document.getElementById('avatar-placeholder');
const uploadHint  = document.getElementById('upload-hint');
if (photoInput) {
  photoInput.addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      profileImg.src = ev.target.result; profileImg.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
      if (uploadHint)  uploadHint.style.display   = 'none';
    };
    reader.readAsDataURL(file);
  });
}

/* ── Active nav link on scroll ── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 120) current = s.id; });
  navLinks.forEach(a => {
    a.style.color = a.getAttribute('href') === '#' + current ? 'var(--cyan)' : '';
  });
});