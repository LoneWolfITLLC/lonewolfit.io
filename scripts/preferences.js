function setCookie(name, value, days) {
	const expires = days
		? "; expires=" + new Date(Date.now() + days * 864e5).toUTCString()
		: "";
	document.cookie =
		name + "=" + encodeURIComponent(value) + expires + "; path=/";
}

function getCookie(name) {
	const cookies = document.cookie.split("; ");
	for (let cookie of cookies) {
		const [key, val] = cookie.split("=");
		if (key === name) return decodeURIComponent(val);
	}
	return null;
}

function syncCookie(name, value) {
	if (getCookie(name) !== value) {
		setCookie(name, value, 365);
	}
}

// Prevent duplicate event listeners
let listenersAdded = false;

function initPreferencesPage(darkMode, autoDarkMode) {
	const darkModeToggle = document.getElementById("darkModePref");
	const autoDarkModeToggle = document.getElementById("autoDarkModePref");

	if (!darkModeToggle || !autoDarkModeToggle) return;

	// Initialize toggle states
	darkModeToggle.classList.toggle("active", darkMode === "on");
	autoDarkModeToggle.classList.toggle("active", autoDarkMode === "on");

	// Disable dark mode toggle if auto dark mode is on
	if (autoDarkMode === "on") {
		const systemDark = window.matchMedia(
			"(prefers-color-scheme: dark)"
		).matches;
		darkModeToggle.disabled = true;
		darkModeToggle.classList.add("disabled");
		darkModeToggle.setAttribute("aria-disabled", "true");

		// Update dark mode state to match system preference
		darkModeToggle.classList.toggle("active", systemDark);
		applyDarkMode(systemDark);
	} else {
		darkModeToggle.disabled = false;
		darkModeToggle.classList.remove("disabled");
		darkModeToggle.removeAttribute("aria-disabled");
	}

	// Add event listeners for toggles if not already added
	if (!listenersAdded) {
		darkModeToggle.addEventListener("click", (e) => {
			e.preventDefault(); // Prevent default behavior
			if (darkModeToggle.classList.contains("disabled")) return;

			const isDark = darkModeToggle.classList.toggle("active");
			savePreference("darkMode", isDark ? "on" : "off").then((success) => {
				if (!success) {
					// Revert the toggle state if saving fails
					darkModeToggle.classList.toggle("active", !isDark);
				} else {
					applyDarkMode(isDark);
				}
			});
		});

		autoDarkModeToggle.addEventListener("click", (e) => {
			e.preventDefault(); // Prevent default behavior
			const isAuto = autoDarkModeToggle.classList.toggle("active");
			savePreference("autoDarkMode", isAuto ? "on" : "off").then((success) => {
				if (!success) {
					// Revert the toggle state if saving fails
					autoDarkModeToggle.classList.toggle("active", !isAuto);
				} else {
					applyAutoDarkMode(isAuto);

					// Enable or disable dark mode toggle based on auto dark mode state
					if (isAuto) {
						const systemDark = window.matchMedia(
							"(prefers-color-scheme: dark)"
						).matches;
						darkModeToggle.disabled = true;
						darkModeToggle.classList.add("disabled");
						darkModeToggle.setAttribute("aria-disabled", "true");

						// Update dark mode state to match system preference
						darkModeToggle.classList.toggle("active", systemDark);
						applyDarkMode(systemDark);
					} else {
						darkModeToggle.disabled = false;
						darkModeToggle.classList.remove("disabled");
						darkModeToggle.removeAttribute("aria-disabled");

						// Update dark mode toggle to reflect its current state
						getPreference("darkMode").then((resolvedDarkMode) => {
							const isDark = resolvedDarkMode === "on";
							darkModeToggle.classList.toggle("active", isDark);
							applyDarkMode(isDark);
						});
					}
				}
			});
		});

		listenersAdded = true; // Mark listeners as added
	}
}

window.addEventListener("preAuthChecked", () => {
	const darkMode = createAndLoadPreference(
		"darkMode",
		getCookie("darkMode") || "off"
	);
	const autoDarkMode = createAndLoadPreference(
		"autoDarkMode",
		getCookie("autoDarkMode") || "off"
	);
	Promise.all([darkMode, autoDarkMode]).then(
		([resolvedDarkMode, resolvedAutoDarkMode]) => {
			window.dispatchEvent(triggerDarkModeEvent);
			if (window.location.pathname === "/preferences.html") {
				initPreferencesPage(resolvedDarkMode, resolvedAutoDarkMode);
			}
		}
	);
});

//Returns the value for a given preference key, or creates it with a default value if it doesn't exist
//Returns null if the user is not logged in.
async function createAndLoadPreference(key, default_value) {
	const token = sessionStorage.getItem("jwt");
	if (!token) {
		return Promise.resolve(default_value);
	}
	showLoading();
	try {
		const value = await getPreference(key);
		if (value !== null && value !== undefined) {
			return value;
		}
		// Preference does not exist, create it
		await fetch(`${URL_BASE}/api/user/create-preference`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			credentials: "include",
			body: JSON.stringify({
				preference_key: key,
				preference_value: default_value,
			}),
		});
		return default_value;
	} catch (err) {
		console.error("Error loading or creating preference:", err);
		return default_value;
	} finally {
		hideLoading();
	}
}

function savePreference(key, value) {
	const token = sessionStorage.getItem("jwt");
	if (!token) {
		return Promise.resolve(false);
	}
	showLoading();
	return fetch(`${URL_BASE}/api/user/edit-user-preference`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		credentials: "include",
		body: JSON.stringify({
			preference_key: key,
			preference_value: value,
		}),
	})
		.then((response) => {
			if (response.ok) {
				return true;
			} else {
				return false;
			}
		})
		.catch((err) => {
			console.error("Error saving preference:", err);
			return false;
		})
		.finally(() => {
			hideLoading();
		});
}

function deletePreference(key) {
	const token = sessionStorage.getItem("jwt");
	if (!token) {
		return Promise.resolve(false);
	}
	showLoading();
	return fetch(`${URL_BASE}/api/user/delete-preference`, {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		credentials: "include",
		body: JSON.stringify({
			preference_key: key,
		}),
	})
		.then((response) => response.ok)
		.catch((err) => {
			console.error("Error deleting preference:", err);
			return false;
		})
		.finally(() => {
			hideLoading();
		});
}

function getPreference(key) {
	const token = sessionStorage.getItem("jwt");
	if (!token) {
		return Promise.resolve(null);
	}
	showLoading();
	// Add a cache-busting query parameter to the URL
	const cacheBuster = `&_=${Date.now()}`;
	return fetch(
		`${URL_BASE}/api/user/get-preference?preference_key=${encodeURIComponent(
			key
		)}${cacheBuster}`,
		{
			method: "GET",
			credentials: "include",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	)
		.then((response) => {
			if (response.ok) {
				return response.json().then((data) => data.preference_value);
			} else {
				return null;
			}
		})
		.catch((err) => {
			console.error("Error getting preference:", err);
			return null;
		})
		.finally(() => {
			hideLoading();
		});
}

function getPreferences() {
	const token = sessionStorage.getItem("jwt");
	if (!token) {
		return Promise.resolve([]);
	}
	showLoading();
	return fetch(`${URL_BASE}/api/user/preferences`, {
		method: "GET",
		credentials: "include",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
		.then((response) => {
			if (response.ok) {
				return response.json().then((data) => data.preferences);
			} else {
				return [];
			}
		})
		.catch((err) => {
			console.error("Error getting preferences:", err);
			return [];
		})
		.finally(() => {
			hideLoading();
		});
}
