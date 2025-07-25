// Validation for logged out contact form
function validateContactFormLoggedOut() {
	const form = document.getElementById("contactFormLoggedOut");
	if (!form) return false;
	const name = form.querySelector("#name");
	const phone = form.querySelector("#phone");
	const message = form.querySelector("#message");
	let valid = true;
	if (!name.value.trim()) valid = false;
	if (!/^[0-9]{10}$/.test(phone.value.trim())) valid = false;
	if (!message.value.trim()) valid = false;
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
		} else submitContactFormLoggedIn();
	});

	contactFormLoggedOut.addEventListener("submit", function (e) {
		e.preventDefault();
		if (!validateContactFormLoggedOut()) {
			alert(
				"Please fill out all required fields and enter a valid 10-digit phone number."
			);
		} else submitContactFormLoggedOut();
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
	const phone = form.querySelector("#phone").value.trim();
	const message = form.querySelector("#message").value.trim();
	const alertDiv =
		form.closest("section")?.querySelector(".alertDiv") ||
		form.querySelector(".alertDiv") ||
		form;

	try {
		const response = await fetch(URL_BASE + "/api/contact-form/submit", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name, email, phone, message }),
		});
		const text = await response.text();
		if (!response.ok) {
			window.location.hash = "#contact";
			showAlert(text || "Error submitting contact form.", true, form);
			return;
		}
		window.location.hash = "#contact";
		showAlert(
			"Thank you! Your message has been submitted successfully.",
			false,
			form
		);
		// Reset form fields
		form.reset();
		// Optionally reset character count
		const charCount = document.getElementById("characterCountLoggedOut");
		if (charCount) charCount.textContent = "0/500 characters";
	} catch (err) {
		window.location.hash = "#contact";
		showAlert("Network error. Please try again later.", true, form);
	}
}

async function submitContactFormLoggedIn() {
	const form = document.getElementById("contactFormLoggedIn");
	if (!form) return;
	const phone = form.querySelector("#phone").value.trim();
	const checkbox = form.querySelector("#useAccountPhoneNumberCheckbox");
	const message = form.querySelector("#message").value.trim();
	const useAccountPhoneNumber = checkbox && checkbox.checked;
	const alertDiv =
		form.closest("section")?.querySelector(".alertDiv") ||
		form.querySelector(".alertDiv") ||
		form;

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
			}),
		});
		const text = await response.text();
		window.location.hash = "#contact";
		if (!response.ok) {
			showAlert(text || "Error submitting contact form.", true, form);
			return;
		}
		showAlert(
			"Thank you! Your message has been submitted successfully.",
			false,
			form
		);
		// Reset form fields
		form.reset();
		// Optionally reset character count
		const charCount = document.getElementById("characterCountLoggedIn");
		if (charCount) charCount.textContent = "0/500 characters";
	} catch (err) {
		window.location.hash = "#contact";
		showAlert("Network error. Please try again later.", true, form);
	}
}
