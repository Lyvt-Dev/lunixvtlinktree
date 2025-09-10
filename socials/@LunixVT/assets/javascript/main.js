// i18n + UI logic + analytics + music toggle
const cfg = window.__I18N_CONFIG__ || { defaultLang: 'en', supported: ['en'], path: 'assets/javascript/i18n' };

const state = {
  lang: localStorage.getItem('lang') || cfg.defaultLang,
  dict: {},
  musicOn: false,
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

async function loadLang(lang) {
  const safe = cfg.supported.includes(lang) ? lang : cfg.defaultLang;
  const url = `${cfg.path}/${safe}.json?v=${Date.now()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}`);
    state.dict = await res.json();
    state.lang = safe;
    localStorage.setItem('lang', safe);
    applyI18n();
    updateLangButton();
  } catch (err) {
    console.error('[i18n] error:', err);
  }
}

function t(key, fallback = '') {
  return state.dict[key] ?? fallback;
}

function applyI18n() {
  $$('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const val = t(key, el.textContent.trim());
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = val;
    } else {
      el.textContent = val;
    }
  });
  document.documentElement.lang = state.lang;
  // Update dynamic a11y labels that aren't in the DOM as text
  updateMusicA11yLabel();
}

function updateLangButton() {
  const btn = $('#lang-btn .lang-text');
  if (btn) btn.textContent = state.lang.toUpperCase();
}

function setupLanguageSwitcher() {
  const btn = $('#lang-btn');
  btn?.addEventListener('click', () => {
    const idx = cfg.supported.indexOf(state.lang);
    const next = cfg.supported[(idx + 1) % cfg.supported.length];
    loadLang(next);
  });
}

function setupAnalytics() {
  $$('.links-grid a, .contact-row a').forEach((a) => {
    a.addEventListener('click', () => {
      const label = a.getAttribute('data-analytics') || a.textContent.trim();
      const ts = new Date().toISOString();
      const payload = { label, ts, href: a.href };
      // Persist locally
      const existing = JSON.parse(localStorage.getItem('link_clicks') || '[]');
      existing.push(payload);
      localStorage.setItem('link_clicks', JSON.stringify(existing));
      // Also log for debugging
      console.log('[analytics] click', payload);
    });
  });
}

function setupMusicToggle() {
  const btn = $('#music-toggle');
  const audio = $('#bg-music');
  if (!btn || !audio) return;
  let loaded = false;

  function setOn(on) {
    state.musicOn = on;
    btn.classList.toggle('active', on);
    updateMusicA11yLabel();
    if (on) {
      if (!loaded) {
        audio.load();
        loaded = true;
      }
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Autoplay might be blocked; user can click again
      });
    } else {
      audio.pause();
    }
  }

  // Set initial accessible label
  updateMusicA11yLabel();
  btn.addEventListener('click', () => setOn(!state.musicOn));
}

function updateMusicA11yLabel() {
  const btn = $('#music-toggle');
  if (!btn) return;
  const label = state.musicOn ? t('pause_music', 'Pause music') : t('play_music', 'Play music');
  btn.setAttribute('aria-label', label);
  btn.title = label;
}

document.addEventListener('DOMContentLoaded', async () => {
  setupLanguageSwitcher();
  setupAnalytics();
  setupMusicToggle();
  await loadLang(state.lang);

  // Try to autoplay background music immediately
  const audio = document.getElementById('bg-music');
  const btn = document.getElementById('music-toggle');
  if (audio && btn) {
    // Ensure volume is gentle
    audio.volume = 0.35;
    const tryPlay = async () => {
      try {
        await audio.play();
        state.musicOn = true;
        btn.classList.add('active');
        updateMusicA11yLabel();
      } catch (e) {
        // Autoplay likely blocked; wait for first user interaction to start
        const resumeOnInteraction = async () => {
          try {
            await audio.play();
            state.musicOn = true;
            btn.classList.add('active');
            updateMusicA11yLabel();
          } catch {}
          window.removeEventListener('pointerdown', resumeOnInteraction);
          window.removeEventListener('keydown', resumeOnInteraction);
        };
        window.addEventListener('pointerdown', resumeOnInteraction, { once: true });
        window.addEventListener('keydown', resumeOnInteraction, { once: true });
      }
    };
    tryPlay();
  }

  // Assign charm variants to links for variety
  try {
    const links = document.querySelectorAll('.links-grid .link-item');
    links.forEach((a, i) => {
      if (i % 3 === 1) a.classList.add('charm-heart');
      if (i % 5 === 2) a.classList.add('charm-bear');
    });
  } catch {}
});

// Hide loading overlay once assets are loaded
window.addEventListener('load', () => {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.classList.add('hide');
    setTimeout(() => overlay.remove(), 400);
  }
  startDynamicStars();
});

// Spawn small stars that fade in/out around the page for a galaxy vibe
function startDynamicStars(){
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  const layer = document.querySelector('.bg-decoration') || document.body;
  if (!layer) return;

  const rnd = (min, max) => Math.random() * (max - min) + min;
  let active = 0;
  // Scale cap by viewport area so bigger screens can hold more stars
  const vw0 = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const vh0 = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  const area = vw0 * vh0;
  const MAX = Math.min(320, Math.max(180, Math.round(area / 6000))); // 180–320 depending on size

  const spawn = () => {
    if (active >= MAX) return;
    const star = document.createElement('div');
    star.className = 'dyn-star';

    // size variation
    const r = Math.random();
    if (r > 0.96) star.classList.add('huge');
    else if (r > 0.8) star.classList.add('big');

    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const x = rnd(0, vw) + 'px';
    const y = rnd(0, vh) + 'px';
    const dx = rnd(-30, 30) + 'px';
    const dy = rnd(-20, 20) + 'px';
    const ms = Math.floor(rnd(1800, 3200));
    const dur = ms + 'ms';
    const drift = rnd(6000, 11000) + 'ms';

    star.style.setProperty('--x', x);
    star.style.setProperty('--y', y);
    star.style.setProperty('--dx', dx);
    star.style.setProperty('--dy', dy);
    star.style.setProperty('--dur', dur);
    star.style.setProperty('--drift', drift);

    layer.appendChild(star);
    active++;

    const cleanup = () => { star.removeEventListener('animationend', cleanup); if (star.isConnected) star.remove(); active--; };
    star.addEventListener('animationend', cleanup);
    // Fallback cleanup in case animationend is missed
    setTimeout(() => { if (star.isConnected) { star.remove(); active--; } }, ms + 800);
  };

  // spawn loop (~8-9 stars per second)
  const RATE_MS = 120;
  setInterval(spawn, RATE_MS); // keep running indefinitely
}