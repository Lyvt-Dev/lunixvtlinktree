class StarField {
    constructor() {
        this.stars = [];
        // Scale number of stars by viewport area (keeps it lively on big screens)
        const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        const area = vw * vh;
        this.maxStars = Math.min(320, Math.max(180, Math.round(area / 6000))); // 180–320
        this.layer = document.querySelector('.bg-stars') || document.querySelector('.bg-decoration') || document.body;
        this.spawnRateMs = 120; // spawn ~8-9 stars per second
        this._spawnTimer = null;
        this.init();
    }

    init() {
        // Start continuous spawning
        this._spawnTimer = setInterval(() => this.spawnOnce(), this.spawnRateMs);
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
        this.loadXWidget();
        this.createTweetEmbeds();
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

        for (let i = 0; i < Math.min(this.tweetUrls.length, 3); i++) {
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
                }).catch(error => {
                    console.error('Failed to load Twitter widgets:', error);
                });
            } else {
                console.log('Twitter widgets script not loaded yet, retrying...');
                setTimeout(() => {
                    if (window.twttr && window.twttr.widgets) {
                        window.twttr.widgets.load();
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

    addTweet(tweetUrl) {
        if (!this.tweetUrls.includes(tweetUrl)) {
            this.tweetUrls.unshift(tweetUrl);
            if (this.tweetUrls.length > 3) {
                this.tweetUrls = this.tweetUrls.slice(0, 3);
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

document.addEventListener('DOMContentLoaded', () => {
    new StarField();
    
    new Navigation();
    
    new SocialLinks();
    
    new NewsItems();
    
    new ScrollAnimations();
    
    new XTweetEmbeds();
    
    if (window.TWITCH_CLIENT_ID && window.TWITCH_ACCESS_TOKEN) {
        new TwitchAPI();
    } else {
        console.log('Twitch API credentials not found. Add them to enable live stats.');
    }
    
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.8s ease';
        document.body.style.opacity = '1';
    }, 100);
});

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
