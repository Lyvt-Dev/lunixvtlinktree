document.addEventListener('DOMContentLoaded', () => {
    const languages = {
        'en': 'English',
        'de': 'Deutsch',
        'fr': 'Français',
        'es': 'Español',
        'ru': 'Русский',
        'ja': '日本語',
        'ko': '한국어'
    };

    const modalHTML = `
        <div class="language-modal-overlay" id="language-modal-overlay">
            <div class="language-modal">
                <button class="close-modal" id="close-language-modal" aria-label="Close language menu">&times;</button>
                <h2>Select Language</h2>
                <div class="language-options" id="language-options">
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const languageOptionsContainer = document.getElementById('language-options');
    for (const [code, name] of Object.entries(languages)) {
        const button = document.createElement('button');
        button.textContent = name;
        button.dataset.lang = code;
        languageOptionsContainer.appendChild(button);
    }

    const modalOverlay = document.getElementById('language-modal-overlay');
    const closeModalButton = document.getElementById('close-language-modal');
    const languageOptions = document.querySelector('.language-options');

    function showModal() {
        modalOverlay.classList.add('show');
    }

    function hideModal() {
        modalOverlay.classList.remove('show');
    }

    function switchLanguage(langCode) {
        const currentPath = window.location.pathname;
        const pathSegments = currentPath.split('/').filter(Boolean);
        let currentPage = 'index.html';

        if (pathSegments.length > 0) {
            const lastSegment = pathSegments[pathSegments.length - 1];
            if (lastSegment.endsWith('.html')) {
                currentPage = pathSegments.pop();
            }
        }

        const currentLang = pathSegments[0] && languages[pathSegments[0]] ? pathSegments[0] : 'en';

        if (langCode === currentLang) {
            hideModal();
            return;
        }

        const newPath = langCode === 'en' ? `/${currentPage}` : `/${langCode}/${currentPage}`;
        window.location.href = newPath;
    }

    document.addEventListener('openLanguageModal', showModal);

    if (closeModalButton) {
        closeModalButton.addEventListener('click', hideModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) {
                hideModal();
            }
        });
    }

    if (languageOptions) {
        languageOptions.addEventListener('click', (event) => {
            if (event.target.tagName === 'BUTTON') {
                const langCode = event.target.dataset.lang;
                if (langCode) {
                    switchLanguage(langCode);
                }
            }
        });
    }
});
