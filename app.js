const { API_URL, PUBLIC_SITE_URL } = window.EXILE;
const $ = s => document.querySelector(s), main = $('#main');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safe = u => /^(https?:\/\/|\/)/.test(u || '') ? esc(u) : '#';
const STATUS = { available: 'Available', in_development: 'In development', experimental: 'Experimental', research: 'Research', prototype: 'Prototype', published: 'Published' };
const pill = s => `<span class="pill ${esc(s)}">${esc(STATUS[s] || s || '')}</span>`;
const NAV = [['/', 'Home'], ['/products', 'Products'], ['/research', 'Research'], ['/log', 'Exile Log'], ['/portfolio', 'Portfolio'], ['/journal', 'Journal'], ['/careers', 'Careers'], ['/about', 'About'], ['/contact', 'Contact']];
const api = async p => { const r = await fetch(API_URL + p); if (!r.ok) throw Object.assign(new Error('x'), { status: r.status }); return r.json(); };
const toast = (m, err) => { const t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.textContent = m; t.onclick = () => t.remove(); $('#toasts').append(t); while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove(); setTimeout(() => t.remove(), 3500); };
const skel = n => `<div class="grid">${'<div class="card"><div class="sk big"></div><div class="sk"></div><div class="sk" style="width:60%"></div></div>'.repeat(n)}</div>`;
function meta(title, desc, path) {
  document.title = title ? `${title} — Exile Organization` : 'Exile Organization';
  const set = (sel, attr, v) => { let e = document.head.querySelector(sel); if (!e) { e = document.createElement(sel.startsWith('link') ? 'link' : 'meta'); const m = sel.match(/\[(\w+)="([^"]+)"\]/); e.setAttribute(m[1], m[2]); document.head.append(e); } e.setAttribute(attr, v); };
  set('meta[name="description"]', 'content', desc || ''); set('meta[property="og:title"]', 'content', document.title); set('meta[property="og:description"]', 'content', desc || '');
  set('meta[property="og:url"]', 'content', PUBLIC_SITE_URL + path); set('meta[property="og:image"]', 'content', PUBLIC_SITE_URL + '/logo.png'); set('link[rel="canonical"]', 'href', PUBLIC_SITE_URL + path);
}
function reveal() {
  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && (e.target.classList.add('vis'), io.unobserve(e.target))), { threshold: .1 });
  document.querySelectorAll('.rv').forEach((el, i) => { el.style.transitionDelay = Math.min(i % 6, 5) * 60 + 'ms'; io.observe(el); });
  const tl = $('.tl'); if (tl) { const f = tl.querySelector('.fill'), on = () => { const r = tl.getBoundingClientRect(); f.style.height = Math.max(0, Math.min(r.height, innerHeight * .6 - r.top)) + 'px'; }; addEventListener('scroll', on, { passive: true }); on(); }
}
const card = p => `<a class="card rv" href="/products/${esc(p.slug)}">${pill(p.status)}<h3>${esc(p.name)}</h3><p class="muted">${esc(p.short_description)}</p><span class="sm">${esc(p.category)}</span></a>`;
const sec = (h, inner) => `<section><h2>${h}</h2>${inner}</section>`;
const empty = t => `<p class="muted">${t}</p>`;
const dt = d => d ? esc(String(d).slice(0, 10)) : '';

// ---- QR modal ----
let qrLib;
const loadQR = () => qrLib ??= new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'; s.onload = ok; s.onerror = no; document.head.append(s); });
async function qrModal(name, slug, plat) {
  const url = `${PUBLIC_SITE_URL}/download/${slug}/${plat}`, m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div role="dialog" aria-modal="true" aria-label="QR code"><h3>${esc(name)}</h3><div class="sm">${esc(plat)}</div><div class="qr" id="qrbox"><span class="dots"><i></i><i></i><i></i></span></div><p class="sm" style="word-break:break-all">${esc(url)}</p><div class="row"><button class="btn" id="cp">Copy link</button><button class="btn p" id="cl">Close</button></div></div>`;
  document.body.append(m); const close = () => { m.remove(); removeEventListener('keydown', esc_); }; const esc_ = e => e.key === 'Escape' && close(); addEventListener('keydown', esc_);
  m.onclick = e => e.target === m && close(); m.querySelector('#cl').onclick = close; m.querySelector('#cl').focus();
  m.querySelector('#cp').onclick = () => navigator.clipboard.writeText(url).then(() => toast('Link copied'), () => toast('Copy failed', 1));
  try { await loadQR(); const b = m.querySelector('#qrbox'); b.innerHTML = ''; new QRCode(b, { text: url, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.M }); } catch { m.querySelector('#qrbox').textContent = 'QR unavailable'; }
}

// ---- pages ----
const pages = {
  async '/'() {
    const [s, ps] = await Promise.all([api('/api/settings'), api('/api/products')]);
    meta('', s.tagline, '/');
    return `<div class="hero"><img src="/logo.png" alt="Exile Organization" width="280" height="280"><h1>EXILE ORGANIZATION</h1><p>${esc(s.tagline)}</p><div class="row"><a class="btn p" href="/products">Explore the Ecosystem</a><a class="btn" href="/about">Explore Exile</a></div></div>
    ${sec('The Exile ecosystem', `<div class="grid">${ps.map(card).join('')}</div><p class="sm" style="margin-top:20px">Status labels are literal: only products marked Available can be downloaded.</p>`)}
    ${s.total_downloads != null ? `<section><h2>${Number(s.total_downloads).toLocaleString()}</h2><p class="muted">unique downloads</p></section>` : ''}`;
  },
  async '/products'() { meta('Products', 'The Exile ecosystem of products and research projects.', '/products'); const ps = await api('/api/products'); return sec('Products & ecosystem', `<div class="grid">${ps.map(card).join('')}</div>`); },
  async '/research'() {
    meta('Exile Labs', 'Research from Exile Labs.', '/research'); const r = await api('/api/research_entries');
    const areas = ['Artificial Intelligence', 'Distributed systems', 'Privacy', 'Peer-to-peer networks', 'Wireless communication', 'Operating systems', 'Digital identity', 'Human-computer interaction', 'Educational technology', 'Emergency communication', 'Local-first software'];
    return sec('EXILE LABS', `<div class="tags">${areas.map(a => `<span>${a}</span>`).join('')}</div>` + (r.length ? `<div class="grid">${r.map(x => `<div class="card rv">${pill(x.status)}<h3>${esc(x.title)}</h3><p class="muted">${esc(x.abstract)}</p><p class="sm">${esc(x.authors)} · ${dt(x.date)}</p>${x.link_url ? `<a href="${safe(x.link_url)}" rel="noopener" target="_blank">Read →</a>` : ''}</div>`).join('')}</div>` : empty('No research entries have been published yet.')));
  },
  async '/log'() {
    meta('Exile Log', 'Institutional timeline of Exile Organization.', '/log'); const l = await api('/api/exile_log_entries?limit=100');
    return sec('EXILE LOG', `<div class="tl"><div class="fill"></div>${l.map(e => `<article class="rv"><div class="sm">${dt(e.date)} · ${esc(e.category)}</div><h3>${esc(e.title)}</h3>${e.status ? pill(e.status) : ''}<p class="muted">${esc(e.description)}</p>${e.product_slug ? `<a href="/products/${esc(e.product_slug)}">${esc(e.product_slug)}</a> ` : ''}${e.link_url ? `<a href="${safe(e.link_url)}" target="_blank" rel="noopener">Link →</a>` : ''}</article>`).join('')}</div>`);
  },
  async '/portfolio'() {
    const p = await api('/api/portfolio'); meta('Portfolio', p.intro, '/portfolio'); const list = a => Array.isArray(a) && a.length ? `<ul class="muted">${a.map(x => `<li>${esc(typeof x === 'string' ? x : x.title || JSON.stringify(x))}</li>`).join('')}</ul>` : '';
    return `<section><p class="sm">FOUNDER</p><h1>${esc(p.name)}</h1><p class="pill available" style="color:var(--fg)">${esc(p.title)}</p><p class="muted prose">${esc(p.intro)}</p><p class="prose">${esc(p.bio)}</p>
    <div class="row" style="justify-content:flex-start">${p.github ? `<a class="btn" href="${safe(p.github)}" target="_blank" rel="noopener">GitHub</a>` : ''}${p.linkedin ? `<a class="btn" href="${safe(p.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : ''}${p.email ? `<a class="btn" href="mailto:${esc(p.email)}">Email</a>` : ''}</div></section>
    ${p.skills.length ? sec('Skills', list(p.skills)) : ''}${p.education.length ? sec('Education', list(p.education)) : ''}${p.experience.length ? sec('Experience', list(p.experience)) : ''}${p.achievements.length ? sec('Achievements', list(p.achievements)) : ''}${p.publications.length ? sec('Publications', list(p.publications)) : ''}
    ${sec('Projects', `<div class="grid">${p.projects.map(x => `<div class="card rv"><span class="sm">${esc(x.status)}</span><h3>${esc(x.title)}</h3><p class="muted">${esc(x.description)}</p>${x.url ? `<a href="${safe(x.url)}" target="_blank" rel="noopener">View →</a>` : ''}</div>`).join('')}</div>`)}`;
  },
  async '/journal'() {
    meta('Exile Journal', 'Articles from Exile Organization.', '/journal'); const j = await api('/api/journal_posts');
    return sec('EXILE JOURNAL', j.length ? `<div class="grid">${j.map(x => `<a class="card rv" href="/journal/${esc(x.slug)}"><span class="sm">${esc(x.category)} · ${dt(x.date)}</span><h3>${esc(x.title)}</h3><p class="sm">${esc(x.author)}</p></a>`).join('')}</div>` : empty('No articles published yet.'));
  },
  async '/careers'() { const s = await api('/api/settings'); meta('Careers', s.careers, '/careers'); return sec('Careers & community', `<p class="prose">${esc(s.careers)}</p>`); },
  async '/about'() { const s = await api('/api/settings'); meta('About', s.about, '/about'); return sec('About Exile', `<p class="prose">${esc(s.about)}</p>`); },
  async '/contact'() { const [s, l] = await Promise.all([api('/api/settings'), api('/api/links')]); meta('Contact', 'Contact Exile Organization.', '/contact'); return sec('Contact', `${s.contact_email ? `<p><a href="mailto:${esc(s.contact_email)}">${esc(s.contact_email)}</a></p>` : empty('Contact details have not been published yet.')}<div class="row" style="justify-content:flex-start">${l.filter(x => !x.product_slug).map(x => `<a class="btn" href="${safe(x.url)}" target="_blank" rel="noopener">${esc(x.label)}</a>`).join('')}</div>`); },
};
async function product(slug) {
  const [p, links] = await Promise.all([api('/api/products/' + slug), api('/api/links')]); meta(p.name, p.short_description, '/products/' + slug);
  const apps = p.applications.map(a => `<div class="card"><h3>${esc(a.platform)}</h3><p class="sm">v${esc(a.version)} · ${dt(a.release_date)}</p><div class="row" style="justify-content:flex-start"><a class="btn p dl" data-s="${esc(slug)}" data-p="${esc(a.platform)}" href="/download/${esc(slug)}/${esc(a.platform)}"><span>Download</span></a><button class="btn qrb" data-n="${esc(p.name)}" data-s="${esc(slug)}" data-p="${esc(a.platform)}">QR</button></div></div>`).join('');
  const ext = [['Website', p.website_url], ['Docs', p.docs_url], ['GitHub', p.github_url], ...links.filter(l => l.product_slug === slug).map(l => [l.label, l.url])].filter(x => x[1]);
  return `<section><a class="sm" href="/products">← Products</a><p>${pill(p.status)} <span class="sm">${esc(p.category)}${p.version ? ' · v' + esc(p.version) : ''}</span></p><h1>${esc(p.name)}</h1><p class="muted" style="font-size:1.2rem">${esc(p.short_description)}</p><p class="prose">${esc(p.full_description) || ''}</p>
  ${(p.screenshots || []).filter(u => /^https?:/.test(u)).map(u => `<img loading="lazy" src="${esc(u)}" alt="${esc(p.name)} screenshot" style="max-width:100%;border-radius:12px;margin:8px 0" width="640" height="360">`).join('')}
  <h2>Download</h2>${apps ? `<div class="grid">${apps}</div>` : empty(p.status === 'available' ? 'No download is active right now.' : 'Not available for download — this project is ' + esc((STATUS[p.status] || '').toLowerCase()) + '.')}
  <div class="row" style="justify-content:flex-start;margin-top:20px">${ext.map(([l, u]) => `<a class="btn" href="${safe(u)}" target="_blank" rel="noopener">${esc(l)}</a>`).join('')}</div></section>`;
}
async function post(slug) { const j = await api('/api/journal_posts/' + slug); meta(j.title, (j.content || '').slice(0, 155), '/journal/' + slug); return `<section><a class="sm" href="/journal">← Journal</a><p class="sm">${esc(j.category)} · ${dt(j.date)} · ${esc(j.author)}</p><h1>${esc(j.title)}</h1>${j.cover_url ? `<img src="${safe(j.cover_url)}" alt="" style="max-width:100%;border-radius:12px" width="800" height="420">` : ''}<div class="prose">${esc(j.content)}</div>${j.tags ? `<div class="tags">${esc(j.tags).split(',').map(t => `<span>${t.trim()}</span>`).join('')}</div>` : ''}</section>`; }
async function dlPage(slug, plat) {
  meta('Download ' + slug, '', `/download/${slug}/${plat}`); main.innerHTML = `<div class="err404"><h1 style="color:var(--fg)">${esc(slug.toUpperCase())}</h1><p class="muted">Preparing your download… <span class="dots"><i></i><i></i><i></i></span></p><div class="sig" style="margin:auto"><i></i><b></b></div></div>`;
  try { const r = await fetch(`${API_URL}/api/qr/${slug}/${plat}`); if (!r.ok) throw 0; } catch { return main.innerHTML = `<div class="err404"><h1>Unavailable</h1><p class="muted">This download is not available right now.</p><a class="btn" href="/products">Browse products</a></div>`; }
  setTimeout(() => { main.querySelector('p').textContent = 'Download starting…'; location.href = `${API_URL}/download/${slug}/${plat}`; main.querySelector('.err404').insertAdjacentHTML('beforeend', `<p class="sm">If nothing happens:</p><a class="btn p" href="${API_URL}/download/${esc(slug)}/${esc(plat)}">Download ${esc(slug)}</a>`); }, 600);
}
const notFound = () => `<div class="err404"><h1>404</h1><p class="muted">SYSTEM PATH NOT FOUND<br>The requested destination does not exist.</p><a class="btn p" href="/">Return to Exile</a></div>`;

async function route() {
  const path = location.pathname.replace(/\/+$/, '') || '/', m = path.match(/^\/(products|journal)\/([a-z0-9-]+)$/), d = path.match(/^\/download\/([a-z0-9-]+)\/([a-z0-9-]+)$/);
  document.querySelectorAll('#links a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '/' ? path === '/' : path.startsWith(a.getAttribute('href'))));
  $('#links').classList.remove('open'); $('#menuBtn').setAttribute('aria-expanded', 'false');
  if (d) return dlPage(d[1], d[2]);
  main.innerHTML = skel(3); main.style.animation = 'none'; void main.offsetWidth; main.style.animation = '';
  try { const h = m ? (m[1] === 'products' ? () => product(m[2]) : () => post(m[2])) : pages[path]; main.innerHTML = h ? await h() : (meta('Not found', '', path), notFound()); }
  catch (e) { main.innerHTML = e.status === 404 ? notFound() : `<div class="err404"><h1 style="color:var(--err)">Error</h1><p class="muted">Could not load this page. Please try again.</p><button class="btn" onclick="location.reload()">Retry</button></div>`; }
  if (!location.hash) scrollTo(0, 0); reveal(); main.focus({ preventScroll: true });
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="/"]');
  if (a && !a.dataset.s && !e.metaKey && !e.ctrlKey && a.target !== '_blank') { e.preventDefault(); history.pushState({}, '', a.href); route(); return; }
  const dl = e.target.closest('.dl'); if (dl) { e.preventDefault(); const b = dl.firstElementChild; b.textContent = 'Downloading…'; dl.setAttribute('disabled', ''); location.href = `${API_URL}/download/${dl.dataset.s}/${dl.dataset.p}`; setTimeout(() => { b.textContent = 'Download started'; toast('Download started'); dl.removeAttribute('disabled'); }, 900); return; }
  const q = e.target.closest('.qrb'); if (q) qrModal(q.dataset.n, q.dataset.s, q.dataset.p);
});
addEventListener('popstate', route);
$('#links').innerHTML = NAV.map(([h, l]) => `<a href="${h}">${l}</a>`).join('');
$('#menuBtn').onclick = () => { const o = $('#links').classList.toggle('open'); $('#menuBtn').setAttribute('aria-expanded', o); };
addEventListener('offline', () => { $('#net').className = 'off'; $('#net').textContent = '● CONNECTION INTERRUPTED'; });
addEventListener('online', () => { $('#net').className = 'on'; $('#net').textContent = '● CONNECTION RESTORED'; setTimeout(() => { $('#net').textContent = ''; }, 2500); });
route().finally(() => { $('#boot').classList.add('off'); setTimeout(() => $('#boot').remove(), 400); });
