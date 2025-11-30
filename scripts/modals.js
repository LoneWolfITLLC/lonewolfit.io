let LOADING_MODAL = null;
/**
 * Displays a global loading modal.
 * @param {*STRING Text to display under the loading spinner} text
 */
function showLoadingModal(text = "Loading, please wait...") {
	if (!LOADING_MODAL) LOADING_MODAL = loadingModal(text);
}
/**
 * Hides and removes the global loading modal.
 */
function hideLoadingModal() {
	if (LOADING_MODAL) closeModalWithAnimation(LOADING_MODAL);
	LOADING_MODAL = null;
}
/**
 * Opens an image preview modal.
 * @param {*MODAL_ELEMENT The preview modal element} modalParam 
 * @param {*STRING The source URL of the image} paramImgSrc 
 * @param {*STRING The alt text for the image} paramAltTxt 
 * @returns the completed preview modal element
 */
function openImageModal(modalParam, paramImgSrc = "#", paramAltTxt = "") {
	let modal = modalParam;
	let img = null;
	if (!modal) {
		// Create the modal container
		modal = document.createElement("div");
		modal.classList.add("modal", "modal_type_preview");
		modal.id = "preview-modal";

		// Create the image container
		const modalImageContainer = document.createElement("div");
		modalImageContainer.classList.add("modal__image-container");

		// Create the close button
		const closeButton = document.createElement("button");
		closeButton.classList.add("modal-preview-close-button");
		closeButton.type = "button";
		closeButton.setAttribute("aria-label", "Close modal");

		// Create the image element
		img = document.createElement("img");
		img.classList.add("modal__image");
		img.src = paramImgSrc;
		img.alt = paramAltTxt;

		// Create the caption paragraph
		const caption = document.createElement("p");
		caption.classList.add("modal__caption");

		// Append children in order
		modalImageContainer.append(closeButton, img, caption);
		modal.append(modalImageContainer);

		// Finally, append modal to the body (or wherever you want it in the DOM)
		document.body.append(modal);
	}
	else{
		img = modal.querySelector(".modal__image");
		img.src = paramImgSrc;
		img.alt = paramAltTxt;
	}
	modal.style.animation = "modalBGFadeIn 0.35s ease forwards";
	const modalCloseBtnElm = modal.querySelector(".modal-preview-close-button");
	modalCloseBtnElm.addEventListener("click", (e) => {
		e.preventDefault();
		closeImageModal(modal);
	});
	// THIS IS HERE FOR SMALL SCREENS WHERE THE CLOSE BUTTON GETS CUT OFF, THIS WILL ALLOW USERS TO CLICK OFF THE MODAL
	modal.addEventListener("click", function (event) {
		event.preventDefault();
		if (event.target === modal) {
			if (modal.classList.contains("modal_is-opened")) closeImageModal(modal);
		}
	});
	modal.classList.add("modal_is-opened");
	if (modal.querySelector(".modal__image-container")) {
		modal.querySelectorAll(".modal__image-container").forEach((container) => {
			container.classList.add("modal-content--opening");
		});
	}
	modal.addEventListener(
		"animationend",
		() => {
			if (modal.querySelector(".modal__image-container")) {
				modal
					.querySelectorAll(".modal__image-container")
					.forEach((container) => {
						container.classList.remove("modal-content--opening");
					});
			}
		},
		{ once: true }
	);
  modal.addEventListener("keydown", (e) => {
		if ((e.key === "Enter" || e.key === "Escape")) {
			closeImageModal(modal);
		}
	});
  // Make modal focusable
  modal.setAttribute("tabindex", "-1");
	modal.focus();
	return modal;
}
/**
 * Closes a modal with a closing animation.
 * @param {*MODAL_ELEMENT The modal element} modal
 * @param {*BOOLEAN Should the modal be removed from the DOM after closing? Default: true} removeFromDOM
 * @returns Success status boolean
 */
function closeModalWithAnimation(modal, removeFromDOM = true) {
	if (!modal || modal.classList.contains("modal--closing")) return false;
	modal.querySelectorAll(".modal-content").forEach((content) => {
		content.classList.add("modal-content--closing");
	});
	modal.classList.add("modal--closing");
	if (removeFromDOM) {
		modal.addEventListener(
			"animationend",
			() => {
				modal.remove();
			},
			{ once: true }
		);
	}
  return true;
}
/**
 * Creates a custom modal.
 * @param {*STRING Title text of the modal} titleText
 * @param {*FUNCTION onClose callback function. Passes} onClose
 * @param {*BOOLEAN Does the modal have a close button?} locked
 * @param {*BOOLEAN Does the modal have a footer?} hasFooter
 * @param {*ELEMENT_OBJECT[] Array list of body elements to add to the modal} bodyElements
 * @param {*ELEMENT_OBJECT[] Array list of footer elements to add to the modal} footerElements
 * @returns The created custom modal element
 */
function createCustomModal(
	titleText,
	onClose,
	locked = false,
	hasFooter = true,
	bodyElements = [],
	footerElements = []
) {
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
	const title = document.createElement("h5");
	title.className = "modal-title";
	title.textContent = titleText;
	header.appendChild(title);

	let closeBtn = null;
	if (!locked) {
		closeBtn = document.createElement("button");
		closeBtn.className = "modal-close-button";
		closeBtn.tabIndex = 0;
		closeBtn.innerHTML = "&nbsp;";
    closeBtn.setAttribute("aria-label", "Close modal");
		header.appendChild(closeBtn);
	}

	// body
	const body = document.createElement("div");
	body.className = "modal-body";
	bodyElements.forEach((el) => {
		body.appendChild(el);
	});

	// footer
	let footer = null;
	let confirmBtn = null;
	let cancelBtn = null;
	if (hasFooter) {
		footer = document.createElement("div");
		footer.className = "modal-footer";

		if (footerElements.length > 0) {
			footerElements.forEach((el) => {
				if (el.classList.contains("btn")) {
					if (loggedIn) {
						getPreference("buttonGlow")
							.then((v) => v === "on")
							.then((isGlowing) => {
								if (darkMode && el !== null) {
									if (isGlowing) {
										el.classList.remove("btn--no-glow");
									} else {
										el.classList.add("btn--no-glow");
									}
								}
							});
					}
				}
				footer.appendChild(el);
			});
		} else {
			confirmBtn = document.createElement("button");
			confirmBtn.className = "btn btn-primary";
			confirmBtn.autofocus = true;
			confirmBtn.textContent = "Confirm";
			cancelBtn = document.createElement("button");
			cancelBtn.className = "btn btn-delete";
			cancelBtn.textContent = "Cancel";
			footer.appendChild(confirmBtn);
			footer.appendChild(cancelBtn);
		}
	}

	content.appendChild(header);
	content.appendChild(body);
	if(hasFooter) content.appendChild(footer);
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
				if (darkMode && confirmBtn !== null && cancelBtn !== null) {
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
			if (confirmBtn !== null && document.activeElement === confirmBtn)
				confirmBtn.click();
			if (cancelBtn !== null && document.activeElement === cancelBtn)
				cancelBtn.click();
			if (closeBtn !== null && document.activeElement === closeBtn) closeBtn.click();
		} else if (e.key === "Escape") {
			if (closeBtn !== null) closeBtn.click();
			e.preventDefault();
		}
	});

	function cleanup() {
		closeModalWithAnimation(modal);
	}

	function handleClose(result) {
		if (!modal.classList.contains("modal--closing")) {
			cleanup();
			if (typeof onClose === "function") onClose(result);
		}
	}

	if(closeBtn) closeBtn.addEventListener("click", () => handleClose(false));
	if(cancelBtn) cancelBtn.addEventListener("click", () => handleClose(false));
	if(confirmBtn) confirmBtn.addEventListener("click", () => handleClose(true));

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

/**
 * Creates a loading modal. Displays it too. Please call showLoadingModal() to use a global instance instead
 * @param {*STRING Text to display under the loading spinner} text
 * @returns A loading modal element
 */
function loadingModal(text = "Loading, please wait...") {
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
	p.textContent = text;

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
/**
 * Creates and displays an alert modal.
 * @param {*STRING Message string} message
 * @param {*BOOLEAN Does the modal have a confirm button and can it be closed by the user?} locked
 * @param {*FUNCTION Callback function to execute on confirm or close} onConfirm
 * @returns A alert modal element
 */
function alertModal(message, locked = false, onConfirm) {
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
    closeBtn.setAttribute("aria-label", "Close modal");
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
				if (typeof onConfirm === "function") onConfirm();
			});
		}
	}

	modal.addEventListener("click", (event) => {
		if (event.target === modal && !locked) {
			closeModalWithAnimation(modal);
			if (typeof onConfirm === "function") onConfirm();
		}
	});

	modal.addEventListener("keydown", (e) => {
		if ((e.key === "Enter" || e.key === "Escape") && !locked) {
			closeModalWithAnimation(modal);
			if (typeof onConfirm === "function") onConfirm();
		}
	});

	modal.focus();
	return modal;
}
/**
 * Creates and displays a confirmation modal.
 * @param {*STRING Message to display on the modal} message
 * @param {*FUNCTION Function that runs when the modal is confirmed or closed Includes a callback parameter indicating if confirmed (true) or canceled (false)} onConfirm
 * @returns A confirm modal element
 */
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
  closeBtn.setAttribute("aria-label", "Close modal");
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
/**
 * Prompt modal creation function. Creates and displays a prompt modal.
 * @param {*STRING Message string to display in the prompt} message
 * @param {*STRING What is the default value/string for the prompt?} defaultValue
 * @param {*FUNCTION Runs when the prompt is confirmed or closed. Includes a callback parameter indicating if confirmed (true) or canceled (false)} onConfirm
 * @returns Prompt modal element
 */
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
  closeBtn.setAttribute("aria-label", "Close modal");
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
