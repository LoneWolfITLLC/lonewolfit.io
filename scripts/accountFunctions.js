function signOut(ofAllDevices = false) {
	const token = sessionStorage.getItem("jwt");
	if (!token) {
		alertModal("No session found. You are already signed out.");
		window.location.href = "index.html";
		return;
	}
	let confirmMessage = ofAllDevices
		? "Are you sure you want to sign out of all devices?"
		: "Are you sure you want to sign out?";
	confirmModal(confirmMessage, function (result) {
		if (!result) {
			return;
		}
		showLoading();
		fetch(URL_BASE + "/api/auth/sign-out", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				doNotSignOutAllDevices: !ofAllDevices,
			}),
		})
			.then((response) => {
				if (response.ok) {
					sessionStorage.removeItem("jwt");
					loggedIn = false;
					hideLoading();
					const successAlertModal = alertModal(
						ofAllDevices
							? "You have been signed out of all devices."
							: "You have been signed out.",
						true
					);
					setTimeout(() => {
						closeModalWithAnimation(successAlertModal);
					}, 2000);
					setTimeout(() => {
						window.location.href = "index.html";
					}, 2250);
				} else {
					if (response.status === 401) {
						sessionStorage.removeItem("jwt");
						hideLoading();
						alertModal("Session expired. Please log in again.", true);
						loggedIn = false;
						window.location.href = "login.html#emailloginSection";
						return;
					} else {
						return response.json().then((text) => {
							hideLoading();
							alertModal("Sign out failed: " + text.message);
						});
					}
				}
			})
			.catch((err) => {
				hideLoading();
				alertModal("Sign out failed: " + err.message);
			});
	});
}
function resetPassword() {
	const token = sessionStorage.getItem("jwt");
	if (token) {
		confirmModal(
			"Are you sure you want to reset your password?",
			function (result) {
				if (!result) {
					return;
				}
				showLoading();
				fetch(URL_BASE + "/api/auth/sign-out", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						doNotSignOutAllDevices: false,
					}),
				})
					.then((response) => {
						if (response.ok) {
							sessionStorage.removeItem("jwt");
							hideLoading();
							const successAlertModal = alertModal(
								"You have been signed out of all devices. You can now reset your password.",
								true
							);
							setTimeout(() => {
								closeModalWithAnimation(successAlertModal);
							}, 2000);
							setTimeout(() => {
								window.location.href = "reset.html";
							}, 2250);
						} else {
							return response.json().then((text) => {
								hideLoading();
								alertModal("Sign out failed: " + text.message);
							});
						}
					})
					.catch((err) => {
						hideLoading();
						alertModal("Sign out failed: " + err.message);
					});
			}
		);
	}
}
function deleteAccount(redirectUri = "index.html") {
	const token = sessionStorage.getItem("jwt");
	if (!token) {
		alertModal("No session found. You are already signed out.");
		window.location.href = "index.html";
		return;
	}
	confirmModal(
		"Are you sure you want to delete your account? This action cannot be undone.",
		function (result) {
			if (!result) {
				return;
			}
			promptModal(
				"Type 'DELETE' to confirm account deletion:",
				"",
				function (deleteConfirmation) {
					if (deleteConfirmation !== "DELETE") {
						alertModal("Account deletion canceled.");
						return;
					}
					showLoading();
					fetch(URL_BASE + "/api/auth/delete-account", {
						method: "DELETE",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${token}`,
						},
					})
						.then((response) => {
							if (response.ok) {
								sessionStorage.removeItem("jwt");
								hideLoading();
								const successAlertModal = alertModal("Your account has been deleted.", true);
								setTimeout(() => {
									closeModalWithAnimation(successAlertModal);
								}, 2000);
								setTimeout(() => {
									window.location.href = redirectUri;
								}, 2250);
							} else {
								return response.json().then((text) => {
									hideLoading();
									alertModal("Account deletion failed: " + text.message);
								});
							}
						})
						.catch((err) => {
							hideLoading();
							alertModal("Account deletion failed: " + err.message);
						});
				}
			);
		}
	);
}
function goToMemberPortal() {
	if (
		(typeof MEMBER_PATH !== "undefined" &&
			window.location.pathname.endsWith(MEMBER_PATH)) ||
		window.location.pathname.endsWith("/members.html")
	) {
        if (typeof alertModal === "function") {
            alertModal("You are already on the member portal page.");
        }
        else {
            console.warn("You are already on the member portal page.");
            alert("You are already on the member portal page.");
        }
		return; // Already on the member portal page
	}
	if (typeof loggedIn !== "undefined" && !loggedIn) {
		if (typeof confirmModal !== "function") {
			const yes = confirm("You must be logged in to access the member portal. Log in now?");
			if (yes) {
				window.location.href = "/login.html";
			}
		} else
			confirmModal(
				"You must be logged in to access the member portal. Log in now?",
				function (yes) {
					if (yes) {
						window.location.href = "/login.html";
					}
				}
			);
		return;
	} else if (loggedIn) {
		if (typeof MEMBER_PATH === "undefined") {
			window.location.href = "/members.html";
		} else {
			window.location.href = MEMBER_PATH;
		}
	}
}