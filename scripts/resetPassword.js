document.addEventListener("DOMContentLoaded", function () {
	document
		.getElementById("togglePassword")
		.addEventListener("click", function () {
			const passwordInput = document.getElementById("password");
			const eyeIcon = this.querySelector("i");

			// Toggle input type between "password" and "text"
			if (passwordInput.type === "password") {
				passwordInput.type = "text";
				eyeIcon.classList.remove("fa-eye");
				eyeIcon.classList.add("fa-eye-slash");
			} else {
				passwordInput.type = "password";
				eyeIcon.classList.remove("fa-eye-slash");
				eyeIcon.classList.add("fa-eye");
			}
		});
	// Enable submit button only when a valid email is entered
	const emailInput = document.getElementById("email");
	const submitButton = document.querySelector(
		"#resetForm button[type='submit']"
	);
	function isValidEmail(email) {
		// Simple email regex
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}
	function checkEmailInput() {
		submitButton.disabled = !isValidEmail(emailInput.value.trim());
	}
	emailInput.addEventListener("input", checkEmailInput);
	checkEmailInput(); // Initial check
	// Query all elements with id="password" (not recommended, but works)
	document.querySelectorAll("#password").forEach((input) => {
		input.addEventListener("input", function () {
			meterPasswordStrength(this);
		});
	});
	document.querySelectorAll("#passwordConfirm").forEach((input) => {
		input.addEventListener("input", function () {
			meterPasswordStrength(this);
		});
	});
	const resetSection = document.getElementById("resetSection");
	resetSection.style.display = "none"; // Hide reset section initially

	const resetPasswordButton = document.querySelector(
		"#resetSection button[type='submit']"
	);
	const resetForm = document.getElementById("resetForm");

	// Create an event listener for each input field, to check if the new password form is complete
	const newPasswordForm = document.getElementById("newPasswordForm");
	if (newPasswordForm) {
		newPasswordForm.addEventListener("input", function () {
			const verificationCode = document
				.getElementById("verificationCode")
				.value.trim();
			const password = document.getElementById("password").value.trim();
			const passwordConfirm = document
				.getElementById("passwordConfirm")
				.value.trim();

			// Check if verification code is a 6-digit number
			const isVerificationCodeValid = /^\d{6}$/.test(verificationCode);

			resetPasswordButton.disabled = !(
				isVerificationCodeValid &&
				password &&
				passwordConfirm &&
				password === passwordConfirm &&
				doesPasswordMeetCriteria(password)
			);
		});
	}
	// Handle reset password form submission
	document
		.getElementById("resetForm")
		.addEventListener("submit", async function (event) {
			event.preventDefault();
			const email = document.getElementById("email").value.trim();
			const alertDiv = document.getElementById("alertEmail");
			showLoading();
			try {
				const response = await fetch("/api/auth/send-verification-code", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ email }),
				});
				const text = await response.text();
				if (response.ok) {
					hideLoading();
					const alertVerificationCodeSentModal = alertModal(text, true);
					//Hide the reset form and show the new password section after three seconds
					setTimeout(() => {
						document.getElementById("mainSection").style.display = "none";
						document.getElementById("resetSection").style.display = "block";
						window.location.hash = "resetSection"; // Scroll to new password section
						closeModalWithAnimation(alertVerificationCodeSentModal);
					}, 3000);
				} else {
					hideLoading();
					alertModal(text);
				}
			} catch (error) {
				hideLoading();
				alertModal("Error: " + error.message);
			}
		});
	document
		.getElementById("newPasswordForm")
		.addEventListener("submit", async function (event) {
			event.preventDefault();
			const email = document.getElementById("email").value.trim();
			const verificationCode = document
				.getElementById("verificationCode")
				.value.trim();
			const password = document.getElementById("password").value.trim();
			const passwordConfirm = document
				.getElementById("passwordConfirm")
				.value.trim();
			const loadingModal = document.getElementById("loadingModal");
			const alertDiv = document.getElementById("alertNewPassword");
			if (password !== passwordConfirm) {
				alertModal("Passwords do not match.");
				return;
			}
			showLoading();
			try {
				const response = await fetch("/api/auth/reset-password", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						email,
						verificationCode,
						newPassword: password,
						signOutAllDevices: true,
					}),
				});
				const text = await response.text();
				if (response.ok) {
					hideLoading();
					const successAlertModal = alertModal(text, true);
					// Redirect to member portal after 2 seconds
					setTimeout(() => {
						window.location.href = "login.html" + window.location.search; // Preserve query string
						closeModalWithAnimation(successAlertModal);
					}, 3000);
				} else {
					hideLoading();
					alertModal(text);
				}
			} catch (error) {
				hideLoading();
				alertModal("Error: " + error.message);
			}
		});
}); // <-- Add this closing brace to end the DOMContentLoaded event listener
