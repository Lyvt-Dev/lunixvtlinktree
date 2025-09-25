(function () {
  const listElement = document.getElementById("contributors-list");
  const backButton = document.getElementById("contributors-back");

  const contributors = Array.isArray(window.APP_CONFIG?.contributors)
    ? window.APP_CONFIG.contributors
    : [];

  const renderContributors = () => {
    if (!listElement) {
      return;
    }

    listElement.innerHTML = "";

    if (!contributors.length) {
      const emptyItem = document.createElement("li");
      emptyItem.className = "empty-state";
      emptyItem.textContent = "Noch keine Einträge – du kannst die Liste in `config.js` ergänzen.";
      listElement.appendChild(emptyItem);
      return;
    }

    contributors.forEach((entry) => {
      const item = document.createElement("li");
      item.className = "contributor-item";

      const avatar = document.createElement("img");
      avatar.src = entry.avatar;
      avatar.alt = `Avatar von ${entry.name}`;
      item.appendChild(avatar);

      const meta = document.createElement("div");
      meta.className = "contributor-meta";

      const name = document.createElement("strong");
      name.textContent = entry.name;
      meta.appendChild(name);

      if (entry.note) {
        const note = document.createElement("span");
        note.textContent = entry.note;
        meta.appendChild(note);
      }

      item.appendChild(meta);
      listElement.appendChild(item);
    });
  };

  if (backButton) {
    backButton.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  renderContributors();
})();
