// Patch Notes page logic
// - Loads JSON from assets/config/patch-notes.json
// - Sorts newest-first by date or semver-like version fallback
// - Renders pretty cards matching homepage style

(function initPatchPage(){
  // Reuse the same star background and page fade-in experience from homepage
  try { if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; } } catch {}
  try { setTimeout(() => { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); }, 0); } catch {}

  // Lightweight star field like homepage (optional: fewer stars)
  class MiniStarField {
    constructor(){
      this.layer = document.querySelector('.bg-stars') || document.body;
      this.timer = null;
      const prefersReduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.max = prefersReduced ? 96 : 180;
      this.rate = prefersReduced ? 220 : 150;
      this.stars = [];
      this.timer = setInterval(() => this.spawn(), this.rate);
      // Pause work when tab is hidden
      const onVis = () => {
        if (document.hidden) {
          if (this.timer) { clearInterval(this.timer); this.timer = null; }
        } else if (!this.timer) {
          this.timer = setInterval(() => this.spawn(), this.rate);
        }
      };
      document.addEventListener('visibilitychange', onVis, { passive: true });
    }
    spawn(){
      // Cleanup
      const now = Date.now();
      for (let i = this.stars.length - 1; i >= 0; i--) {
        const s = this.stars[i];
        if (now - s.t > s.d + 800) { s.el?.remove(); this.stars.splice(i,1); }
      }
      if (this.stars.length >= this.max) return;
      const el = document.createElement('div');
      el.className = 'dyn-star';
      const r = Math.random();
      if (r > 0.985) el.classList.add('giant'); else if (r > 0.96) el.classList.add('huge'); else if (r > 0.8) el.classList.add('big');
      const vw = Math.max(document.documentElement.clientWidth, window.innerWidth||0);
      const vh = Math.max(document.documentElement.clientHeight, window.innerHeight||0);
      const x = Math.random()*vw, y = Math.random()*vh;
      const dx = (Math.random()-0.5)*60, dy = (Math.random()-0.5)*40;
      const dur = Math.floor(2000 + Math.random()*1600);
      const drift = Math.floor(6000 + Math.random()*5000);
      el.style.setProperty('--x', `${x}px`);
      el.style.setProperty('--y', `${y}px`);
      el.style.setProperty('--dx', `${dx}px`);
      el.style.setProperty('--dy', `${dy}px`);
      el.style.setProperty('--dur', `${dur}ms`);
      el.style.setProperty('--drift', `${drift}ms`);
      this.layer.appendChild(el);
      const rec = { el, t: Date.now(), d: dur };
      this.stars.push(rec);
      const cleanup = () => { el.removeEventListener('animationend', cleanup); if (el.isConnected) el.remove(); const i = this.stars.indexOf(rec); if (i!==-1) this.stars.splice(i,1); };
      el.addEventListener('animationend', cleanup);
      setTimeout(cleanup, dur + 800);
    }
  }

  function parseDateSafe(s){
    // Accept YYYY-MM-DD or other Date-parsable formats
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  function cmpVersion(a,b){
    // Basic semver-ish compare: split by '.' and compare numerically
    const pa = String(a).replace(/^v/i,'').split('.').map(n=>parseInt(n,10)||0);
    const pb = String(b).replace(/^v/i,'').split('.').map(n=>parseInt(n,10)||0);
    const len = Math.max(pa.length, pb.length);
    for (let i=0;i<len;i++){
      const na = pa[i]||0, nb = pb[i]||0;
      if (na!==nb) return na>nb?1:-1;
    }
    return 0;
  }

  async function loadPatchNotes(){
    const tryPaths = [
      '/assets/config/patch-notes.json',
      'assets/config/patch-notes.json',
      '../assets/config/patch-notes.json',
      '../../assets/config/patch-notes.json'
    ];
    for (const p of tryPaths){
      try {
        const res = await fetch(p, { cache: 'no-cache' });
        if (!res.ok) continue;
        const data = await res.json();
        if (Array.isArray(data)) return data;
      } catch {}
    }
    return [];
  }

  function renderNotes(notes){
    const container = document.querySelector('#patch-notes');
    if (!container) return;
    container.innerHTML = '';
    const frag = document.createDocumentFragment();

    if (!notes.length){
      const empty = document.createElement('div');
      empty.className = 'news-item';
      empty.innerHTML = '<p class="news-excerpt">Noch keine Patch Notes vorhanden. Füge welche in <code>assets/config/patch-notes.json</code> hinzu. ✨</p>';
      container.appendChild(empty);
      return;
    }

    for (const n of notes){
      const card = document.createElement('article');
      card.className = 'news-item';
      const dateTxt = n.date ? new Date(n.date).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' }) : '';
      const title = n.title || `Version ${n.version}`;
      const highlights = Array.isArray(n.highlights) ? n.highlights : [];
      const changes = Array.isArray(n.changes) ? n.changes : [];
      const links = Array.isArray(n.links) ? n.links : [];

      if (n.rich) {
        // Render exactly as provided (no auto title/date/version)
        card.innerHTML = `<div class="news-excerpt"></div>`;
        const body = card.querySelector('.news-excerpt');
        body.insertAdjacentHTML('beforeend', n.rich);
        // Version pill bottom-right (if version provided)
        if (n.version) {
          const pill = document.createElement('div');
          pill.className = 'version-pill';
          pill.textContent = `v${n.version}`;
          card.appendChild(pill);
        }
      } else {
        const hlHtml = highlights.length ? `<ul>${highlights.map(h=>`<li>${formatInline(h)}</li>`).join('')}</ul>` : '';
        const chHtml = changes.length ? `<ul>${changes.map(c=>`<li>${formatInline(c)}</li>`).join('')}</ul>` : '';
        const lkHtml = links.length ? `<div class="link-row">${links.map(l=>`<a class="link-btn" href="${escapeAttr(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.label||l.url)}</a>`).join('')}</div>` : '';
        card.innerHTML = `
          <h3 class="news-title">${escapeHtml(title)}</h3>
          ${hlHtml ? `<p class="news-excerpt"><strong>Highlights</strong></p>${hlHtml}` : ''}
          ${chHtml ? `<p class="news-excerpt"><strong>Changes</strong></p>${chHtml}` : ''}
          ${lkHtml}
        `;
        // Version pill bottom-right
        const pill = document.createElement('div');
        pill.className = 'version-pill';
        pill.textContent = `v${n.version || ''}`;
        card.appendChild(pill);
      }
      frag.appendChild(card);
    }
    container.appendChild(frag);
  }

  function escapeHtml(s){
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function escapeAttr(s){
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/"/g,'&quot;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
  }

  function formatInline(s){
    // Minimal inline markdown: **bold** only
    const safe = escapeHtml(s);
    // Replace **bold** with <strong>
    return safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  function applySiteVersion(){
    (async () => {
      const tryPaths = [
        '/assets/config/config.json','assets/config/config.json','../assets/config/config.json','../../assets/config/config.json'
      ];
      let cfg=null;
      for (const p of tryPaths){
        try{ const r = await fetch(p, { cache: 'no-cache' }); if (!r.ok) continue; cfg = await r.json(); if (cfg?.version) break; }catch{}
      }
      if (cfg?.version){
        document.querySelectorAll('.site-version').forEach(el => { el.textContent = `v.${cfg.version}`; });
      }
    })();
  }

  async function main(){
    new MiniStarField();
    document.body.style.opacity = '0';
    setTimeout(() => { document.body.style.transition = 'opacity 0.8s ease'; document.body.style.opacity = '1'; }, 60);

    const data = await loadPatchNotes();
    // Sort newest‑first: by date desc if both have dates; fallback to version compare
    const sorted = [...data].sort((a,b) => {
      const da = a.date && parseDateSafe(a.date);
      const db = b.date && parseDateSafe(b.date);
      if (da && db){ return db.getTime() - da.getTime(); }
      if (da && !db) return -1; // a has date -> newer first
      if (!da && db) return 1;
      // fallback to version
      const cv = cmpVersion(a.version||'0.0.0', b.version||'0.0.0');
      return -cv; // higher first
    });

    renderNotes(sorted);
    applySiteVersion();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main); else main();
})();
