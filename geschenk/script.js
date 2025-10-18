document.addEventListener("DOMContentLoaded", () => {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  window.scrollTo({ top: 0, left: 0, behavior: "instant" in window ? "instant" : "auto" });

  const hideLoader = () => {
    document.querySelectorAll(".page-loader").forEach((loader) => {
      loader.classList.add("is-hidden");
    });
    document.body.classList.remove("is-loading");
  };

  if (document.readyState === "complete") {
    window.setTimeout(hideLoader, 120);
  } else {
    window.addEventListener("load", () => {
      window.setTimeout(hideLoader, 120);
    });
  }

  const scrollHelpers = document.querySelectorAll("[data-scroll-helper]");
  let scrollHelperDismissed = false;

  const updateScrollHelper = () => {
    if (scrollHelperDismissed) {
      scrollHelpers.forEach((helper) => helper.classList.remove("is-visible"));
      return;
    }

    const progress = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
    if (progress >= 0.7) {
      scrollHelperDismissed = true;
      scrollHelpers.forEach((helper) => helper.classList.remove("is-visible"));
      return;
    }

    const atBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 24;
    scrollHelpers.forEach((helper) => {
      helper.classList.toggle("is-visible", !atBottom && !document.body.classList.contains("is-loading"));
    });
  };

  if (scrollHelpers.length) {
    updateScrollHelper();
    window.addEventListener("scroll", updateScrollHelper, { passive: true });
    window.addEventListener("resize", updateScrollHelper);
    scrollHelpers.forEach((helper) => {
      helper.addEventListener("click", () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        scrollHelperDismissed = true;
        helper.classList.remove("is-visible");
      });
    });
  }

  const revealElements = document.querySelectorAll("[data-reveal]");
  if (revealElements.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.22,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    revealElements.forEach((element) => {
      observer.observe(element);
    });
  }

  const bgAudio = document.getElementById("bgAudio");
  const tryPlayBgAudio = () => {
    if (!bgAudio) return Promise.reject();
    bgAudio.volume = 0.6;
    return bgAudio
      .play()
      .then(() => {
        document.removeEventListener("pointerdown", resumeBgAudio, true);
        document.removeEventListener("keydown", resumeBgAudio, true);
      })
      .catch((error) => {
        console.warn("Autoplay block:", error);
        return Promise.reject(error);
      });
  };

  const resumeBgAudio = () => {
    tryPlayBgAudio().catch(() => {});
  };

  tryPlayBgAudio().catch(() => {
    document.addEventListener("pointerdown", resumeBgAudio, true);
    document.addEventListener("keydown", resumeBgAudio, true);
  });

  /* Quiz fragen :3 */
  const quizRoot = document.querySelector(".quiz-playground");
  if (quizRoot) {
    const questions = [
      {
        text: "Wann hat Luni Geburtstag?",
        options: ["04.10", "10.10", "13.10"],
        answer: 1,
        fact: "10. Oktober – jedes Jahr Glow-Alarm in der Community!",
      },
      {
        text: "Was ist Lunis Lieblingsfarbe?",
        options: ["Pink", "Nachtblau", "Lila"],
        answer: 2,
        fact: "Lila ist der Core-Vibe – passt perfect zu den Neon-Galaxy-Feels.",
      },
      {
        text: "Wie viele Frauen hat Luni? 😏",
        options: ["7", "11+", "4"],
        answer: 1,
        fact: "11+ Queens – Lunis eigener Harem.",
      },
      {
        text: "Seit wann ist Luni Twitch-Affiliate?",
        options: ["02.01.2022", "25.06.2020", "11.10.2021"],
        answer: 2,
        fact: "Affiliate seit dem 11. Oktober 2021 :3",
      },
      {
        text: "Wann hat Luni die 1.000 Follower auf Twitch erreicht?",
        options: ["03.04.2025", "12.03.2024", "20.08.2025"],
        answer: 2,
        fact: "Am 20. August 2025 haben wir die 1K Konfetti-Bombe gezündet!",
      },
      {
        text: "Wann wurde Lunis Twitch-Account erstellt?",
        options: ["16.01.2020", "23.01.2019", "18.02.2020"],
        answer: 0,
        fact: "Seit 16. Januar 2020 liegt der Account ready for Stardust.",
      },
      {
        text: "Wann hat Luni die 100 Follower geknackt?",
        options: ["03.11.2023", "07.08.2022", "01.06.2022"],
        answer: 1,
        fact: "7. August 2022 – der erste große Milestone auf dem Weg zur jetzigen Community.",
      },
      {
        text: "Wie viele aktive Subs hatte Luni auf ihrem Höchststand?",
        options: ["202", "167", "249"],
        answer: 0,
        fact: "202 aktive Subs – das war der Peak of Support.",
      },
      {
        text: "Wie viele Zuschauer hatte Luni bei ihrem Peak?",
        options: ["185", "216", "238"],
        answer: 1,
        fact: "216 gleichzeitige Viewer – der Chat war komplett on fire.",
      },
      {
        text: "Wann war Lunis allererster Stream?",
        options: ["19.03.2021", "14.02.2021", "20.03.2021"],
        answer: 1,
        fact: "Erster Stream am 14. Februar 2021.",
      },
    ];

    const quizEngine = quizRoot.querySelector(".quiz-engine");
    const quizQuestionEl = quizEngine?.querySelector(".quiz-question");
    const quizFactEl = quizEngine?.querySelector(".quiz-fact");
    const quizOptionsEl = quizEngine?.querySelector(".quiz-options");
    const quizNextBtn = quizEngine?.querySelector(".quiz-next");
    const quizResetBtn = quizEngine?.querySelector(".quiz-reset");
    const quizProgressStatus = quizEngine?.querySelector(".quiz-progress-status");
    const quizProgressValue = quizEngine?.querySelector(".quiz-progress-value");
    const quizResultModal = document.getElementById("quizResultModal");
    const quizScoreEl = quizResultModal?.querySelector(".quiz-score");
    const quizMessageEl = quizResultModal?.querySelector(".quiz-result-message");
    const quizTotalEl = quizResultModal?.querySelector(".quiz-total");
    const quizCopyBtn = quizResultModal?.querySelector(".quiz-copy");
    const quizResultClose = quizResultModal?.querySelector(".quiz-result-close");
    const heroScrollBtn = document.querySelector(".quiz-scroll");

    let currentQuestion = 0;
    let score = 0;
    let selectedOptionIndex = null;
    const totalQuestions = questions.length;
    if (quizTotalEl) {
      quizTotalEl.textContent = String(totalQuestions);
    }

    const scrollToQuiz = () => {
      const target = document.getElementById("quizPlay");
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    heroScrollBtn?.addEventListener("click", () => {
      scrollToQuiz();
      showToast("Quiz Mode aktiviert ✨");
    });

    const createOptionButton = (text, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quiz-option";
      button.textContent = text;
      button.dataset.index = String(index);
      button.addEventListener("click", () => selectOption(index));
      return button;
    };

    const selectOption = (index) => {
      selectedOptionIndex = index;
      quizNextBtn?.removeAttribute("disabled");
      quizOptionsEl?.querySelectorAll(".quiz-option").forEach((option) => {
        option.classList.toggle("is-selected", option.dataset.index === String(index));
      });
    };

    const updateProgress = () => {
      if (!quizProgressStatus || !quizProgressValue) return;
      quizProgressStatus.textContent = `Frage ${currentQuestion + 1} von ${totalQuestions}`;
      const percent = (currentQuestion / totalQuestions) * 100;
      quizProgressValue.style.width = `${percent}%`;
    };

    const renderQuestion = () => {
      if (!quizQuestionEl || !quizOptionsEl || !quizFactEl) return;

      const question = questions[currentQuestion];
      quizQuestionEl.textContent = question.text;
      quizFactEl.dataset.fact = question.fact;
      quizFactEl.hidden = true;
      quizOptionsEl.innerHTML = "";

      question.options.forEach((option, index) => {
        const button = createOptionButton(option, index);
        quizOptionsEl.appendChild(button);
      });

      quizNextBtn?.setAttribute("disabled", "disabled");
      quizResetBtn?.toggleAttribute("disabled", currentQuestion === 0);
      selectedOptionIndex = null;
      updateProgress();
    };

    const openResultModal = () => {
      if (!quizResultModal) return;
      quizResultModal.hidden = false;
      document.body.classList.add("modal-open");
      quizResultModal.querySelector(".quiz-modal-content")?.focus();
    };

    const closeResultModal = () => {
      if (!quizResultModal) return;
      quizResultModal.hidden = true;
      if (!contributorsModal || contributorsModal.hidden) {
        document.body.classList.remove("modal-open");
      }
    };

    const showResult = () => {
      if (!quizEngine || !quizScoreEl || !quizMessageEl || !quizProgressValue) return;

      quizEngine.hidden = true;
      quizScoreEl.textContent = String(score);
      quizProgressValue.style.width = "100%";

      let message = "";
      if (score === totalQuestions) {
        message = "Perfekt! Du bist absolut Deep Dive Luni Certified.";
      } else if (score >= totalQuestions - 2) {
        message = "So close! Deine Glow-Punkte sind fast am Limit.";
      } else {
        message = "Zeit für ein Rewatch der besten Cozy Moments – Glow nachladen!";
      }

      quizMessageEl.textContent = message;
      showToast("Quiz abgeschlossen ✨");
      openResultModal();
    };

    const revealAnswer = () => {
      if (!quizOptionsEl || selectedOptionIndex === null || !quizFactEl) return;
      const question = questions[currentQuestion];
      quizOptionsEl.querySelectorAll(".quiz-option").forEach((option) => {
        const optionIndex = Number(option.dataset.index);
        option.disabled = true;
        option.classList.toggle("is-selected", optionIndex === selectedOptionIndex);
        option.classList.toggle("is-correct", optionIndex === question.answer);
        option.classList.toggle("is-wrong", optionIndex === selectedOptionIndex && optionIndex !== question.answer);
      });
      quizFactEl.hidden = false;
      quizFactEl.textContent = question.fact;
      if (selectedOptionIndex === question.answer) {
        score += 1;
      }
    };

    const handleNext = () => {
      if (selectedOptionIndex === null) return;
      revealAnswer();

      window.setTimeout(() => {
        currentQuestion += 1;
        if (currentQuestion < totalQuestions) {
          renderQuestion();
        } else {
          showResult();
        }
      }, 1100);
    };

    const resetQuiz = () => {
      currentQuestion = 0;
      score = 0;
      selectedOptionIndex = null;
      quizEngine.hidden = false;
      closeResultModal();
      renderQuestion();
      quizProgressValue && (quizProgressValue.style.width = "0%");
      showToast("Quiz zurückgesetzt 🔄");
    };

    const copyResults = async () => {
      if (!quizScoreEl || !quizMessageEl) return;
      const payload = `Luni Quiz Score: ${quizScoreEl.textContent}/7 – ${quizMessageEl.textContent}`;
      try {
        await navigator.clipboard.writeText(payload);
        showToast("Ergebnis kopiert 💌");
      } catch (error) {
        console.error(error);
        showToast("Konnte nicht kopieren – mach einen Screenshot ✨");
      }
    };

    quizNextBtn?.addEventListener("click", handleNext);
    quizResetBtn?.addEventListener("click", resetQuiz);
    quizCopyBtn?.addEventListener("click", copyResults);
    quizResultClose?.addEventListener("click", closeResultModal);
    quizResultModal?.addEventListener("click", (event) => {
      if (event.target === quizResultModal) {
        closeResultModal();
      }
    });

    renderQuestion();
  }

  const contributorsModal = document.getElementById("contributorsModal");
  const openContributorsBtn = document.getElementById("openContributors");
  const closeContributorsBtn = document.getElementById("closeContributors");

  const openContributors = () => {
    if (!contributorsModal) return;
    contributorsModal.hidden = false;
    document.body.classList.add("modal-open");
    contributorsModal.querySelector(".modal-content")?.focus();
  };

  const closeContributors = () => {
    if (!contributorsModal) return;
    contributorsModal.hidden = true;
    if (!modal || modal.hidden) {
      document.body.classList.remove("modal-open");
    }
    openContributorsBtn?.focus();
  };

  openContributorsBtn?.addEventListener("click", openContributors);
  closeContributorsBtn?.addEventListener("click", closeContributors);

  contributorsModal?.addEventListener("click", (event) => {
    if (event.target === contributorsModal) {
      closeContributors();
    }
  });

  const fsHintModal = document.getElementById("fsHintModal");
  const acknowledgeFsHintBtn = document.getElementById("acknowledgeFsHint");
  const closeFsHintBtn = document.getElementById("closeFsHint");

  const FS_HINT_STORAGE_KEY = "fsHintDismissed";

  const openFsHint = () => {
    if (!fsHintModal) return;
    fsHintModal.hidden = false;
    document.body.classList.add("modal-open");
    fsHintModal.querySelector(".modal-content")?.focus();
  };

  const closeFsHint = () => {
    if (!fsHintModal) return;
    fsHintModal.hidden = true;
    if ((typeof modal === "undefined" || !modal || modal.hidden) &&
        (typeof imageModal === "undefined" || !imageModal || imageModal.hidden) &&
        (typeof contributorsModal === "undefined" || !contributorsModal || contributorsModal.hidden)) {
      document.body.classList.remove("modal-open");
    }
  };

  acknowledgeFsHintBtn?.addEventListener("click", () => {
    try {
      localStorage.setItem(FS_HINT_STORAGE_KEY, "1");
    } catch {}
    closeFsHint();
  });

  closeFsHintBtn?.addEventListener("click", closeFsHint);

  fsHintModal?.addEventListener("click", (event) => {
    if (event.target === fsHintModal) {
      closeFsHint();
    }
  });

  const typewriterEl = document.querySelector(".typewriter");
  if (typewriterEl) {
    const fullText = typewriterEl.dataset.text || "";
    let index = 0;

    const tick = () => {
      if (index <= fullText.length) {
        typewriterEl.textContent = fullText.slice(0, index++);
        const delay = 54 + Math.random() * 36;
        window.setTimeout(tick, delay);
      } else {
        typewriterEl.classList.add("completed");
      }
    };

    tick();
  }

  const modal = document.getElementById("downloadModal");
  const openModalBtn = document.getElementById("openModal");
  const closeModalBtn = document.getElementById("closeModal");
  const downloadCloseLinks = modal?.querySelectorAll('[data-close="true"]');
  const downloadResizeButtons = modal?.querySelectorAll('[data-resize="true"]');
  const imageModal = document.getElementById("imagePreviewModal");
  const openPreviewBtn = document.getElementById("openPreview");
  const closePreviewBtn = document.getElementById("closePreview");
  const previewImage = document.getElementById("previewImage");

  const openModal = () => {
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    modal.querySelector(".modal-content")?.focus();
  };

  const closeModal = () => {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    openModalBtn?.focus();
  };

  const openPreview = (src) => {
    if (!imageModal || !previewImage) return;
    if (src) {
      previewImage.src = src;
    }
    imageModal.hidden = false;
    document.body.classList.add("modal-open");
    imageModal.querySelector(".modal-content")?.focus();
  };

  const closePreview = () => {
    if (!imageModal) return;
    imageModal.hidden = true;
    if (!modal || modal.hidden) {
      document.body.classList.remove("modal-open");
    }
    openPreviewBtn?.focus();
  };

  openModalBtn?.addEventListener("click", openModal);
  closeModalBtn?.addEventListener("click", closeModal);

  modal?.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  openPreviewBtn?.addEventListener("click", () => {
    const targetSrc = openPreviewBtn.dataset.preview || openPreviewBtn.querySelector("img")?.src;
    openPreview(targetSrc);
  });

  closePreviewBtn?.addEventListener("click", closePreview);

  imageModal?.addEventListener("click", (event) => {
    if (event.target === imageModal) {
      closePreview();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal?.hidden) {
      closeModal();
    }
    if (event.key === "Escape" && !imageModal?.hidden) {
      closePreview();
    }
    if (event.key === "Escape" && !fsHintModal?.hidden) {
      closeFsHint();
    }
  });

  downloadCloseLinks?.forEach((link) => {
    link.addEventListener("click", () => {
      closeModal();
    });
  });

  downloadResizeButtons?.forEach((button) => {
    button.addEventListener("click", async () => {
      const sourceUrl = button.dataset.source;
      const width = Number(button.dataset.width || "1280");
      const file = button.dataset.file || "download.png";
      if (!sourceUrl) return;

      await handleResizedDownload({ sourceUrl, targetWidth: width, fileName: file });
      closeModal();
    });
  });

  const handleResizedDownload = async ({ sourceUrl, targetWidth, fileName }) => {
    if (!sourceUrl || !targetWidth || !fileName) return;

    try {
      const image = await loadImage(sourceUrl);
      const scale = targetWidth / image.width;
      const targetHeight = Math.round(image.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Canvas context fehlt");

      ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error("Konvertierung fehlgeschlagen");
        }
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.setTimeout(() => URL.revokeObjectURL(link.href), 2000);
      }, "image/png");
    } catch (error) {
      console.error(error);
      showToast("Download ging schief – versuch es nochmal ✨");
    }
  };

  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = `${src}?t=${Date.now()}`;
    });

  const ambientToggle = document.getElementById("ambientToggle");
  let audioContext = null;
  let ambientNodes = [];
  let ambientRunning = false;

  ambientToggle?.addEventListener("click", async () => {
    if (!ambientRunning) {
      await startAmbient();
      ambientToggle.textContent = "Ambient stoppen";
    } else {
      stopAmbient();
      ambientToggle.textContent = "Ambient Sounds";
    }
  });

  const startAmbient = async () => {
    if (ambientRunning) return;

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioContext = ctx;

    const createPad = (frequency, gainValue, lfoFreq) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = frequency;

      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + 2);

      const lfo = ctx.createOscillator();
      lfo.frequency.value = lfoFreq;

      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 28;

      lfo.connect(lfoGain).connect(osc.frequency);

      osc.connect(gain).connect(ctx.destination);

      osc.start();
      lfo.start();

      return { osc, gain, lfo };
    };

    ambientNodes = [
      createPad(432, 0.15, 0.08),
      createPad(512, 0.12, 0.11),
    ];

    ambientRunning = true;
    showToast("Ambient Mood aktiviert 🌙");
  };

  const stopAmbient = () => {
    if (!ambientRunning || !audioContext) return;

    ambientNodes.forEach(({ osc, gain, lfo }) => {
      try {
        gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1.2);
        window.setTimeout(() => {
          osc.stop();
          lfo.stop();
        }, 1400);
      } catch (error) {
        console.error(error);
      }
    });

    window.setTimeout(() => {
      audioContext?.close();
      audioContext = null;
      ambientNodes = [];
      ambientRunning = false;
    }, 1600);

    showToast("Ambient Mood pausiert 💫");
  };

  const confettiTrigger = document.getElementById("confettiTrigger");
  confettiTrigger?.addEventListener("click", () => {
    launchConfetti();
    showToast("Birthday Sparkles!");
  });

  const launchConfetti = () => {
    const colors = ["#a974ff", "#6ae3ff", "#ff7adf", "#ffe066", "#9af9da"];
    const pieces = 28;

    for (let i = 0; i < pieces; i += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.setProperty("--confetti-left", `${Math.random() * 100}%`);
      piece.style.setProperty("--confetti-rotation", `${Math.random() * 180 - 90}deg`);
      piece.style.backgroundColor = colors[i % colors.length];
      const size = Math.random() * 8 + 6;
      piece.style.width = `${size}px`;
      piece.style.height = `${size * 0.4}px`;
      piece.style.animationDuration = `${Math.random() * 1.5 + 1.8}s`;
      document.body.appendChild(piece);

      window.setTimeout(() => {
        piece.remove();
      }, 3200);
    }
  };

  const showToast = (message) => {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("visible");
    window.setTimeout(() => {
      toast?.classList.remove("visible");
    }, 2600);
  };

  window.setTimeout(() => {
    launchConfetti();
    showToast("Birthday Sparkles!");
  }, 900);

  window.setTimeout(() => {
    const alreadyDismissed = (() => {
      try {
        return localStorage.getItem(FS_HINT_STORAGE_KEY) === "1";
      } catch {
        return false;
      }
    })();

    const isFullscreen = !!document.fullscreenElement || window.innerHeight === screen.height;
    if (!alreadyDismissed && !isFullscreen) {
      openFsHint();
    }
  }, 1100);
});
