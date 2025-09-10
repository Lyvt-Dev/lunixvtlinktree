// Set cookie consent attribute ASAP so CSS can hide banners before JS wiring
(() => {
    try {
        const val = localStorage.getItem('cookie_consent');
        if (val) document.documentElement.setAttribute('data-cookie-consent', val);
    } catch {}
})();

class StarField {
    constructor() {
        this.stars = [];
        // Scale number of stars by viewport area (keeps it lively on big screens)
        const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        const area = vw * vh;
        const prefersReduced = matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
        // Lower density if user prefers reduced motion
        const baseMax = Math.min(320, Math.max(180, Math.round(area / 6000))); // 180–320
        this.maxStars = prefersReduced ? Math.max(90, Math.round(baseMax * 0.5)) : baseMax;
        this.layer = document.querySelector('.bg-stars') || document.querySelector('.bg-decoration') || document.body;
        this.spawnRateMs = prefersReduced ? 200 : 120; // slower spawn if reduced motion
        this._spawnTimer = null;
        this.init();
    }

    init() {
        // Start continuous spawning
        this._spawnTimer = setInterval(() => this.spawnOnce(), this.spawnRateMs);
        // Pause work when tab is hidden to save CPU/GPU
        const onVis = () => {
            if (document.hidden) {
                if (this._spawnTimer) { clearInterval(this._spawnTimer); this._spawnTimer = null; }
            } else if (!this._spawnTimer) {
                this._spawnTimer = setInterval(() => this.spawnOnce(), this.spawnRateMs);
            }
        };
        document.addEventListener('visibilitychange', onVis, { passive: true });
    }

    spawnOnce() {
        // Clean up finished stars
        this.cleanupStars();
        if (this.stars.length >= this.maxStars) return;
        this.createStar();
    }

    createStar() {
        const star = document.createElement('div');
        star.className = 'dyn-star';

        // Slightly increase chance for bigger stars and add a new giant variant
        const r = Math.random();
        if (r > 0.985) star.classList.add('giant');
        else if (r > 0.96) star.classList.add('huge');
        else if (r > 0.8) star.classList.add('big');

        const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        const x = Math.random() * vw;
        const y = Math.random() * vh;

        const dx = (Math.random() - 0.5) * 60;  // softer drift
        const dy = (Math.random() - 0.5) * 40;

        const durationMs = Math.floor(2000 + Math.random() * 1600); // 2.0s – 3.6s
        const driftMs = Math.floor(6000 + Math.random() * 5000);     // 6s – 11s

        star.style.setProperty('--x', `${x}px`);
        star.style.setProperty('--y', `${y}px`);
        star.style.setProperty('--dx', `${dx}px`);
        star.style.setProperty('--dy', `${dy}px`);
        star.style.setProperty('--dur', `${durationMs}ms`);
        star.style.setProperty('--drift', `${driftMs}ms`);

        this.layer.appendChild(star);
        const record = { element: star, createdAt: Date.now(), duration: durationMs };
        this.stars.push(record);

        // Remove on animation end as well as a fallback timeout
        const cleanup = () => {
            star.removeEventListener('animationend', cleanup);
            if (star.isConnected) star.remove();
            const idx = this.stars.indexOf(record);
            if (idx !== -1) this.stars.splice(idx, 1);
        };
        star.addEventListener('animationend', cleanup);
        setTimeout(cleanup, durationMs + 800);
    }

    cleanupStars() {
        const now = Date.now();
        for (let i = this.stars.length - 1; i >= 0; i--) {
            const s = this.stars[i];
            if (now - s.createdAt > s.duration + 800) {
                if (s.element && s.element.isConnected) s.element.remove();
                this.stars.splice(i, 1);
            }
        }
    }

    syncState(){
        if (this.audio.paused) {
            this.button.classList.remove('active');
            this.button.setAttribute('aria-label', 'Play music');
            this.button.setAttribute('title', 'Play');
        } else {
            this.button.classList.add('active');
            this.button.setAttribute('aria-label', 'Pause music');
            this.button.setAttribute('title', 'Pause');
        }
    }
}

// Cookie consent manager (top-level)
class CookieConsent {
    constructor() {
        this.key = 'cookie_consent';
        this.prefsKey = 'cookie_consent_prefs';
        this._listeners = [];
        this.status = this.read(); // 'all' | 'essential' | null
        this.prefs = this.readPrefs(); // { media: boolean }
        this.banner = document.getElementById('cookie-banner');
        this.acceptBtn = document.getElementById('cookie-accept');
        this.rejectBtn = document.getElementById('cookie-reject');
        this.modal = null;
        this.wire();
    }

    read() {
        // Prefer cookie (shared across paths) and fallback to localStorage
        try {
            const m = document.cookie.match(/(?:^|; )cookie_consent=([^;]*)/);
            if (m) return decodeURIComponent(m[1]);
        } catch {}
        try { return localStorage.getItem(this.key); } catch { return null; }
    }

    write(val) {
        // Persist to cookie (1 year) and localStorage
        try { document.cookie = `cookie_consent=${encodeURIComponent(val)}; path=/; max-age=${60*60*24*365}; SameSite=Lax`; } catch {}
        try { localStorage.setItem(this.key, val); } catch {}
        this.status = val;
        this._listeners.forEach(fn => { try { fn(val); } catch {} });
        try { document.documentElement.setAttribute('data-cookie-consent', val); } catch {}
        try { window.dispatchEvent(new CustomEvent('cookie-consent-change', { detail: { value: val } })); } catch {}
    }

    readPrefs() {
        try {
            const m = document.cookie.match(/(?:^|; )cookie_consent_prefs=([^;]*)/);
            if (m) return JSON.parse(decodeURIComponent(m[1]));
        } catch {}
        try {
            const s = localStorage.getItem(this.prefsKey);
            if (s) return JSON.parse(s);
        } catch {}
        return { media: false };
    }

    writePrefs(prefs) {
        const val = JSON.stringify(prefs || {});
        try { document.cookie = `cookie_consent_prefs=${encodeURIComponent(val)}; path=/; max-age=${60*60*24*365}; SameSite=Lax`; } catch {}
        try { localStorage.setItem(this.prefsKey, val); } catch {}
        this.prefs = { ...(prefs || {}) };
        try { window.dispatchEvent(new CustomEvent('cookie-prefs-change', { detail: { prefs: this.prefs } })); } catch {}
    }

    onChange(fn) { this._listeners.push(fn); }

    wire() {
        if (!this.banner) return;
        // Ensure banner is not trapped by parent stacking contexts
        try { if (this.banner.parentElement !== document.body) document.body.appendChild(this.banner); } catch {}
        const hasChoice = this.status === 'all' || this.status === 'essential';
        this.banner.hidden = hasChoice; // show only if no choice yet
        // If a prior choice exists, mirror it as a root attribute so all pages can auto-hide banners
        if (hasChoice) {
            try { document.documentElement.setAttribute('data-cookie-consent', this.status); } catch {}
            // Immediately remove any banner present
            try { this.banner.remove(); } catch {}
            return;
        }
        this.banner.style.display = 'grid';
        this.banner.setAttribute('aria-hidden', 'false');
        // Direct handlers (if present)
        if (this.acceptBtn) this.acceptBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.debug('[CookieConsent] Accept clicked');
            this.hide();
            this.write('all');
            this.writePrefs({ media: true });
        });
        if (this.rejectBtn) this.rejectBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.debug('[CookieConsent] Reject clicked');
            this.hide();
            this.write('essential');
            this.writePrefs({ media: false });
        });
        // Delegated handlers (robust if nodes change)
        this.banner.addEventListener('click', (e) => {
            const t = e.target;
            if (!(t instanceof HTMLElement)) return;
            if (t.id === 'cookie-accept' || t.closest('#cookie-accept')) {
                e.preventDefault();
                console.debug('[CookieConsent] Accept (delegated)');
                this.hide();
                this.write('all');
                this.writePrefs({ media: true });
            } else if (t.id === 'cookie-reject' || t.closest('#cookie-reject')) {
                e.preventDefault();
                console.debug('[CookieConsent] Reject (delegated)');
                this.hide();
                this.write('essential');
                this.writePrefs({ media: false });
            }
        }, { capture: true });
        // Expose globally for other scripts (optional)
        window.CookieConsent = this;
    }

    show() {
        if (!this.banner) return;
        this.banner.hidden = false;
        this.banner.style.display = 'grid';
        this.banner.setAttribute('aria-hidden', 'false');
    }

    reset() {
        try { localStorage.removeItem(this.key); } catch {}
        try { document.cookie = 'cookie_consent=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'; } catch {}
        try { localStorage.removeItem(this.prefsKey); } catch {}
        try { document.cookie = 'cookie_consent_prefs=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'; } catch {}
        this.status = null;
        this.show();
    }

    hide() {
        if (!this.banner) return;
        this.banner.hidden = true;
        this.banner.style.display = 'none';
        this.banner.setAttribute('aria-hidden', 'true');
        // Remove from DOM to avoid any overlay artifacts
        try { this.banner.remove(); } catch {}
    }

    // Build settings modal lazily
    buildSettingsModal() {
        if (this.modal && document.body.contains(this.modal)) return;
        const backdrop = document.createElement('div');
        backdrop.className = 'cookie-modal-backdrop';
        backdrop.innerHTML = `
          <div class="cookie-modal" role="dialog" aria-modal="true" aria-label="Cookie-Einstellungen">
            <h3 class="cookie-modal-title">Cookie‑Einstellungen</h3>
            <p class="cookie-modal-desc">Wähle, welche Kategorien du erlauben möchtest. Du kannst dies jederzeit ändern.</p>
            <div class="cookie-opt">
              <label>
                <input type="checkbox" id="opt-media" />
                <span>Medieneinbindungen (Twitch, Twitter)</span>
              </label>
            </div>
            <div class="cookie-modal-actions">
              <button type="button" class="btn btn-ghost" id="btn-cancel">Abbrechen</button>
              <button type="button" class="btn" id="btn-necessary">Nur notwendige</button>
              <button type="button" class="btn btn-primary" id="btn-save">Speichern</button>
              <button type="button" class="btn btn-primary" id="btn-accept-all">Alle akzeptieren</button>
            </div>
          </div>`;

        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) this.closeSettings();
        });
        document.body.appendChild(backdrop);
        this.modal = backdrop;

        // Wire modal buttons
        const mediaCb = this.modal.querySelector('#opt-media');
        const cancelBtn = this.modal.querySelector('#btn-cancel');
        const saveBtn = this.modal.querySelector('#btn-save');
        const necessaryBtn = this.modal.querySelector('#btn-necessary');
        const acceptAllBtn = this.modal.querySelector('#btn-accept-all');

        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeSettings());
        if (saveBtn) saveBtn.addEventListener('click', () => {
            const prefs = { media: !!mediaCb?.checked };
            this.writePrefs(prefs);
            // If user enables media but status was essential/null, keep essential but allow media
            if (prefs.media && this.status !== 'all') {
                // keep status as is; granular consent applies
            }
            this.closeSettings();
        });
        if (necessaryBtn) necessaryBtn.addEventListener('click', () => {
            this.write('essential');
            this.writePrefs({ media: false });
            this.closeSettings();
        });
        if (acceptAllBtn) acceptAllBtn.addEventListener('click', () => {
            this.write('all');
            this.writePrefs({ media: true });
            this.closeSettings();
        });
    }

    openSettings() {
        this.buildSettingsModal();
        // Sync current prefs
        const mediaCb = this.modal.querySelector('#opt-media');
        if (mediaCb) mediaCb.checked = !!(this.prefs && this.prefs.media === true);
        this.modal.classList.add('open');
        document.body.classList.add('cookie-modal-open');
    }

    closeSettings() {
        if (!this.modal) return;
        this.modal.classList.remove('open');
        document.body.classList.remove('cookie-modal-open');
        // Keep in DOM for next open
    }
}

class Navigation {
    constructor() {
        this.init();
    }

    init() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                item.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    item.style.transform = '';
                }, 150);
            });
        });
    }

    tryAutoplay(){
        // Best-effort autoplay; if blocked, enable on first user interaction
        this.audio.play().then(() => {
            this.button.classList.add('active');
            this.button.setAttribute('aria-label', 'Pause music');
            this.button.setAttribute('title', 'Pause');
            localStorage.setItem('music_pref', 'playing');
        }).catch(() => {
            const resume = async () => {
                try {
                    await this.audio.play();
                    this.button.classList.add('active');
                    this.button.setAttribute('aria-label', 'Pause music');
                    this.button.setAttribute('title', 'Pause');
                    localStorage.setItem('music_pref', 'playing');
                } catch(_) {}
                window.removeEventListener('click', resume);
                window.removeEventListener('keydown', resume);
                window.removeEventListener('touchstart', resume, { passive: true });
            };
            window.addEventListener('click', resume, { once: true });
            window.addEventListener('keydown', resume, { once: true });
            window.addEventListener('touchstart', resume, { once: true, passive: true });
        });
    }
}


class SocialLinks {
    constructor() {
        this.init();
    }

    init() {
        const socialLinks = document.querySelectorAll('.social-link');
        
        socialLinks.forEach(link => {
            link.addEventListener('mouseenter', () => {
                const icon = link.querySelector('.social-icon');
                icon.style.boxShadow = '0 6px 20px rgba(124,77,255,0.5)';
            });
            
            link.addEventListener('mouseleave', () => {
                const icon = link.querySelector('.social-icon');
                icon.style.boxShadow = '';
            });
        });
    }
}

class NewsItems {
    constructor() {
        this.init();
    }

    init() {
        const newsItems = document.querySelectorAll('.news-item');
        
        newsItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.boxShadow = '0 4px 16px rgba(124,77,255,0.2)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.boxShadow = '';
            });
        });
    }
}

class ScrollAnimations {
    constructor() {
        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        const contentBoxes = document.querySelectorAll('.content-box');
        contentBoxes.forEach(box => {
            box.style.opacity = '0';
            box.style.transform = 'translateY(30px)';
            box.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(box);
        });
    }
}

class XTweetEmbeds {
    constructor() {
        this.username = window.X_USERNAME || 'lunixvt';
        this.tweetUrls = window.X_TWEET_URLS || [];
        this.init();
    }

    init() {
        // Avoid multiple inits regardless of consent status
        if (window.__X_TWEETS_INIT__) {
            console.debug('[XTweetEmbeds] Already initialized, skipping');
            return;
        }
        // Always allow Twitter embeds regardless of cookie consent
        // Note: Users' privacy tools/extensions may still block third-party scripts.

        this.loadXWidget();
        this.createTweetEmbeds();
        window.__X_TWEETS_INIT__ = true;
    }

    loadXWidget() {
        if (!document.querySelector('script[src*="platform.twitter.com"]')) {
            const script = document.createElement('script');
            script.src = 'https://platform.twitter.com/widgets.js';
            script.async = true;
            script.charset = 'utf-8';
            document.head.appendChild(script);
        }
    }

    async createTweetEmbeds() {
        const socialLinksDiv = document.querySelector('.social-links');
        if (!socialLinksDiv) return;

        socialLinksDiv.innerHTML = '';

        console.log('Tweet URLs configured:', this.tweetUrls);

        if (this.tweetUrls.length === 0) {
            this.showPlaceholder(socialLinksDiv);
            return;
        }

        const tweetsContainer = document.createElement('div');
        tweetsContainer.className = 'tweets-container';

        for (let i = 0; i < Math.min(this.tweetUrls.length, 1); i++) {
            const tweetUrl = this.tweetUrls[i];
            console.log('Creating embed for:', tweetUrl);
            await this.createSingleTweetEmbed(tweetUrl, tweetsContainer);
        }

        socialLinksDiv.appendChild(tweetsContainer);

        setTimeout(() => {
            console.log('Initializing Twitter widgets...');
            if (window.twttr && window.twttr.widgets) {
                window.twttr.widgets.load().then(() => {
                    console.log('Twitter widgets loaded successfully');
                    // Post-check: if no iframe rendered after a short delay, show a fallback card
                    setTimeout(() => {
                        const hasIframe = !!tweetsContainer.querySelector('iframe');
                        if (!hasIframe) {
                            console.warn('Twitter widget did not render; showing fallback');
                            this.showFallbackLink(tweetsContainer);
                        }
                    }, 1500);
                }).catch(error => {
                    console.error('Failed to load Twitter widgets:', error);
                    this.showFallbackLink(tweetsContainer);
                });
            } else {
                console.log('Twitter widgets script not loaded yet, retrying...');
                setTimeout(() => {
                    if (window.twttr && window.twttr.widgets) {
                        window.twttr.widgets.load();
                        setTimeout(() => {
                            const hasIframe = !!tweetsContainer.querySelector('iframe');
                            if (!hasIframe) {
                                this.showFallbackLink(tweetsContainer);
                            }
                        }, 1500);
                    } else {
                        // Final fallback: widgets never loaded (likely blocked by browser). Show link card.
                        this.showFallbackLink(tweetsContainer);
                    }
                }, 1000);
            }
        }, 1500);
    }

    async createSingleTweetEmbed(tweetUrl, container) {
        try {
            const tweetContainer = document.createElement('div');
            tweetContainer.className = 'single-tweet-container';

            const blockquote = document.createElement('blockquote');
            blockquote.className = 'twitter-tweet';
            blockquote.setAttribute('data-theme', 'dark');
            blockquote.setAttribute('data-conversation', 'none');
            blockquote.setAttribute('data-cards', 'visible');
            blockquote.setAttribute('data-height', '450');
            blockquote.setAttribute('data-dnt', 'true');
            
            const tweetLink = document.createElement('a');
            tweetLink.href = tweetUrl;
            tweetLink.textContent = 'Loading tweet...';
            
            blockquote.appendChild(tweetLink);
            tweetContainer.appendChild(blockquote);
            container.appendChild(tweetContainer);

        } catch (error) {
            console.error('Failed to create tweet embed:', error);
        }
    }

    showPlaceholder(container) {
        const placeholder = document.createElement('div');
        placeholder.className = 'tweets-placeholder';
        placeholder.innerHTML = `
            <div class="placeholder-content">
                <div class="placeholder-icon">🐦</div>
                <h3>Loading Tweets...</h3>
                <p>If tweets don't appear, check the browser console for errors.</p>
                <p class="placeholder-note">Configured URLs: ${this.tweetUrls.length}</p>
            </div>
        `;
        container.appendChild(placeholder);
    }

    showFallbackLink(container) {
        const url = this.tweetUrls && this.tweetUrls[0] ? this.tweetUrls[0] : null;
        const fallback = document.createElement('div');
        fallback.className = 'tweets-placeholder';
        fallback.innerHTML = `
            <div class="placeholder-content">
                <div class="placeholder-icon">🔗</div>
                <h3>Tweet kann nicht eingebunden werden</h3>
                <p>Öffne den Tweet direkt auf X/Twitter:</p>
                ${url ? `<p><a class="view-all-btn" href="${url}" target="_blank" rel="noopener">Tweet öffnen</a></p>` : ''}
            </div>
        `;
        container.appendChild(fallback);
    }

    addTweet(tweetUrl) {
        if (!this.tweetUrls.includes(tweetUrl)) {
            this.tweetUrls.unshift(tweetUrl);
            if (this.tweetUrls.length > 1) {
                this.tweetUrls = this.tweetUrls.slice(0, 1);
            }
            this.createTweetEmbeds();
        }
    }
}

class TwitchAPI {
    constructor() {
        this.clientId = window.TWITCH_CLIENT_ID || 'YOUR_CLIENT_ID';
        this.accessToken = window.TWITCH_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN';
        this.channelName = window.TWITCH_CHANNEL_NAME || 'lunixvt'; // Use config or fallback
        this.channelId = null;
        this.init();
    }

    async init() {
        try {
            await this.getUserId();
            await this.updateStats();
            setInterval(() => this.updateStats(), 5 * 60 * 1000);
        } catch (error) {
            console.error('Failed to initialize Twitch API:', error);
            this.showError();
        }
    }

    async getUserId() {
        const response = await fetch(`https://api.twitch.tv/helix/users?login=${this.channelName}`, {
            headers: {
                'Client-ID': this.clientId,
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get user ID: ${response.status}`);
        }

        const data = await response.json();
        if (data.data && data.data.length > 0) {
            this.channelId = data.data[0].id;
        } else {
            throw new Error('User not found');
        }
    }

    async getFollowerCount() {
        if (!this.channelId) return 0;

        const response = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${this.channelId}`, {
            headers: {
                'Client-ID': this.clientId,
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get followers: ${response.status}`);
        }

        const data = await response.json();
        return data.total || 0;
    }

    async getStreamCount() {
        if (!this.channelId) return 0;

        const response = await fetch(`https://api.twitch.tv/helix/videos?user_id=${this.channelId}&type=archive`, {
            headers: {
                'Client-ID': this.clientId,
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get stream count: ${response.status}`);
        }

        const data = await response.json();
        return data.data ? data.data.length : 0;
    }

    async isLive() {
        if (!this.channelId) return false;

        const response = await fetch(`https://api.twitch.tv/helix/streams?user_id=${this.channelId}`, {
            headers: {
                'Client-ID': this.clientId,
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        return data.data && data.data.length > 0;
    }

    async updateStats() {
        try {
            const [followerCount, streamCount, isLive] = await Promise.all([
                this.getFollowerCount(),
                this.getStreamCount(),
                this.isLive()
            ]);

            this.updateFollowerDisplay(followerCount);
            this.updateStreamDisplay(streamCount);
            this.updateLiveStatus(isLive);

        } catch (error) {
            console.error('Failed to update Twitch stats:', error);
            this.showError();
        }
    }

    updateFollowerDisplay(count) {
        const followerElement = document.querySelector('.stat-item .stat-number');
        if (followerElement) {
            const formatted = this.formatNumber(count);
            followerElement.textContent = formatted;
            
            followerElement.style.transform = 'scale(1.1)';
            setTimeout(() => {
                followerElement.style.transform = 'scale(1)';
            }, 200);
        }
    }

    updateStreamDisplay(count) {
        const streamElements = document.querySelectorAll('.stat-item .stat-number');
        if (streamElements.length > 1) {
            const streamElement = streamElements[1];
            streamElement.textContent = count;
            
            streamElement.style.transform = 'scale(1.1)';
            setTimeout(() => {
                streamElement.style.transform = 'scale(1)';
            }, 200);
        }
    }

    updateLiveStatus(isLive) {
        let liveIndicator = document.querySelector('.live-indicator');
        
        if (isLive && !liveIndicator) {
            liveIndicator = document.createElement('div');
            liveIndicator.className = 'live-indicator';
            liveIndicator.innerHTML = '🔴 LIVE';
            liveIndicator.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: #ff4444;
                color: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: bold;
                animation: pulse 2s infinite;
            `;
            
            const socialBox = document.querySelector('.social-box');
            if (socialBox) {
                socialBox.style.position = 'relative';
                socialBox.appendChild(liveIndicator);
            }
        } else if (!isLive && liveIndicator) {
            liveIndicator.remove();
        }
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    showError() {
        const followerElement = document.querySelector('.stat-item .stat-number');
        const streamElements = document.querySelectorAll('.stat-item .stat-number');
        
        if (followerElement) {
            followerElement.textContent = 'Error';
            followerElement.style.color = '#ff6b6b';
        }
        
        if (streamElements.length > 1) {
            streamElements[1].textContent = 'Error';
            streamElements[1].style.color = '#ff6b6b';
        }
    }
}

function initApp(){
    // Always start at top on reload/visit
    try { if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; } } catch {}
    try {
        // Use a short delay to override browser restoring previous scroll
        setTimeout(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' }); }, 0);
    } catch {
        window.scrollTo(0, 0);
    }
    new StarField();
    new Navigation();
    new SocialLinks();
    new NewsItems();
    new ScrollAnimations();

    // Init bottom-center scroll-down button
    try {
        const btn = document.getElementById('scroll-down');
        const targetEl = document.querySelector('.stream-plans-box') || document.querySelector('.main-container');
        if (btn && targetEl) {
            // Show hint only near top
            const update = () => {
                const y = window.scrollY || document.documentElement.scrollTop || 0;
                btn.classList.toggle('hidden', y > 40);
                btn.classList.toggle('hint', y < 10);
            };
            update();
            window.addEventListener('scroll', update, { passive: true });
            btn.addEventListener('click', () => {
                const top = targetEl.getBoundingClientRect().top + window.pageYOffset - 80; // account for navbar
                window.scrollTo({ top, behavior: 'smooth' });
            });
        }
    } catch {}

    // Init cookie consent first
    const consent = new CookieConsent();

    const enableTwitchEmbedIfConsented = () => {
        const mediaAllowed = (consent.status === 'all') || (consent.prefs && consent.prefs.media === true);
        if (!mediaAllowed) return;
        const iframe = document.querySelector('.vod-embed iframe');
        if (iframe && !iframe.src) {
            const dataSrc = iframe.getAttribute('data-src');
            if (dataSrc) iframe.src = dataSrc;
        }
    };

    const showVODPlaceholderIfBlocked = () => {
        const wrap = document.querySelector('.vod-embed');
        if (!wrap) return;
        // Only add placeholder if iframe not yet loaded
        const iframe = wrap.querySelector('iframe');
        const hasSrc = iframe && iframe.getAttribute('src');
        if (consent.status === 'all' || hasSrc) return;
        const ph = document.createElement('div');
        ph.className = 'vod-placeholder';
        ph.innerHTML = `
            <div style="padding: 22px; text-align: center; color: var(--muted);">
              <div class="vod-thumb-skeleton" style="margin: 16px auto 12px;"></div>
              <div>Der Twitch-Player ist deaktiviert, bis du Cookies akzeptierst.</div>
              <div style="margin-top:10px;"><button id="accept-cookies-twitch" class="btn btn-primary" type="button">Alle akzeptieren</button></div>
            </div>`;
        // Ensure placeholder is on top
        ph.style.position = 'absolute'; ph.style.inset = '0';
        wrap.appendChild(ph);
        ph.querySelector('#accept-cookies-twitch')?.addEventListener('click', () => {
            consent.write('all');
            consent.writePrefs({ media: true });
        });
    };

    // Load or block third-party embeds based on current consent
    if (consent.status === 'all' || (consent.prefs && consent.prefs.media === true)) {
        new XTweetEmbeds();
        enableTwitchEmbedIfConsented();
    } else {
        showVODPlaceholderIfBlocked();
        // Defer tweets until accepted; XTweetEmbeds will render placeholder as well
        new XTweetEmbeds();
    }

    // When consent changes to 'all', enable third-party embeds
    consent.onChange((val) => {
        if (val === 'all') {
            enableTwitchEmbedIfConsented();
            new XTweetEmbeds();
        }
    });
    window.addEventListener('cookie-prefs-change', () => {
        enableTwitchEmbedIfConsented();
        new XTweetEmbeds();
    });

    // Wire up cookie settings links to open settings modal
    document.querySelectorAll('.cookie-settings-link').forEach((el) => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            consent.openSettings();
        });
    });

    // Twitch API stats disabled: edit numbers directly in HTML (homepage > .social-stats)
    // If you want to re-enable automatic stats, restore the instantiation below.
    // if (window.TWITCH_CLIENT_ID && window.TWITCH_ACCESS_TOKEN) {
    //     new TwitchAPI();
    // } else {
    //     console.log('Twitch API credentials not found. Add them to enable live stats.');
    // }
    
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.8s ease';
        document.body.style.opacity = '1';
    }, 100);

    // Highlight today's day in the Stream Plans list
    try {
        // Use German abbreviations to match the HTML schedule (So, Mo, Di, Mi, Do, Fr, Sa)
        const deDayAbbr = ['So','Mo','Di','Mi','Do','Fr','Sa'];
        const todayName = deDayAbbr[new Date().getDay()].toLowerCase();
        const items = document.querySelectorAll('.stream-plans .plan-schedule li');
        items.forEach(li => {
            const dayEl = li.querySelector('.day');
            if (!dayEl) return;
            // Compare the first two letters to be robust against punctuation or longer labels
            const text = (dayEl.textContent || '').trim().slice(0,2).toLowerCase();
            if (text === todayName) {
                li.classList.add('today');
            }
        });
    } catch (e) {
        console.warn('Failed to set today highlight:', e);
    }

    // Init music controller (after DOM is ready)
    new MusicController();

    // Load config and apply site version to all footers
    (async () => {
        const tryPaths = [
            '/assets/config/config.json',
            'assets/config/config.json',
            '../assets/config/config.json',
            '../../assets/config/config.json'
        ];
        let cfg = null;
        for (const p of tryPaths) {
            try {
                const res = await fetch(p, { cache: 'no-cache' });
                if (!res.ok) continue;
                cfg = await res.json();
                if (cfg && cfg.version) break;
            } catch {}
        }
        if (cfg && cfg.version) {
            document.querySelectorAll('.site-version').forEach(el => {
                el.textContent = `v.${cfg.version}`;
            });
        }
    })();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOMContentLoaded already fired; run immediately
    initApp();
}

window.addEventListener('resize', () => {
});

class SparkleEffects {
    constructor() {
        this.init();
    }

    init() {
        const sparkleElements = document.querySelectorAll('.box-title, .nav-item.active');
        
        sparkleElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.createSparkle(e.target);
            });
        });
    }

    createSparkle(element) {
        const sparkle = document.createElement('div');
        sparkle.style.position = 'absolute';
        sparkle.style.width = '4px';
        sparkle.style.height = '4px';
        sparkle.style.background = 'rgba(255,255,255,0.8)';
        sparkle.style.borderRadius = '50%';
        sparkle.style.pointerEvents = 'none';
        sparkle.style.zIndex = '1000';
        
        const rect = element.getBoundingClientRect();
        sparkle.style.left = `${rect.left + Math.random() * rect.width}px`;
        sparkle.style.top = `${rect.top + Math.random() * rect.height}px`;
        
        document.body.appendChild(sparkle);
        
        sparkle.animate([
            { opacity: 0, transform: 'scale(0)' },
            { opacity: 1, transform: 'scale(1)' },
            { opacity: 0, transform: 'scale(0)' }
        ], {
            duration: 800,
            easing: 'ease-out'
        }).onfinish = () => {
            sparkle.remove();
        };
    }
}

setTimeout(() => {
    new SparkleEffects();
}, 1000);

// Music controller aligned with socials/@LunixVT behavior
class MusicController {
    constructor() {
        this.audio = document.getElementById('bg-music');
        this.button = document.getElementById('music-toggle');
        if (!this.audio || !this.button) return;
        this.loaded = false;
        this.musicOn = false;
        this.init();
    }

    setA11yLabel() {
        const label = this.musicOn ? 'Pause music' : 'Play music';
        this.button.setAttribute('aria-label', label);
        this.button.title = label;
    }

    setOn(on) {
        this.musicOn = on;
        this.button.classList.toggle('active', on);
        this.setA11yLabel();
        if (on) {
            if (!this.loaded) {
                this.audio.load();
                this.loaded = true;
            }
            this.audio.volume = 0.35;
            this.audio.play().catch(() => {
                // Autoplay may be blocked; user can click again
            });
        } else {
            this.audio.pause();
        }
    }

    tryAutoplayWithFallback() {
        this.audio.volume = 0.35;
        this.audio.play().then(() => {
            this.musicOn = true;
            this.button.classList.add('active');
            this.setA11yLabel();
        }).catch(() => {
            const resume = async () => {
                try {
                    await this.audio.play();
                    this.musicOn = true;
                    this.button.classList.add('active');
                    this.setA11yLabel();
                } catch {}
                window.removeEventListener('pointerdown', resume);
                window.removeEventListener('keydown', resume);
            };
            window.addEventListener('pointerdown', resume, { once: true });
            window.addEventListener('keydown', resume, { once: true });
        });
    }

    init() {
        // Initial accessible label
        this.setA11yLabel();

        // Toggle on click
        this.button.addEventListener('click', () => this.setOn(!this.musicOn));

        // Gentle autoplay attempt with user interaction fallback
        this.tryAutoplayWithFallback();
    }
}
