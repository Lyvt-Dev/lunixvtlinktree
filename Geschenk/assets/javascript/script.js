(function () {
  /**
   * Twitch OAuth Integration
   * --------------------------------------------------
   * 1. Register your application at https://dev.twitch.tv/
   * 2. Add the page URL (z.B. https://deine-domain.de/index.html) als Redirect URI.
   * 3. Trage deine Client-ID in `index.html` im `<meta name="twitch-client-id">` Tag ein.
   * 4. Optional: Passe die `TWITCH_SCOPES` an, wenn du weitere Berechtigungen brauchst.
   */
  const DEFAULT_CONFIG = {
    twitch: {
      clientId: "YOUR_TWITCH_CLIENT_ID",
      redirectUri: window.location.origin + window.location.pathname,
      scopes: ["user:read:email"],
      forceVerify: true,
    },
    comments: {
      storageKey: "community-comments",
      maxLength: 500,
    },
    hero: {
      imageSrc: "assets/pictures/white.png",
      imageAlt: "Stilvolle 16:9 Illustration",
      badge: "Live Community Hub",
      title: "Erlebe deine Community im besten Licht",
      subtitle:
        "Begrüße deine Zuschauer:innen mit einer atmosphärischen Visualisierung im perfekten 16:9-Format und lade sie ein, sich über ihre Twitch-Identität an der Diskussion zu beteiligen.",
      ctaPrimaryLabel: "Jetzt eintauchen",
      ctaSecondaryLabel: "Mehr erfahren",
    },
    api: {
      commentsEndpoint: "http://localhost:3000/api/comments",
    },
  };

  const mergeConfig = (defaults, overrides = {}) => ({
    twitch: { ...defaults.twitch, ...(overrides.twitch || {}) },
    comments: { ...defaults.comments, ...(overrides.comments || {}) },
    hero: { ...defaults.hero, ...(overrides.hero || {}) },
    api: { ...defaults.api, ...(overrides.api || {}) },
  });

  const config = mergeConfig(DEFAULT_CONFIG, window.APP_CONFIG);
  const twitchConfig = config.twitch;
  const commentsConfig = config.comments;
  const heroConfig = config.hero;
  const apiConfig = config.api;

  const loginButton = document.getElementById("twitch-login");
  const commentForm = document.getElementById("comment-form");
  const commentText = document.getElementById("comment-text");
  const commentList = document.getElementById("comment-list");
  const emptyState = document.getElementById("comment-empty-state");
  const authStatus = document.getElementById("auth-status");
  const authAvatar = document.getElementById("auth-avatar");
  const authName = document.getElementById("auth-name");
  const authInfo = document.getElementById("auth-info");
  const logoutButton = document.getElementById("logout-button");
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");
  const modalConfirm = document.getElementById("modal-confirm");
  const modalClose = document.getElementById("modal-close");

  const heroImage = document.getElementById("hero-image");
  const heroBadge = document.getElementById("hero-badge");
  const heroTitle = document.getElementById("hero-title");
  const heroSubtitle = document.getElementById("hero-subtitle");
  const heroCtaPrimary = document.getElementById("hero-cta-primary");
  const heroCtaSecondary = document.getElementById("hero-cta-secondary");

  const TWITCH_SCOPES = twitchConfig.scopes;
  const TOKEN_STORAGE_KEY = "twitch-access-token";
  const TOKEN_EXPIRY_STORAGE_KEY = "twitch-token-expiry";
  const USER_STORAGE_KEY = "twitch-user";

  let accessToken = null;
  let tokenExpiry = null;
  let currentUser = null;
  let comments = [];

  const getClientId = () =>
    twitchConfig.clientId === "YOUR_TWITCH_CLIENT_ID"
      ? document.querySelector('meta[name="twitch-client-id"]')?.content?.trim() ?? ""
      : twitchConfig.clientId;

  const TWITCH_CLIENT_ID = getClientId();

  const redirectUri = twitchConfig.redirectUri;

  const buildAuthorizeUrl = () => {
    const params = new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "token",
      scope: TWITCH_SCOPES.join(" "),
      force_verify: String(twitchConfig.forceVerify),
    });
    return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
  };

  const parseAccessTokenFromHash = () => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return null;
    const params = new URLSearchParams(hash);
    const token = params.get("access_token");
    const expires = params.get("expires_in");
    if (token) {
      window.history.replaceState({}, document.title, window.location.pathname);
      return { token, expiresIn: Number(expires ?? 0) };
    }
    return null;
  };

  const persistToken = (token, expiresInSeconds) => {
    accessToken = token;
    tokenExpiry = Date.now() + expiresInSeconds * 1000;
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_STORAGE_KEY, tokenExpiry.toString());
  };

  const readPersistedToken = () => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedExpiry = Number(localStorage.getItem(TOKEN_EXPIRY_STORAGE_KEY));
    if (!storedToken || !storedExpiry) return null;
    if (Date.now() >= storedExpiry) {
      clearPersistedToken();
      return null;
    }
    accessToken = storedToken;
    tokenExpiry = storedExpiry;
    return storedToken;
  };

  const clearPersistedToken = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_STORAGE_KEY);
  };

  const persistUser = (user) => {
    currentUser = user;
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  };

  const readPersistedUser = () => {
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      if (!raw) return null;
      const user = JSON.parse(raw);
      currentUser = user;
      return user;
    } catch (error) {
      console.warn("Persisted user konnte nicht gelesen werden", error);
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }
  };

  const clearPersistedUser = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    currentUser = null;
  };

  const loadComments = async () => {
    if (!apiConfig.commentsEndpoint) {
      console.warn("Kein Backend-Endpunkt für Kommentare konfiguriert.");
      comments = [];
      renderComments();
      return;
    }

    try {
      const response = await fetch(apiConfig.commentsEndpoint);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      comments = Array.isArray(data)
        ? data.map((entry) => ({
            ...entry,
            timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
          }))
        : [];
    } catch (error) {
      console.error("Kommentare konnten nicht vom Server geladen werden", error);
      showModal({
        title: "Kommentare nicht verfügbar",
        message: "Wir konnten die Kommentare gerade nicht laden. Bitte versuche es später erneut.",
      });
      comments = [];
    }

    renderComments();
  };

  const persistCommentToServer = async (payload) => {
    if (!apiConfig.commentsEndpoint) {
      throw new Error("Kein Backend-Endpunkt konfiguriert");
    }

    const response = await fetch(apiConfig.commentsEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  };

  const enableAuthenticatedUI = (user) => {
    commentForm.hidden = false;
    authStatus.hidden = false;
    loginButton.hidden = true;
    logoutButton.hidden = false;

    authAvatar.src = user.profile_image_url;
    authAvatar.alt = `Profilbild von ${user.display_name}`;
    authName.textContent = user.display_name;
    authInfo.textContent = `@${user.login}`;
  };

  const disableAuthenticatedUI = () => {
    commentForm.hidden = true;
    authStatus.hidden = true;
    loginButton.hidden = false;
    logoutButton.hidden = true;
    authAvatar.removeAttribute("src");
    authAvatar.alt = "Twitch Profilbild";
    authName.textContent = "";
    authInfo.textContent = "";
    commentText.value = "";
  };

  const renderComments = () => {
    commentList.innerHTML = "";
    if (!comments.length) {
      commentList.appendChild(emptyState);
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;
    comments.forEach((entry) => {
      const item = document.createElement("li");
      item.className = "comment-item";

      const meta = document.createElement("div");
      meta.className = "comment-meta";

      const avatar = document.createElement("img");
      avatar.src = entry.avatar;
      avatar.alt = `Profilbild von ${entry.displayName}`;
      meta.appendChild(avatar);

      const name = document.createElement("strong");
      name.textContent = entry.displayName;
      meta.appendChild(name);

      const time = document.createElement("span");
      time.textContent = new Intl.DateTimeFormat("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp));
      meta.appendChild(time);

      const text = document.createElement("p");
      text.className = "comment-text";
      text.textContent = entry.text;

      item.appendChild(meta);
      item.appendChild(text);
      commentList.appendChild(item);
    });
  };

  const fetchTwitchProfile = async (token) => {
    const response = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Client-Id": TWITCH_CLIENT_ID,
      },
    });

    if (!response.ok) {
      throw new Error(`Twitch-API Fehler: ${response.status}`);
    }

    const { data } = await response.json();
    return data?.[0] ?? null;
  };

  const handleAuthentication = async () => {
    try {
      const hashToken = parseAccessTokenFromHash();
      if (hashToken) {
        persistToken(hashToken.token, hashToken.expiresIn || 3600);
      } else {
        readPersistedToken();
      }

      if (!accessToken) return;

      const user = await fetchTwitchProfile(accessToken);
      if (!user) {
        throw new Error("Kein Benutzerprofil gefunden");
      }

      persistUser(user);
      enableAuthenticatedUI(user);
    } catch (error) {
      console.error("Twitch Auth Fehler", error);
      alert(
        "Wir konnten deine Twitch-Anmeldung nicht bestätigen. Bitte versuche es erneut oder prüfe deine Client-ID."
      );
      logout();
    }
  };

  const logout = () => {
    accessToken = null;
    tokenExpiry = null;
    clearPersistedToken();
    clearPersistedUser();
    disableAuthenticatedUI();
  };

  const ensureClientIdPresent = () => {
    if (!TWITCH_CLIENT_ID || TWITCH_CLIENT_ID === "YOUR_TWITCH_CLIENT_ID") {
      showModal({
        title: "Twitch-Konfiguration fehlt",
        message:
          "Bitte ergänze deine Twitch Client-ID in der Konfiguration (`config.js`) oder im `<meta name=\"twitch-client-id\">` Tag, um die Anmeldung zu aktivieren.",
        confirmLabel: "Verstanden",
      });
      return false;
    }
    return true;
  };

  const showModal = ({ title, message, confirmLabel = "Okay", onConfirm }) => {
    if (!modal || !modalTitle || !modalBody || !modalConfirm || !modalClose) {
      alert(message);
      if (onConfirm) onConfirm();
      return;
    }

    modalTitle.textContent = title;
    modalBody.textContent = message;
    modalConfirm.textContent = confirmLabel;

    modal.dataset.open = "true";
    modal.setAttribute("aria-hidden", "false");
    modalConfirm.focus();

    const closeModal = () => {
      modal.dataset.open = "false";
      modal.setAttribute("aria-hidden", "true");
      modalConfirm.removeEventListener("click", confirmHandler);
      modalClose.removeEventListener("click", closeModal);
      modal.removeEventListener("click", backdropHandler);
    };

    const confirmHandler = () => {
      closeModal();
      if (onConfirm) onConfirm();
    };

    const backdropHandler = (event) => {
      if (event.target === modal) {
        closeModal();
      }
    };

    modalConfirm.addEventListener("click", confirmHandler);
    modalClose.addEventListener("click", closeModal);
    modal.addEventListener("click", backdropHandler);
  };

  loginButton.addEventListener("click", () => {
    if (!ensureClientIdPresent()) {
      return;
    }

    window.location.href = buildAuthorizeUrl();
  });

  logoutButton.addEventListener("click", () => {
    logout();
  });

  commentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!currentUser) {
      showModal({
        title: "Anmeldung erforderlich",
        message: "Bitte melde dich mit Twitch an, bevor du einen Kommentar schreibst.",
        confirmLabel: "Zur Anmeldung",
        onConfirm: () => loginButton.click(),
      });
      return;
    }

    const text = commentText.value.trim();
    if (!text) {
      commentText.focus();
      return;
    }

    const payload = {
      text,
      displayName: currentUser.display_name,
      avatar: currentUser.profile_image_url,
      timestamp: new Date().toISOString(),
    };

    commentText.disabled = true;
    commentForm.querySelector('button[type="submit"]').disabled = true;

    persistCommentToServer(payload)
      .then((savedComment) => {
        comments.unshift({
          ...savedComment,
          timestamp: savedComment.timestamp ? new Date(savedComment.timestamp) : new Date(),
        });
        renderComments();
      })
      .catch((error) => {
        console.error("Kommentar konnte nicht gespeichert werden", error);
        showModal({
          title: "Kommentar fehlgeschlagen",
          message:
            "Dein Kommentar konnte leider nicht gespeichert werden. Bitte versuche es später erneut.",
        });
      })
      .finally(() => {
        commentText.disabled = false;
        commentForm.querySelector('button[type="submit"]').disabled = false;
        commentText.value = "";
        commentText.focus();
      });
  });

  loadComments();

  if (commentText && typeof commentsConfig.maxLength === "number") {
    commentText.maxLength = commentsConfig.maxLength;
  }

  const hydrateHero = () => {
    if (heroImage) {
      heroImage.src = heroConfig.imageSrc;
      heroImage.alt = heroConfig.imageAlt;
    }
    if (heroBadge) {
      heroBadge.textContent = heroConfig.badge;
    }
    if (heroTitle) {
      heroTitle.textContent = heroConfig.title;
    }
    if (heroSubtitle) {
      heroSubtitle.textContent = heroConfig.subtitle;
    }
    if (heroCtaPrimary) {
      heroCtaPrimary.textContent = heroConfig.ctaPrimaryLabel;
      heroCtaPrimary.dataset.downloadUrl = heroConfig.ctaPrimaryDownloadUrl;
      heroCtaPrimary.dataset.downloadFileName = heroConfig.ctaPrimaryDownloadFileName;
    }
    if (heroCtaSecondary) {
      heroCtaSecondary.textContent = heroConfig.ctaSecondaryLabel;
      heroCtaSecondary.dataset.href = heroConfig.ctaSecondaryHref;
    }
  };

  hydrateHero();

  if (heroCtaPrimary) {
    heroCtaPrimary.addEventListener("click", () => {
      const url = heroCtaPrimary.dataset.downloadUrl;
      if (!url) return;
      const link = document.createElement("a");
      link.href = url;
      link.download = heroCtaPrimary.dataset.downloadFileName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  if (heroCtaSecondary) {
    heroCtaSecondary.addEventListener("click", () => {
      const href = heroCtaSecondary.dataset.href;
      if (href) {
        window.location.href = href;
      }
    });
  }

  if (ensureClientIdPresent()) {
    const storedUser = readPersistedUser();
    if (storedUser) {
      enableAuthenticatedUI(storedUser);
    }
    handleAuthentication();
  }
})();
