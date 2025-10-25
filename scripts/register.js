window.addEventListener("authChecked", function () {
	// Initialize dark mode if needed
	if (localStorage.getItem("darkMode") === "true") {
		document.body.classList.add("dark-mode");
	}

	// Query all elements with id="password" (not recommended, but works)
	document.querySelectorAll("#passwordResidential").forEach((input) => {
		input.addEventListener("input", function () {
			meterPasswordStrength(this);
		});
	});
	// Query all elements with id="password" (not recommended, but works)
	document.querySelectorAll("#passwordBusiness").forEach((input) => {
		input.addEventListener("input", function () {
			meterPasswordStrength(this);
		});
	});

	// Handle form submission for residential registration
	document
		.getElementById("registerForm")
		.addEventListener("submit", function (e) {
			e.preventDefault();
			window.location.href = "#registerSectionResidential";
			handleRegistration("residential", this);
		});

	// Handle form submission for business registration
	document
		.getElementById("registerFormBusiness")
		.addEventListener("submit", function (e) {
			e.preventDefault();
			window.location.href = "#registerSectionBusiness";
			handleRegistration("business", this);
		});

	// Registration handler for both forms
	async function handleRegistration(type, formElem) {
		let form, prefix;
		if (type === "business") {
			form = document.getElementById("registerFormBusiness");
			prefix = "Business";
		} else {
			form = document.getElementById("registerForm");
			prefix = "Residential";
		}

		const formData = new FormData();

		// ...existing code...
		if (type === "business") {
			formData.append(
				"firstName",
				document.getElementById("firstNameBusiness").value
			);
			formData.append(
				"middleName",
				document.getElementById("middleNameBusiness").value
			);
			formData.append(
				"lastName",
				document.getElementById("lastNameBusiness").value
			);
			formData.append("phone", document.getElementById("phoneBusiness").value);
			formData.append(
				"country",
				document.getElementById("countryBusiness").value
			);
			formData.append(
				"address",
				document.getElementById("address1Business").value +
					", " +
					document.getElementById("address2Business").value +
					", " +
					document.getElementById("cityBusiness").value +
					", " +
					document.getElementById("stateBusiness").value +
					", " +
					document.getElementById("zipCodeBusiness").value +
					", " +
					document.getElementById("countryBusiness").value
			);
			formData.append(
				"username",
				document.getElementById("usernameBusiness").value
			);
			formData.append("email", document.getElementById("emailBusiness").value);
			formData.append(
				"password",
				document.getElementById("passwordBusiness").value
			);
			formData.append(
				"dbaName",
				document.getElementById("dbaNameBusiness").value
			);
			formData.append(
				"businessAddress",
				document.getElementById("businessAddress1Business").value +
					", " +
					document.getElementById("businessAddress2Business").value +
					", " +
					document.getElementById("businessCityBusiness").value +
					", " +
					document.getElementById("businessState").value +
					", " +
					document.getElementById("businessZipCodeBusiness").value +
					", " +
					document.getElementById("businessCountry").value
			);
		} else {
			formData.append(
				"firstName",
				document.getElementById("firstNameResidential").value
			);
			formData.append(
				"middleName",
				document.getElementById("middleNameResidential").value
			);
			formData.append(
				"lastName",
				document.getElementById("lastNameResidential").value
			);
			formData.append(
				"phone",
				document.getElementById("phoneResidential").value
			);
			formData.append("country", document.getElementById("country").value);
			formData.append(
				"address",
				document.getElementById("address1Residential").value +
					", " +
					document.getElementById("address2Residential").value +
					", " +
					document.getElementById("cityResidential").value +
					", " +
					document.getElementById("state").value +
					", " +
					document.getElementById("zipCodeResidential").value +
					", " +
					document.getElementById("country").value
			);
			formData.append(
				"username",
				document.getElementById("usernameResidential").value
			);
			formData.append(
				"email",
				document.getElementById("emailResidential").value
			);
			formData.append(
				"password",
				document.getElementById("passwordResidential").value
			);
			formData.append("dbaName", null);
			formData.append("businessAddress", null);
		}
		// ...existing code..
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

		// append token to the FormData so server can verify
        if (turnstileToken) {
            formData.append("turnstileToken", turnstileToken);
        } else {
            // still append empty value so server sees the field consistently
            formData.append("turnstileToken", "");
        }
		
		// Show loading modal
		showLoading();
		try {
			// POST to backend registration endpoint
			const response = await fetch("/api/auth/register", {
				method: "POST",
				body: formData,
			});

			// Hide loading modal
			hideLoading();

			if (response.ok) {
				const regSucModal = alertModal(
					"Registration successful! Please check your email for a verification code.",
					true
				);
				setTimeout(() => {
					showVerificationSection(formData.get("email"));
					window.location.hash = "#verifyRegistrationSection";
					closeModalWithAnimation(regSucModal);
				}, 3000);
			} else {
				let result = await response.text();
				let jsonresult = null;
				try {
					jsonresult = JSON.parse(result);
				} catch (e) {
					//DO nothing
				}
				alertModal(
					jsonresult?.message ||
						result ||
						"Registration failed. Please try again."
				);
			}
		} catch (err) {
			hideLoading();
			alertModal("An error occurred. Please try again later.");
		}
	}

	// Hide the verify section initially
	const verifySection = document.getElementById("verifyRegistrationSection");
	if (verifySection) {
		verifySection.style.display = "none";
		verifySection.classList.remove("fadeIn");
	}

	// Show the verify section with fadeIn animation
	function showVerificationSection(email) {
		// Hide registration sections
		const residentialSection = document.getElementById(
			"registerSectionResidential"
		);
		const businessSection = document.getElementById("registerSectionBusiness");

		const mainSection = document.querySelector(".main__section");
		if (mainSection) mainSection.style.display = "none"; // Hide main section
		if (residentialSection) residentialSection.style.display = "none";
		if (businessSection) businessSection.style.display = "none";

		// Optionally update the email in the verify section
		if (verifySection) {
			// If you want to show the email, update the text here:
			const emailSpan = verifySection.querySelector(".verify-email");
			if (emailSpan) emailSpan.textContent = email;

			verifySection.style.display = "block";
			verifySection.classList.remove("fadeIn");
			void verifySection.offsetWidth; // Force reflow for animation restart
			verifySection.classList.add("fadeIn");
		}
		// Add event listener for resend button
		const verificationButton = document.getElementById("verifyAccountButton");
		verificationButton.addEventListener("click", function (e) {
			e.preventDefault();
			handleVerification(email);
		});

		// Add event listener for resend code button
		const resendButton = document.getElementById("resendCodeButton");
		resendButton.addEventListener("click", async function () {
			showLoading();
			try {
				const response = await fetch("/api/auth/resend-verification", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email }),
				});
				hideLoading();
				if (response.ok) {
					alertModal("Verification email resent! Please check your inbox.");
				} else {
					const result = await response.json();
					if (response.status === 404) {
						const errmodal = alertModal(
							"Registration session expired. Please register again.",
							true
						);
						setTimeout(() => {
							window.location.reload();
							closeModalWithAnimation(errmodal);
						}, 2000);
					} else
						alertModal(
							result.message || "Failed to resend verification email."
						);
				}
			} catch (err) {
				hideLoading();
				alertModal(
					"An error occurred while resending the verification email: " +
						err.message
				);
			}
		});
	}

	// Handle verification code submission
	async function handleVerification(email) {
		const code = document.getElementById("verificationCode").value;
		showLoading();
		try {
			const response = await fetch("/api/auth/verify-registration", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, code }),
			});
			hideLoading();
			const formElem = document
				.getElementById("verifyAccountButton")
				.closest("form");
			if (response.ok) {
				const succmodal = alertModal(
					"Verification successful! Redirecting to login...",
					true
				);
				setTimeout(() => {
					window.location.href = "login.html" + window.location.search; // Preserve query string
					closeModalWithAnimation(succmodal);
				}, 2000);
			} else {
				const result = await response.json();
				if (response.status === 404) {
					const errmodal = alertModal(
						"Registration session expired. Please register again.",
						true
					);
					setTimeout(() => {
						window.location.reload();
						closeModalWithAnimation(errmodal);
					}, 2000);
				} else
					alertModal(
						result.message || "Verification failed. Please try again."
					);
			}
		} catch (err) {
			hideLoading();
			const formElem = document
				.getElementById("verifyAccountButton")
				.closest("form");
			alertModal("An error occurred: " + err.message);
		}
	}

	// Utility to check if all required fields are filled
	function areRequiredFieldsFilled(form, requiredIds) {
		for (const id of requiredIds) {
			const el = form.querySelector(`#${id}`);
			if (!el) {
				return false;
			}
			if (el.type === "checkbox" && !el.checked) {
				return false;
			}
			if (el.type !== "checkbox" && !el.value.trim()) {
				return false;
			}
		}
		// Password validation using doesPasswordMeetCriteria from newPasswordField.js
		let passwordInput, confirmInput;
		if (form.id === "registerForm") {
			passwordInput = form.querySelector("#passwordResidential");
			confirmInput = form.querySelector("#confirmPasswordResidential");
		} else if (form.id === "registerFormBusiness") {
			passwordInput = form.querySelector("#passwordBusiness");
			confirmInput = form.querySelector("#confirmPasswordBusiness");
		}
		if (passwordInput && confirmInput) {
			const password = passwordInput.value.trim();
			const confirm = confirmInput.value;
			if (typeof window.doesPasswordMeetCriteria === "function") {
				if (!window.doesPasswordMeetCriteria(password)) {
					return false;
				}
			}
			if (password.trim() !== confirm.trim()) {
				return false;
			}
		}
		return true;
	}

	// Enable/disable submit button logic for residential form
	const residentialForm = document.getElementById("registerForm");
	// Enable/disable submit button logic for business form
	const businessForm = document.getElementById("registerFormBusiness");
	if (businessForm && residentialForm) {
		const residentialRequired = [
			"usernameResidential",
			"firstNameResidential",
			"lastNameResidential",
			"phoneResidential",
			"country",
			"address1Residential",
			"cityResidential",
			"state",
			"zipCodeResidential",
			"emailResidential",
			"passwordResidential",
			"confirmPasswordResidential",
			"privacyPolicyResidential",
			"informationSharingResidential",
		];
		const residentialSubmit = residentialForm.querySelector(
			'button[type="submit"]'
		);
		const businessRequired = [
			"dbaNameBusiness",
			"businessCountry",
			"businessAddress1Business",
			"businessCityBusiness",
			"businessState",
			"businessZipCodeBusiness",
			"usernameBusiness",
			"firstNameBusiness",
			"lastNameBusiness",
			"phoneBusiness",
			"countryBusiness",
			"address1Business",
			"cityBusiness",
			"stateBusiness",
			"zipCodeBusiness",
			"emailBusiness",
			"passwordBusiness",
			"confirmPasswordBusiness",
			"privacyPolicyBusiness",
			"informationSharingBusiness",
		];
		const businessSubmit = businessForm.querySelector('button[type="submit"]');
		// Attach input listeners to residential password fields
		const passwordResidential = document.getElementById("passwordResidential");
		const confirmPasswordResidential = document.getElementById(
			"confirmPasswordResidential"
		);
		if (passwordResidential && confirmPasswordResidential) {
			[passwordResidential, confirmPasswordResidential].forEach((input) => {
				input.addEventListener("input", function () {
					residentialSubmit.disabled = !areRequiredFieldsFilled(
						residentialForm,
						residentialRequired
					);
				});
			});
		}

		// Attach input listeners to business password fields
		const passwordBusiness = document.getElementById("passwordBusiness");
		const confirmPasswordBusiness = document.getElementById(
			"confirmPasswordBusiness"
		);
		if (passwordBusiness && confirmPasswordBusiness) {
			[passwordBusiness, confirmPasswordBusiness].forEach((input) => {
				input.addEventListener("input", function () {
					businessSubmit.disabled = !areRequiredFieldsFilled(
						businessForm,
						businessRequired
					);
				});
			});
		}

		function attachFieldListeners(form, requiredIds, submitButton) {
			requiredIds.forEach((id) => {
				const el = form.querySelector(`#${id}`);
				if (!el) return;
				const eventType = el.type === "checkbox" ? "change" : "input";
				el.addEventListener(eventType, function () {
					submitButton.disabled = !areRequiredFieldsFilled(form, requiredIds);
				});
			});
		}
		attachFieldListeners(
			residentialForm,
			residentialRequired,
			residentialSubmit
		);
		attachFieldListeners(businessForm, businessRequired, businessSubmit);
	}
	const verificationCodeInput = document.getElementById("verificationCode");
	const verifyAccountButton = document.getElementById("verifyAccountButton");
	if (verificationCodeInput && verifyAccountButton) {
		verifyAccountButton.disabled = true;
		verificationCodeInput.addEventListener("input", function () {
			// Only enable if exactly 6 digits
			verifyAccountButton.disabled = !/^\d{6}$/.test(this.value.trim());
		});
	}
});
