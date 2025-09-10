// Lightweight JS specifically for the About page
// Keeps the homepage.js for global visuals, but About-only interactions live here.

(function(){
  // Feedback box mock handling
  const form = document.querySelector('#feedback-form');
  const textarea = document.querySelector('#feedback-text');
  const sendBtn = document.querySelector('#feedback-send');
  const clearBtn = document.querySelector('#feedback-clear');

  if (sendBtn && textarea) {
    sendBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const val = (textarea.value || '').trim();
      if (!val) {
        alert('Bitte schreibe zuerst etwas in die Feedback Kiste.');
        return;
      }
      // In a real app, send to your backend here
      textarea.value = '';
      alert('Danke für dein Feedback! <3');
    });
  }

  if (clearBtn && textarea) {
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      textarea.value = '';
    });
  }
})();
