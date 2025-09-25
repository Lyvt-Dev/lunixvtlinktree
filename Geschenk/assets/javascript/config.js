window.APP_CONFIG = {
  twitch: {
    /** Deine Twitch Client-ID aus dem Developer Dashboard */
    clientId: "zgq8ai2dxz5hmiglwnwtz07psyn23w",

    redirectUri: window.location.origin + window.location.pathname,

    /** Benötigte OAuth-Scopes */
    scopes: ["user:read:email"],

    /** Bei jedem Login den Twitch-Dialog erzwingen */
    forceVerify: true,
  },

  comments: {
    /** LocalStorage-Key für Community-Kommentare */
    storageKey: "community-comments",

    /** Maximale Zeichenanzahl pro Kommentar */
    maxLength: 500,
  },

  hero: {
    /** 16:9 Hero-Bild */
    imageSrc: "assets/pictures/white.png",
    imageAlt: "Community-geschenk",
    badge: "Von deiner Community <3",
    title: "Erlebe deine Community im besten Licht",
    subtitle:
      "Von uns für dich, liebe Luni – wir wünschen dir einen wundervollen Geburtstag! 🎉💜 Bleib gesund, hab ganz viel Freude und fühl dich von uns allen fest gedrückt. Wir lieben dich! 💫",
    ctaPrimaryLabel: "Download",
    ctaSecondaryLabel: "Mehr erfahren",
  },

  api: {
    /** URL des Backend-Endpunkts für Kommentare */
    commentsEndpoint: "https://overaffirmative-jeanine-unaligned.ngrok-free.dev/api/comments",
  },

  contributors: [
    {
      name: "Lyvt",
      avatar: "assets/pictures/lyvt.png",
      note: "Projektkoordination & Entwicklung",
    },
    {
      name: "Jaxified",
      avatar: "assets/pictures/jaxified.png",
      note: "Projektkoordination",
    },
    {
      name: "Neko",
      avatar: "assets/pictures/white.png",
      note: "Projektkoordination",
    },
    {
      name: "EpicMaik",
      avatar: "assets/pictures/lyvt.png",
      note: "Artist",
    },
    {
      name: "Zheng",
      avatar: "assets/pictures/white.png",
      note: "Artist",
    },
    {
      name: "Funky",
      avatar: "assets/pictures/white.png",
      note: "Artist",
    },
    {
      name: "Queen_Foxi",
      avatar: "assets/pictures/white.png",
      note: "Artist",
    },
    {
      name: "Whisperliss",
      avatar: "assets/pictures/white.png",
      note: "Artist",
    },
    {
      name: "MoriVT",
      avatar: "assets/pictures/white.png",
      note: "Artist",
    },
    {
      name: "Funky",
      avatar: "assets/pictures/white.png",
      note: "Artist",
    },
    {
      name: "Adora",
      avatar: "assets/pictures/white.png",
      note: "Artist",
    },
    {
      name: "Niijii",
      avatar: "assets/pictures/white.png",
      note: "Artist",
    },
    {
      name: "Nessi-sama",
      avatar: "assets/pictures/white.png",
      note: "Artist",
    },
    {
      name: "PinkPasi",
      avatar: "assets/pictures/white.png",
      note: "Artist",
    },
    {
      name: "LunixVT",
      avatar: "assets/pictures/luni.png",
      note: "Geburtstags Kind :3",
    },
  ],
};
