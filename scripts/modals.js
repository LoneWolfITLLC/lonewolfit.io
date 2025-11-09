let LOADING_MODAL = null;
function showLoadingModal() {
  if (!LOADING_MODAL) LOADING_MODAL = loadingModal();
}
function hideLoadingModal() {
  if (LOADING_MODAL) closeModalWithAnimation(LOADING_MODAL);
  LOADING_MODAL = null;
}
function closeModalWithAnimation(modal) {
  if (!modal || modal.classList.contains("modal--closing")) return;
  modal.querySelectorAll(".modal-content").forEach((content) => {
    content.classList.add("modal-content--closing");
  });
  modal.classList.add("modal--closing");
  modal.addEventListener(
    "animationend",
    () => {
      modal.remove();
    },
    { once: true }
  );
}
function loadingModal() {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "loadingModal";
  modal.tabIndex = -1;
  modal.style.animation = "modalBGFadeIn 0.35s ease forwards";
  modal.style.zIndex = "9999";

  const dialog = document.createElement("div");
  dialog.className = "modal-dialog modal-dialog-centered";

  const content = document.createElement("div");
  content.className = "modal-content modal--no-glow modal-content--opening";

  const body = document.createElement("div");
  body.className = "modal-body text-center";

  const img = document.createElement("img");
  img.src = "images/ui/spin.png";
  img.alt = "Loading...";
  img.className = "spinner";

  const p = document.createElement("p");
  p.className = "main__text";
  p.style.color = "#fff";
  p.textContent = "Loading, please wait...";

  body.appendChild(img);
  body.appendChild(p);
  content.appendChild(body);
  dialog.appendChild(content);
  modal.appendChild(dialog);

  document.body.appendChild(modal);

  modal.addEventListener(
    "animationend",
    () => {
      modal.querySelectorAll(".modal-content").forEach((c) => {
        c.classList.remove("modal-content--opening");
      });
    },
    { once: true }
  );

  return modal;
}

function alertModal(message, locked = false) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "alertModal";
  modal.tabIndex = -1;
  modal.style.animation = "modalBGFadeIn 0.35s ease forwards";
  modal.style.zIndex = "9999";

  const dialog = document.createElement("div");
  dialog.className = "modal-dialog";

  const content = document.createElement("div");
  content.className = "modal-content modal-content--opening";

  // header
  const header = document.createElement("div");
  header.className = "modal-header";
  if (!locked) {
    const closeBtn = document.createElement("button");
    closeBtn.className = "modal-close-button";
    closeBtn.tabIndex = 0;
    closeBtn.innerHTML = "&nbsp;";
    header.appendChild(closeBtn);
  }

  // body
  const body = document.createElement("div");
  body.className = "modal-body";
  const p = document.createElement("p");
  p.innerHTML = message;
  body.appendChild(p);

  content.appendChild(header);
  content.appendChild(body);
  dialog.appendChild(content);
  modal.appendChild(dialog);

  // preferences (applied after append)
  if (loggedIn) {
    getPreference("blur").then((v) => {
      if (v === "on") modal.classList.remove("modal--no-blur");
      else modal.classList.add("modal--no-blur");
    });
    const modalGlow = getPreference("modalGlow").then((v) => v === "on");
    modalGlow.then((isGlowing) => {
      if (document.body.classList.contains("dark-mode")) {
        modal.querySelectorAll(".modal-content").forEach((c) => {
          if (isGlowing) c.classList.remove("modal--no-glow");
          else c.classList.add("modal--no-glow");
        });
      }
    });
  }

  document.body.appendChild(modal);

  modal.addEventListener(
    "animationend",
    () => {
      modal.querySelectorAll(".modal-content").forEach((c) => {
        c.classList.remove("modal-content--opening");
      });
    },
    { once: true }
  );

  if (!locked) {
    const closeButton = modal.querySelector(".modal-close-button");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        closeModalWithAnimation(modal);
      });
    }
  }

  modal.addEventListener("click", (event) => {
    if (event.target === modal && !locked) closeModalWithAnimation(modal);
  });

  modal.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === "Escape") && !locked) {
      closeModalWithAnimation(modal);
    }
  });

  modal.focus();
  return modal;
}

function confirmModal(message, onConfirm) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "confirmModal";
  modal.tabIndex = -1;
  modal.style.zIndex = "9999";
  modal.style.animation = "modalBGFadeIn 0.35s ease forwards";

  const dialog = document.createElement("div");
  dialog.className = "modal-dialog";

  const content = document.createElement("div");
  content.className = "modal-content modal-content--opening";

  // header
  const header = document.createElement("div");
  header.className = "modal-header";
  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close-button";
  closeBtn.tabIndex = 0;
  closeBtn.innerHTML = "&nbsp;";
  header.appendChild(closeBtn);

  // body
  const body = document.createElement("div");
  body.className = "modal-body";
  const p = document.createElement("p");
  p.innerHTML = message;
  body.appendChild(p);

  // footer
  const footer = document.createElement("div");
  footer.className = "modal-footer";
  const confirmBtn = document.createElement("button");
  confirmBtn.className = "btn btn-primary";
  confirmBtn.autofocus = true;
  confirmBtn.textContent = "Confirm";
  const cancelBtn = document.createElement("button");
  cancelBtn.className = "btn btn-delete";
  cancelBtn.textContent = "Cancel";
  footer.appendChild(confirmBtn);
  footer.appendChild(cancelBtn);

  content.appendChild(header);
  content.appendChild(body);
  content.appendChild(footer);
  dialog.appendChild(content);
  modal.appendChild(dialog);

  const darkMode = document.body.classList.contains("dark-mode");

  // preferences
  if (loggedIn) {
    getPreference("modalGlow")
      .then((v) => v === "on")
      .then((isGlowing) => {
        if (darkMode) {
          modal.querySelectorAll(".modal-content").forEach((c) => {
            if (isGlowing) c.classList.remove("modal--no-glow");
            else c.classList.add("modal--no-glow");
          });
        }
      });

    getPreference("buttonGlow")
      .then((v) => v === "on")
      .then((isGlowing) => {
        if (darkMode) {
          if (isGlowing) {
            confirmBtn.classList.remove("btn--no-glow");
            cancelBtn.classList.remove("btn--no-glow");
          } else {
            confirmBtn.classList.add("btn--no-glow");
            cancelBtn.classList.add("btn--no-glow");
          }
        }
      });

    getPreference("blur")
      .then((v) => v === "on")
      .then((isBlurred) => {
        if (isBlurred) modal.classList.remove("modal--no-blur");
        else modal.classList.add("modal--no-blur");
      });
  }

  document.body.appendChild(modal);

  modal.addEventListener(
    "animationend",
    () => {
      modal.querySelectorAll(".modal-content").forEach((c) => {
        c.classList.remove("modal-content--opening");
      });
    },
    { once: true }
  );

  // Focus trap
  const focusable = [closeBtn, confirmBtn, cancelBtn];
  let focusIdx = 0;
  modal.focus();
  modal.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      focusIdx =
        (focusIdx + (e.shiftKey ? -1 : 1) + focusable.length) %
        focusable.length;
      focusable[focusIdx].focus();
    } else if (e.key === "Enter") {
      if (document.activeElement === confirmBtn) confirmBtn.click();
      if (document.activeElement === cancelBtn) cancelBtn.click();
      if (document.activeElement === closeBtn) closeBtn.click();
    } else if (e.key === "Escape") {
      closeBtn.click();
      e.preventDefault();
    }
  });

  function cleanup() {
    closeModalWithAnimation(modal);
  }

  function handleClose(result) {
    if (!modal.classList.contains("modal--closing")) {
      cleanup();
      if (typeof onConfirm === "function") onConfirm(result);
    }
  }

  closeBtn.addEventListener("click", () => handleClose(false));
  cancelBtn.addEventListener("click", () => handleClose(false));
  confirmBtn.addEventListener("click", () => handleClose(true));

  modal.addEventListener("click", (event) => {
    if (
      event.target === modal &&
      event.target !== modal.querySelector(".modal-content")
    ) {
      handleClose(false);
    }
  });

  return modal;
}

function promptModal(message, defaultValue = "", onConfirm) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "promptModal";
  modal.tabIndex = -1;
  modal.style.zIndex = "9999";
  modal.style.animation = "modalBGFadeIn 0.35s ease forwards";

  const dialog = document.createElement("div");
  dialog.className = "modal-dialog";

  const content = document.createElement("div");
  content.className = "modal-content modal-content--opening";

  // header
  const header = document.createElement("div");
  header.className = "modal-header";
  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close-button";
  closeBtn.tabIndex = 0;
  closeBtn.innerHTML = "&nbsp;";
  header.appendChild(closeBtn);

  // body + input
  const body = document.createElement("div");
  body.className = "modal-body";
  const p = document.createElement("p");
  p.innerHTML = message;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "modal-prompt-input";
  input.value = defaultValue;
  body.appendChild(p);
  body.appendChild(input);

  // footer
  const footer = document.createElement("div");
  footer.className = "modal-footer";
  const confirmBtn = document.createElement("button");
  confirmBtn.className = "btn btn-primary";
  confirmBtn.autofocus = true;
  confirmBtn.textContent = "OK";
  const cancelBtn = document.createElement("button");
  cancelBtn.className = "btn btn-delete";
  cancelBtn.textContent = "Cancel";
  footer.appendChild(confirmBtn);
  footer.appendChild(cancelBtn);

  content.appendChild(header);
  content.appendChild(body);
  content.appendChild(footer);
  dialog.appendChild(content);
  modal.appendChild(dialog);

  const darkMode = document.body.classList.contains("dark-mode");

  // preferences
  if (loggedIn) {
    getPreference("modalGlow")
      .then((v) => v === "on")
      .then((isGlowing) => {
        if (darkMode) {
          modal.querySelectorAll(".modal-content").forEach((c) => {
            if (isGlowing) c.classList.remove("modal--no-glow");
            else c.classList.add("modal--no-glow");
          });
        }
      });

    getPreference("buttonGlow")
      .then((v) => v === "on")
      .then((isGlowing) => {
        if (darkMode) {
          if (isGlowing) {
            confirmBtn.classList.remove("btn--no-glow");
            cancelBtn.classList.remove("btn--no-glow");
          } else {
            confirmBtn.classList.add("btn--no-glow");
            cancelBtn.classList.add("btn--no-glow");
          }
        }
      });

    getPreference("blur")
      .then((v) => v === "on")
      .then((isBlurred) => {
        if (isBlurred) modal.classList.remove("modal--no-blur");
        else modal.classList.add("modal--no-blur");
      });
  }

  document.body.appendChild(modal);

  modal.addEventListener(
    "animationend",
    () => {
      modal.querySelectorAll(".modal-content").forEach((c) => {
        c.classList.remove("modal-content--opening");
      });
    },
    { once: true }
  );

  // Focus trap
  const focusable = [closeBtn, confirmBtn, cancelBtn, input];
  let focusIdx = 0;
  modal.focus();
  modal.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      focusIdx =
        (focusIdx + (e.shiftKey ? -1 : 1) + focusable.length) %
        focusable.length;
      focusable[focusIdx].focus();
    } else if (e.key === "Enter") {
      if (document.activeElement === confirmBtn) confirmBtn.click();
      if (document.activeElement === cancelBtn) cancelBtn.click();
      if (document.activeElement === closeBtn) closeBtn.click();
      if (document.activeElement === input) confirmBtn.click();
    } else if (e.key === "Escape") {
      // block default escape behavior here
      e.preventDefault();
    }
  });

  function cleanup() {
    closeModalWithAnimation(modal);
  }

  function handleClose(result) {
    if (!modal.classList.contains("modal--closing")) {
      cleanup();
      if (typeof onConfirm === "function") onConfirm(result);
    }
  }

  closeBtn.addEventListener("click", () => handleClose(null));
  cancelBtn.addEventListener("click", () => handleClose(null));
  confirmBtn.addEventListener("click", () => handleClose(input.value));

  modal.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleClose(false);
    }
  });

  modal.addEventListener("click", (event) => {
    if (
      event.target === modal &&
      event.target !== modal.querySelector(".modal-content")
    ) {
      handleClose(false);
    }
  });

  input.focus();
  return modal;
}
