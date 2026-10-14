// Exile motion layer: progressive enhancement only. The site works fully without this file.
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const FINE = matchMedia('(hover: hover) and (pointer: fine)');
const $ = s => document.querySelector(s);
const main = $('#main');

// ---- 1. scroll progress + compact nav ----
{
  const bar = $('#prog'), nav = $('.nav'); let busy = false;
  const upd = () => {
    busy = false;
    const h = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
    if (nav) nav.classList.toggle('scrolled', scrollY > 24);
  };
  const req = () => { if (!busy) { busy = true; requestAnimationFrame(upd); } };
  addEventListener('scroll', req, { passive: true }); addEventListener('resize', req); upd();
}

// ---- 2. cards: pointer spotlight + 3D tilt (mouse only) ----
{
  let cur = null, raf = 0, last = null;
  const leave = c => { c.style.transform = ''; c.style.transition = ''; c.dataset.t = ''; };
  const step = () => {
    raf = 0; const e = last, c = e.target.closest && e.target.closest('.card');
    if (cur && cur !== c) leave(cur);
    cur = c; if (!c) return;
    const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    c.style.setProperty('--mx', x + 'px'); c.style.setProperty('--my', y + 'px');
    if (c.tagName === 'A' && c.classList.contains('vis')) {
      if (!c.dataset.t) { c.dataset.t = '1'; c.style.transitionDelay = '0ms'; c.style.transition = 'transform .15s ease-out,border-color .18s,box-shadow .25s,opacity .5s'; }
      c.style.transform = `perspective(900px) rotateX(${((y / r.height) - .5) * -7}deg) rotateY(${((x / r.width) - .5) * 7}deg) translateY(-4px)`;
    }
  };
  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || RM.matches || !FINE.matches) return;
    last = e; if (!raf) raf = requestAnimationFrame(step);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { if (cur) { leave(cur); cur = null; } });
}

// ---- 3. split hero headline into animated letters ----
function split(root) {
  root.querySelectorAll('[data-split]').forEach(h => {
    if (h.dataset.done) return; h.dataset.done = '1';
    const text = h.textContent; h.setAttribute('aria-label', text); h.textContent = '';
    let i = 0;
    text.split(' ').forEach((w, wi, all) => {
      const word = document.createElement('span'); word.className = 'word'; word.setAttribute('aria-hidden', 'true');
      [...w].forEach(ch => { const s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', i++); s.textContent = ch; word.append(s); });
      h.append(word); if (wi < all.length - 1) h.append(' ');
    });
  });
}

// ---- 4. count-up numbers ----
function counters(root) {
  root.querySelectorAll('[data-count]').forEach(el => {
    if (el.dataset.done) return; el.dataset.done = '1';
    const end = Number(el.dataset.count); if (RM.matches || !isFinite(end)) return;
    el.textContent = '0';
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect();
      const t0 = performance.now(), d = 1600;
      const tick = t => { const p = Math.min(1, (t - t0) / d); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4))).toLocaleString(); if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }); io.observe(el);
  });
}

// ---- 5. hero signal network (canvas) ----
function network(hero) {
  if (hero.querySelector('.net')) return;
  const cv = document.createElement('canvas'); cv.className = 'net'; cv.setAttribute('aria-hidden', 'true'); hero.prepend(cv);
  const ctx = cv.getContext('2d'); if (!ctx) return;
  let W = 0, H = 0, nodes = [], onscreen = true; const m = { x: -999, y: -999 };
  const spawn = () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4, r: Math.random() * 1.5 + .8, c: Math.random() < .5 ? '0,208,132' : '22,131,255' });
  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2); W = hero.clientWidth; H = hero.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(72, Math.max(24, W * H / 15000)));
    while (nodes.length < n) nodes.push(spawn()); nodes.length = n;
    nodes.forEach(p => { p.x = Math.min(p.x, W); p.y = Math.min(p.y, H); });
  };
  const LINK = 135, MOUSE = 170;
  const frame = move => {
    ctx.clearRect(0, 0, W, H);
    for (const p of nodes) {
      if (move) {
        const dx = m.x - p.x, dy = m.y - p.y, d = Math.hypot(dx, dy);
        if (d < MOUSE && d > 1) { p.vx += dx / d * .012; p.vy += dy / d * .012; }
        const sp = Math.hypot(p.vx, p.vy); if (sp > .9) { p.vx *= .9 / sp; p.vy *= .9 / sp; }
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;
      }
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) { ctx.strokeStyle = `rgba(${a.c},${(1 - d / LINK) * .32})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      const dm = Math.hypot(a.x - m.x, a.y - m.y);
      if (dm < MOUSE) { ctx.strokeStyle = `rgba(${a.c},${(1 - dm / MOUSE) * .7})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(m.x, m.y); ctx.stroke(); }
    }
    for (const p of nodes) {
      ctx.fillStyle = `rgba(${p.c},.12)`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.2832); ctx.fill();
      ctx.fillStyle = `rgba(${p.c},.9)`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
    }
  };
  size(); const ro = new ResizeObserver(() => { size(); if (RM.matches) frame(false); }); ro.observe(hero);
  if (RM.matches) { frame(false); return; }
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect(); m.x = e.clientX - r.left; m.y = e.clientY - r.top;
    hero.style.setProperty('--hx', m.x + 'px'); hero.style.setProperty('--hy', m.y + 'px');
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { m.x = m.y = -999; });
  new IntersectionObserver(([e]) => { onscreen = e.isIntersecting; }).observe(hero);
  const loop = () => {
    if (!cv.isConnected) { ro.disconnect(); return; }
    if (onscreen && !document.hidden) frame(true);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

// ---- wire up whenever the router swaps page content ----
const scan = () => { split(main); counters(main); const h = main.querySelector('.hero'); if (h) network(h); };
new MutationObserver(scan).observe(main, { childList: true });
scan();
