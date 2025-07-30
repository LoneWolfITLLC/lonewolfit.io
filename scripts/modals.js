function closeModalWithAnimation(modal) {
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
	modal.style.animation = "fadeIn 0.3s ease";
	modal.style.zIndex = "9999";
	modal.innerHTML = `
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content modal--no-glow">
				<div class="modal-body text-center">
					<img src="images/ui/spin.png" alt="Loading..." class="spinner" />
						<p class="main__text" style="color: #fff">
							Loading, please wait...
						</p>
					</div>
				</div>
			</div>
		</div>
	`;
	document.body.appendChild(modal);
}
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

	if (loggedIn) {
		const modalBlur = getPreference("blur").then((value) => value === "on");
		modalBlur.then((isBlurred) => {
			if (isBlurred) {
				modal.classList.remove("modal--no-blur");
			} else {
				modal.classList.add("modal--no-blur");
			}
		});
		const modalGlow = getPreference("modalGlow").then(
			(value) => value === "on"
		);
		modalGlow.then((isGlowing) => {
			if (document.body.classList.contains("dark-mode")) {
				if (isGlowing) {
					modal.querySelectorAll(".modal-content").forEach((content) => {
						content.classList.remove("modal--no-glow");
					});
				} else {
					modal.querySelectorAll(".modal-content").forEach((content) => {
						content.classList.add("modal--no-glow");
					});
				}
			}
		});
	}

	document.body.appendChild(modal);

	const closeButton = modal.querySelector(".modal-close-button");
	closeButton.addEventListener("click", () => {
		closeModalWithAnimation(modal);
	});

	modal.addEventListener("click", (event) => {
		if (event.target === modal) {
			closeModalWithAnimation(modal);
		}
	});

	modal.addEventListener("keydown", (e) => {
		if (e.key === "Enter" || e.key === "Escape") {
			closeModalWithAnimation(modal);
		}
	});
	modal.focus();
	// Native alert returns undefined
	return undefined;
}

function confirmModal(message, onConfirm) {
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
	const darkMode = document.body.classList.contains("dark-mode");

	if (loggedIn) {
		const modalGlow = getPreference("modalGlow").then(
			(value) => value === "on"
		);
		modalGlow.then((isGlowing) => {
			if (darkMode) {
				if (isGlowing) {
					modal.querySelectorAll(".modal-content").forEach((content) => {
						content.classList.remove("modal--no-glow");
					});
				} else {
					modal.querySelectorAll(".modal-content").forEach((content) => {
						content.classList.add("modal--no-glow");
					});
				}
			}
		});

		const buttonGlow = getPreference("buttonGlow").then(
			(value) => value === "on"
		);

		buttonGlow.then((isGlowing) => {
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

		const modalBlur = getPreference("blur").then((value) => value === "on");
		modalBlur.then((isBlurred) => {
			if (isBlurred) {
				modal.classList.remove("modal--no-blur");
			} else {
				modal.classList.add("modal--no-blur");
			}
		});
	}

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
			closeButton.click();
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
	closeButton.addEventListener("click", () => handleClose(false));
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
}

function promptModal(message, defaultValue = "", onConfirm) {
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
	const darkMode = document.body.classList.contains("dark-mode");

	if (loggedIn) {
		const modalGlow = getPreference("modalGlow").then(
			(value) => value === "on"
		);
		modalGlow.then((isGlowing) => {
			if (darkMode) {
				if (isGlowing) {
					modal.querySelectorAll(".modal-content").forEach((content) => {
						content.classList.remove("modal--no-glow");
					});
				} else {
					modal.querySelectorAll(".modal-content").forEach((content) => {
						content.classList.add("modal--no-glow");
					});
				}
			}
		});

		const buttonGlow = getPreference("buttonGlow").then(
			(value) => value === "on"
		);

		buttonGlow.then((isGlowing) => {
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

		const modalBlur = getPreference("blur").then((value) => value === "on");
		modalBlur.then((isBlurred) => {
			if (isBlurred) {
				modal.classList.remove("modal--no-blur");
			} else {
				modal.classList.add("modal--no-blur");
			}
		});
	}
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
		closeModalWithAnimation(modal);
	}

	function handleClose(result) {
		if (!modal.classList.contains("modal--closing")) {
			cleanup();
			if (typeof onConfirm === "function") onConfirm(result);
		}
	}
	closeButton.addEventListener("click", () => handleClose(null));
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
}
