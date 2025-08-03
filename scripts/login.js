function getQueryParam(name) {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get(name);
}
function loginWithGoogle() {
	const urlParams = new URLSearchParams(window.location.search);
	const redirectUri = urlParams.get("redirect_uri");
	if (redirectUri) {
		window.location.href =
			URL_BASE + "/auth/google?redirect_uri=" + redirectUri;
	} else {
		window.location.href = URL_BASE + "/auth/google";
	}
}
function googleCallback() {
	const token = getQueryParam("token");
	const admin = getQueryParam("admin");
	const redirectUri = getQueryParam("redirect_uri");
	if (token) {
		sessionStorage.setItem("jwt", token);
		if (admin) {
			// Only append redirect_uri if it is not the admin or member portal itself
			if (
				redirectUri &&
				redirectUri !== "admin.html" &&
				redirectUri !== "members.html" &&
				redirectUri !== "null"
			)
				window.location.href = `admin.html?redirect_uri=${redirectUri}`;
			else window.location.href = `admin.html`;
		} else {
			if (
				redirectUri &&
				redirectUri !== "members.html" &&
				redirectUri !== "admin.html" &&
				redirectUri !== "null"
			)
				window.location.href = `members.html?redirect_uri=${redirectUri}`;
			else window.location.href = `members.html`;
		}
	}
}
// Store the temporary email for verification and cleanup
window.tempEmail = null;
window.addEventListener("authChecked", function () {
	const email = document.getElementById("email");
	const password = document.getElementById("password");
	const button = document.querySelector('#emaillogin button[type="submit"]');

	function checkInputs() {
		button.disabled = !(email.value.trim() && password.value.trim());
	}

	email.addEventListener("input", checkInputs);
	password.addEventListener("input", checkInputs);
	checkInputs(); // Initial check

	// Get section elements for alert targeting
	const mainSection = document.getElementById("mainSection");
	const emailLoginSection = document.getElementById("emailloginSection");
	const verifyLoginSection = document.getElementById("verifyLoginSection");

	document
		.getElementById("emaillogin")
		.addEventListener("submit", async (e) => {
			e.preventDefault();

			const email = document.getElementById("email").value;
			const password = document.getElementById("password").value;
			showLoading();
			try {
				const response = await fetch(URL_BASE + "/api/auth/login", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ email, password }),
				});

				if (response.ok) {
					hideLoading();
					tempEmail = email;
					showVerifyLoginSection();
					alertModal(
						"Verification code sent! Please check your email and enter the code into the input field. YOU HAVE 5 MINUTES UNTIL THE CODE EXPIRES."
					);
				} else {
					tempEmail = null;
					hideLoading();
					const errorMessage = await response.text();
					const errorData = null;
					try {
						errorData = JSON.parse(errorMessage);
					} catch (e) {
            //DO nothing
					}
					alertModal(
						errorData?.message ||
							errorMessage ||
							"Login failed! Please try again."
					);
				}
			} catch (error) {
				tempEmail = null;
				hideLoading();
				console.error("Error logging in:", error);
				alertModal("Login failed due to network error: " + error.message);
			}
		});

	// Helper to show/hide sections for verification step
	function showVerifyLoginSection() {
		const mainSection = document.getElementById("mainSection");
		const emailLoginSection = document.getElementById("emailloginSection");
		if (mainSection) mainSection.style.display = "none";
		if (emailLoginSection) emailLoginSection.style.display = "none";
		if (verifyLoginSection) verifyLoginSection.style.display = "block";
		window.location.hash = "verifyLoginSection"; // Update URL hash
	}

	// Handle verification code confirmation
	document
		.getElementById("verifyAccountButton")
		.addEventListener("click", async (e) => {
			e.preventDefault();

			const email = tempEmail;
			const code = document.getElementById("verificationCode").value;
			const urlParams = new URLSearchParams(window.location.search);
			const redirectUri = urlParams.get("redirect_uri");

			// Clear previous alert messages for verification
			const alertDiv = verifyLoginSection.querySelector(".alertDiv");
			alertDiv.style.display = "none";
			alertDiv.innerHTML = "";
			showLoading();
			try {
				const response = await fetch(URL_BASE + "/api/auth/verify-login", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ email, code }),
				});

				if (response.ok) {
					hideLoading();
					const successModal = alertModal(
						"Login successful! Redirecting to your account...",
						true
					);
					const data = await response.json();
					const token = data.token;
					sessionStorage.setItem("jwt", token);
					tempEmail = null; // Clear temp email after successful login
					console.log("Login successful, token stored in sessionStorage.");
					//wait two seconds before redirecting
					await new Promise((resolve) => setTimeout(resolve, 2000));
					closeModalWithAnimation(successModal);
					if (data.adminUser) {
						// Only append redirect_uri if it is not the admin or member portal itself
						if (
							redirectUri &&
							redirectUri !== "admin.html" &&
							redirectUri !== "members.html"
						)
							window.location.href = `admin.html?redirect_uri=${redirectUri}`;
						else window.location.href = `admin.html`;
					} else {
						if (
							redirectUri &&
							redirectUri !== "members.html" &&
							redirectUri !== "admin.html"
						)
							window.location.href = `members.html?redirect_uri=${redirectUri}`;
						else window.location.href = `members.html`;
					}
				} else {
					hideLoading();
					const errorData = await response.text();
					const errorJson = null;
					try {
						errorJson = JSON.parse(errorData);
					} catch (e) {
            //DO nothing
					}
					if (response.status === 404) {
						const errmodal = alertModal(
							"Login session not found or expired. Please try logging in again after waiting for the refresh...",
							true
						);
						setTimeout(() => {
							closeModalWithAnimation(errmodal);
							window.location.reload();
						}, 3000);
					} else
						alertModal(
							errorData ||
								errorJson?.message ||
								"Verification failed! Please try again."
						);
				}
			} catch (error) {
				hideLoading();
				console.error("Error verifying code:", error);
				alertModal(
					"Verification failed due to network error: " + error.message
				);
			}
		});

	// Resend verification code
	document
		.getElementById("resendCodeButton")
		.addEventListener("click", async (e) => {
			e.preventDefault();
			const email = tempEmail;
			showLoading();
			try {
				const response = await fetch(
					URL_BASE + "/api/auth/resend-verification-login",
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ email }),
					}
				);

				if (response.ok) {
					hideLoading();
					alertModal("Verification code resent! Please check your email.");
				} else {
					hideLoading();
					const errorData = await response.text();
					let jsonData = null;
					try {
						jsonData = JSON.parse(errorData);
					} catch (e) {
						//DO nothing
					}
					if (response.status === 404) {
						const errmodal = alertModal(
							"Login session not found or expired. Please try logging in again after waiting for the reload...",
							true
						);
						setTimeout(() => {
							closeModalWithAnimation(errmodal);
							window.location.reload();
						}, 3000);
					} else
						alertModal(
							"Error resending verification code: " +
								(jsonData?.message || errorData || "Please try again.")
						);
				}
			} catch (error) {
				hideLoading();
				console.error("Error resending verification code:", error);
				alertModal(
					"Failed to resend verification code due to network error: " +
						error.message
				);
			}
		});
	const verificationCodeInput = document.getElementById("verificationCode");
	const verifyAccountButton = document.getElementById("verifyAccountButton");
	if (verificationCodeInput && verifyAccountButton) {
		verifyAccountButton.disabled = true;
		verificationCodeInput.addEventListener("input", function () {
			// Only enable if exactly 6 digits
			verifyAccountButton.disabled = !/^\d{6}$/.test(this.value.trim());
		});
	}
	googleCallback(); // Call this to handle any existing token in the URL
});
