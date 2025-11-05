// Validation for logged out contact form
function validateContactFormLoggedOut() {
	const form = document.getElementById("contactFormLoggedOut");
	if (!form) return false;
	const name = form.querySelector("#name");
	const phone = form.querySelector("#phoneLoggedOut");
	const message = form.querySelector("#messageLoggedOut");
	let valid = true;
	if (!name.value.trim()) valid = false;
	if (!/^[0-9]{10}$/.test(phone.value.trim())) valid = false;
	if (!message.value.trim()) valid = false;
	if(message.value.trim().length < 10) valid = false;

	return valid;
}

// Validation for logged in contact form
function validateContactFormLoggedIn() {
	const form = document.getElementById("contactFormLoggedIn");
	if (!form) return false;
	const phone = form.querySelector("#phone");
	const checkbox = form.querySelector("#useAccountPhoneNumberCheckbox");
	const message = form.querySelector("#message");
	let valid = true;
	if (checkbox.checked) {
		phone.disabled = true;
		// Checkbox is required, so valid if checked
		valid = true;
	} else {
		phone.disabled = false;
		if (!/^[0-9]{10}$/.test(phone.value.trim())) valid = false;
	}
	if (!message.value.trim()) valid = false;	
	if(message.value.trim().length < 10) valid = false;
	return valid;
}

window.addEventListener("authChecked", async function () {
	const contactFormLoggedOut = document.getElementById("contactFormLoggedOut");
	if (!contactFormLoggedOut) return;
	const contactFormLoggedIn = document.getElementById("contactFormLoggedIn");
	if (!contactFormLoggedIn) return;
	const phoneLoggedIn = contactFormLoggedIn.querySelector("#phone");
	const checkbox = contactFormLoggedIn.querySelector(
		"#useAccountPhoneNumberCheckbox"
	);
	const submitBtnLoggedIn = contactFormLoggedIn.querySelector(
		'button[type="submit"]'
	);
	const submitBtnLoggedOut = contactFormLoggedOut.querySelector(
		'button[type="submit"]'
	);

	// Inject Turnstile widgets (best-effort)
	try {
		if (
			window.TurnstileHelper &&
			typeof window.TurnstileHelper.renderIntoFormSafe === "function"
		) {
			// render into both forms if present (safe — no throw)
			await window.TurnstileHelper.renderIntoFormSafe(
				contactFormLoggedOut,
				"loggedOut"
			);
			await window.TurnstileHelper.renderIntoFormSafe(
				contactFormLoggedIn,
				"loggedIn"
			);
		}
	} catch (e) {
		// non-fatal — widget failed to render
		console.warn("Turnstile render error:", e);
	}

	// Helper to update submit button state
	function updateLoggedInBtn() {
		if (submitBtnLoggedIn)
			submitBtnLoggedIn.disabled = !validateContactFormLoggedIn();
	}
	function updateLoggedOutBtn() {
		if (submitBtnLoggedOut)
			submitBtnLoggedOut.disabled = !validateContactFormLoggedOut();
	}

	// Initial state
	if (checkbox && phoneLoggedIn) {
		checkbox.addEventListener("change", function () {
			if (checkbox.checked) {
				phoneLoggedIn.disabled = true;
				phoneLoggedIn.value = "";
			} else {
				phoneLoggedIn.disabled = false;
			}
			updateLoggedInBtn();
		});
	}

	// Listen for input/change on all relevant fields in both forms
	[contactFormLoggedIn, contactFormLoggedOut].forEach((form) => {
		if (!form) return;
		form.addEventListener("input", function () {
			if (form === contactFormLoggedIn) updateLoggedInBtn();
			else updateLoggedOutBtn();
		});
		form.addEventListener("change", function () {
			if (form === contactFormLoggedIn) updateLoggedInBtn();
			else updateLoggedOutBtn();
		});
	});

	// Initial button state
	updateLoggedInBtn();
	updateLoggedOutBtn();

	contactFormLoggedIn.addEventListener("submit", function (e) {
		e.preventDefault();
		if (!validateContactFormLoggedIn()) {
			alert(
				"Please provide a message and either check the box to use your account phone number or enter a valid 10-digit phone number."
			);
		} else{
			submitContactFormLoggedIn();
			submitBtnLoggedIn.disabled = true;
		} 
	});

	contactFormLoggedOut.addEventListener("submit", function (e) {
		e.preventDefault();
		if (!validateContactFormLoggedOut()) {
			alert(
				"Please fill out all required fields and enter a valid 10-digit phone number."
			);
		} else {
			submitContactFormLoggedOut();
			submitBtnLoggedOut.disabled = true;
		}
	});

	if (loggedIn) {
		contactFormLoggedIn.style.display = "block";
		contactFormLoggedOut.style.display = "none";
	} else {
		contactFormLoggedIn.style.display = "none";
		contactFormLoggedOut.style.display = "block";
	}
});

async function submitContactFormLoggedOut() {
	const form = document.getElementById("contactFormLoggedOut");
	if (!form) return;
	const name = form.querySelector("#name").value.trim();
	const email = form.querySelector("#email").value.trim();
	const phone = form.querySelector("#phoneLoggedOut").value.trim();
	const message = form.querySelector("#messageLoggedOut").value.trim();

	// get turnstile token (best-effort)
	let turnstileToken = null;
	try {
		if (
			window.TurnstileHelper &&
			typeof window.TurnstileHelper.getTokenForForm === "function"
		) {
			turnstileToken = window.TurnstileHelper.getTokenForForm(form);
		}
	} catch (e) {
		console.warn("Error getting Turnstile token:", e);
	}

	showLoading();
	try {
		const response = await fetch(URL_BASE + "/api/contact-form/submit", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name, email, phone, message, turnstileToken }),
		});
		const text = await response.text();
		if (!response.ok) {
			window.location.hash = "#contact";
			hideLoading();
			alertModal(text || "Error submitting contact form.");
			// reset widget so user can try again
			try {
				window.TurnstileHelper && window.TurnstileHelper.resetForForm(form);
			} catch (e) {}
			return;
		}
		window.location.hash = "#contact";
		hideLoading();
		alertModal("Thank you! Your message has been submitted successfully.");
		// Reset form fields
		form.reset();
		// reset widget
		try {
			window.TurnstileHelper && window.TurnstileHelper.resetForForm(form);
		} catch (e) {}
		// Optionally reset character count
		const charCount = document.getElementById("characterCountLoggedOut");
		if (charCount) charCount.textContent = "0/500 characters";
	} catch (err) {
		window.location.hash = "#contact";
		console.error("Error submitting contact form:", err);
		hideLoading();
		alertModal("Network error: " + err.message);
		try {
			window.TurnstileHelper && window.TurnstileHelper.resetForForm(form);
		} catch (e) {}
	}
}

async function submitContactFormLoggedIn() {
	const form = document.getElementById("contactFormLoggedIn");
	if (!form) return;
	const phone = form.querySelector("#phone").value.trim();
	const checkbox = form.querySelector("#useAccountPhoneNumberCheckbox");
	const message = form.querySelector("#message").value.trim();
	const useAccountPhoneNumber = checkbox && checkbox.checked;

	// get turnstile token (best-effort)
	let turnstileToken = null;
	try {
		if (
			window.TurnstileHelper &&
			typeof window.TurnstileHelper.getTokenForForm === "function"
		) {
			turnstileToken = window.TurnstileHelper.getTokenForForm(form);
		}
	} catch (e) {
		console.warn("Error getting Turnstile token:", e);
	}

	showLoading();
	try {
		const response = await fetch(URL_BASE + "/api/user/contact-form/submit", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${
					getTokenFromSession ? getTokenFromSession() : ""
				}`,
			},
			body: JSON.stringify({
				message,
				phone: useAccountPhoneNumber ? undefined : phone,
				useAccountPhoneNumber,
				turnstileToken,
			}),
		});
		const text = await response.text();
		let json = {};
		try {
			json = JSON.parse(text);
		} catch (err) {}
		window.location.hash = "#contact";
		if (!response.ok) {
			if (json.message && json.message.trim() === "Malformed token") {
				hideLoading();
				alertModal("Token expired. Please login again...", true);
				setTimeout(() => {
					window.location.href = "login.html?redirect_uri=index.html#contact";
				}, 3000);
				return;
			}
			hideLoading();
			alertModal(json.message || text || "Error submitting contact form.");
			// reset widget so user can try again
			try {
				window.TurnstileHelper && window.TurnstileHelper.resetForForm(form);
			} catch (e) {}
			return;
		}
		hideLoading();
		alertModal("Thank you! Your message has been submitted successfully.");
		// Reset form fields
		form.reset();
		// reset widget
		try {
			window.TurnstileHelper && window.TurnstileHelper.resetForForm(form);
		} catch (e) {}
		// Optionally reset character count
		const charCount = document.getElementById("characterCountLoggedIn");
		if (charCount) charCount.textContent = "0/500 characters";
	} catch (err) {
		window.location.hash = "#contact";
		console.error("Error submitting contact form:", err);
		hideLoading();
		alertModal("Network error: " + err.message);
		try {
			window.TurnstileHelper && window.TurnstileHelper.resetForForm(form);
		} catch (e) {}
	}
}
