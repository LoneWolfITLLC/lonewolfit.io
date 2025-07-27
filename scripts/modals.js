function alertModal(message) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "alertModal";
  modal.tabIndex = -1;
  modal.style.animation = "fadeIn 0.3s ease";
  modal.style.zIndex = "9999";
  modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <button class="modal-close-button" tabindex="0">&nbsp;</button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(modal);

  const closeButton = modal.querySelector(".modal-close-button");
  closeButton.addEventListener("click", () => {
    modal.remove();
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.remove();
    }
  });

  modal.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === "Escape") {
      modal.remove();
    }
  });
  modal.focus();
  // Native alert returns undefined
  return undefined;
}

function confirmModal(message, onConfirm) {
  //make sure this retuns a boolean
  const existingConfirm = document.getElementById("confirmModal");
  if (existingConfirm) existingConfirm.remove();
  const existingOverlay = document.querySelector(".modal-overlay");
  if (existingOverlay) existingOverlay.remove();

  // Overlay to block background
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.style =
    "position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.4);z-index:9998;";
  document.body.appendChild(overlay);

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "confirmModal";
  modal.tabIndex = -1;
  modal.style.zIndex = "9999";
  modal.style.animation = "fadeIn 0.3s ease";
  modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <button class="modal-close-button" tabindex="0">&nbsp;</button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" autofocus>Confirm</button>
                    <button class="btn btn-delete">Cancel</button>
                </div>
            </div>
        </div>
    `;
  document.body.appendChild(modal);

  const closeButton = modal.querySelector(".modal-close-button");
  const confirmBtn = modal.querySelector(".btn-primary");
  const cancelBtn = modal.querySelector(".btn-delete");

  // Focus trap
  const focusable = [closeButton, confirmBtn, cancelBtn];
  let focusIdx = 0; // default to Confirm
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
      if (document.activeElement === closeButton) closeButton.click();
    } else if (e.key === "Escape") {
      // Do nothing, block closing with Escape
      e.preventDefault();
    }
  });

  function cleanup() {
    modal.remove();
    overlay.remove();
  }

  closeButton.addEventListener("click", () => {
    cleanup();
    if (typeof onConfirm === "function") onConfirm(false);
  });
  cancelBtn.addEventListener("click", () => {
    cleanup();
    if (typeof onConfirm === "function") onConfirm(false);
  });
  confirmBtn.addEventListener("click", () => {
    cleanup();
    if (typeof onConfirm === "function") onConfirm(true);
  });
  // Prevent closing by clicking overlay
  overlay.addEventListener("click", (event) => {
    // Do nothing
  });
  modal.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      cleanup();
      if (typeof onConfirm === "function") onConfirm(false);
    }
  });
}

function promptModal(message, defaultValue = "", onConfirm) {
  //make sure this returns a string or null
  const existingPrompt = document.getElementById("promptModal");
  if (existingPrompt) existingPrompt.remove();
  const existingOverlay = document.querySelector(".modal-overlay");
  if (existingOverlay) existingOverlay.remove();

  // Overlay to block background
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.style =
    "position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.4);z-index:9998;";
  document.body.appendChild(overlay);

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "promptModal";
  modal.tabIndex = -1;
  modal.style.zIndex = "9999";
  modal.style.animation = "fadeIn 0.3s ease";
  modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <button class="modal-close-button" tabindex="0">&nbsp;</button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                    <input type="text" class="modal-prompt-input" value="${defaultValue}">
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" autofocus>OK</button>
                    <button class="btn btn-delete">Cancel</button>
                </div>
            </div>
        </div>
    `;
  document.body.appendChild(modal);

  const closeButton = modal.querySelector(".modal-close-button");
  const confirmBtn = modal.querySelector(".btn-primary");
  const cancelBtn = modal.querySelector(".btn-delete");
  const input = modal.querySelector(".modal-prompt-input");

  // Focus trap
  const focusable = [closeButton, confirmBtn, cancelBtn, input];
  let focusIdx = 0; // default to Close
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
      if (document.activeElement === closeButton) closeButton.click();
      if (document.activeElement === input) confirmBtn.click();
    } else if (e.key === "Escape") {
      // Do nothing, block closing with Escape
      e.preventDefault();
    }
  });

  function cleanup() {
    modal.remove();
    overlay.remove();
  }

  closeButton.addEventListener("click", () => {
    cleanup();
    if (typeof onConfirm === "function") onConfirm(null);
  });
  cancelBtn.addEventListener("click", () => {
    cleanup();
    if (typeof onConfirm === "function") onConfirm(null);
  });
  confirmBtn.addEventListener("click", () => {
    const value = input.value;
    cleanup();
    if (typeof onConfirm === "function") onConfirm(value);
  });
  // Prevent closing by clicking overlay
  overlay.addEventListener("click", (event) => {
    // Do nothing
  });
  modal.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      cleanup();
      if (typeof onConfirm === "function") onConfirm(false);
    }
  });
  input.focus();
}
