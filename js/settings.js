document.addEventListener('DOMContentLoaded', () => {
    const backgroundMusic = document.getElementById('background-music');

    const settingsModalHTML = `
        <div class="settings-modal-overlay" id="settings-modal-overlay">
            <div class="settings-modal">
                <button class="close-modal" id="close-settings-modal" aria-label="Close settings menu">&times;</button>
                <h2>Settings</h2>
                <div class="settings-options">
                    <div class="setting-option">
                        <label for="music-toggle">Background Music</label>
                        <label class="switch">
                            <input type="checkbox" id="music-toggle">
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="setting-option">
                        <label for="dark-mode-toggle">Dark Mode</label>
                        <label class="switch">
                            <input type="checkbox" id="dark-mode-toggle">
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="setting-option">
                        <label>Language</label>
                        <button id="change-language-btn">Change</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', settingsModalHTML);

    const settingsButton = document.getElementById('settings-button');
    const settingsModalOverlay = document.getElementById('settings-modal-overlay');
    const closeSettingsModalButton = document.getElementById('close-settings-modal');
    const musicToggle = document.getElementById('music-toggle');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const changeLanguageBtn = document.getElementById('change-language-btn');

    // Set initial theme based on localStorage
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    darkModeToggle.checked = currentTheme === 'dark';

    // Handle theme toggle
    darkModeToggle.addEventListener('change', () => {
        const newTheme = darkModeToggle.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // Restore music state from localStorage - ON by default
    if (backgroundMusic) {
        const isMusicEnabled = localStorage.getItem('musicEnabled') !== 'false';
        musicToggle.checked = isMusicEnabled;
        if (isMusicEnabled) {
            backgroundMusic.play().catch(e => console.error("Audio play failed: " + e));
        }

        musicToggle.addEventListener('change', () => {
            if (musicToggle.checked) {
                backgroundMusic.play().catch(e => console.error("Audio play failed: " + e));
                localStorage.setItem('musicEnabled', 'true');
            } else {
                backgroundMusic.pause();
                localStorage.setItem('musicEnabled', 'false');
            }
        });
    }

    function showSettingsModal() {
        settingsModalOverlay.classList.add('show');
    }

    function hideSettingsModal() {
        settingsModalOverlay.classList.remove('show');
    }

    settingsButton.addEventListener('click', showSettingsModal);
    closeSettingsModalButton.addEventListener('click', hideSettingsModal);
    settingsModalOverlay.addEventListener('click', (event) => {
        if (event.target === settingsModalOverlay) {
            hideSettingsModal();
        }
    });

    changeLanguageBtn.addEventListener('click', () => {
        hideSettingsModal();
        // This will be handled by language-modal.js, which will be modified to listen for a custom event
        document.dispatchEvent(new CustomEvent('openLanguageModal'));
    });
});
