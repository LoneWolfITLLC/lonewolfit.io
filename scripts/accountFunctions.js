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
					alertModal(
						ofAllDevices
							? "You have been signed out of all devices."
							: "You have been signed out."
					);
					setTimeout(() => {
						window.location.href = "index.html";
					}, 2000);
				} else {
					if (response.status === 401) {
						sessionStorage.removeItem("jwt");
						hideLoading();
						alertModal("Session expired. Please log in again.");
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
							alertModal(
								"You have been signed out of all devices. You can now reset your password."
							);
							setTimeout(() => {
								window.location.href = "reset.html";
							}, 3000);
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
								alertModal("Your account has been deleted.");
								setTimeout(() => {
									window.location.href = redirectUri;
								}, 2000);
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
