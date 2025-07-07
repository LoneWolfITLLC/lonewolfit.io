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

function initPreferencesPage(darkMode, autoDarkMode) {
    const darkModeToggle = document.getElementById("darkModePref");
    const autoDarkModeToggle = document.getElementById("autoDarkModePref");
	darkModeToggle.classList.toggle("active", darkMode === "on");
	autoDarkModeToggle.classList.toggle("active", autoDarkMode === "on");
    if (autoDarkMode === "on") {
        darkModeToggle.disabled = true;
        darkModeToggle.classList.add("disabled");
        darkModeToggle.setAttribute("aria-disabled", "true");
    }
    darkModeToggle.addEventListener("click", toggleDarkMode);
    darkModeToggle.addEventListener("click", () => {
        const isDark = darkModeToggle.classList.contains("active");
        savePreference("darkMode", isDark ? "on" : "off").then((success) => {
            if (!success) {
                toggleDarkMode.call(darkModeToggle);
            }
        });
    });
    autoDarkModeToggle.addEventListener("click", toggleAutoDarkMode);
    autoDarkModeToggle.addEventListener("click", () => {
        const isAuto = autoDarkModeToggle.classList.contains("active");
        savePreference("autoDarkMode", isAuto ? "on" : "off").then((success) => {
            if (!success) {
                toggleAutoDarkMode.call(autoDarkModeToggle);
            }
        });
    });
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
    Promise.all([darkMode, autoDarkMode]).then(([resolvedDarkMode, resolvedAutoDarkMode]) => {
        window.dispatchEvent(triggerDarkModeEvent);
        if (window.location.pathname === "/preferences.html") {
            initPreferencesPage(resolvedDarkMode, resolvedAutoDarkMode);
        }
    });
});

//Returns the value for a given preference key, or creates it with a default value if it doesn't exist
//Returns null if the user is not logged in.
function createAndLoadPreference(key, default_value) {
	if (!loggedIn) return Promise.resolve(default_value);
	const token = sessionStorage.getItem("jwt");
	if (!token) {
		return Promise.resolve(default_value);
	}
	showLoading();
	return fetch(
		`${URL_BASE}/api/user/get-preference?preference_key=${encodeURIComponent(
			key
		)}`,
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
				return response
					.json()
					.then((data) => data.preference_value ?? default_value);
			} else if (response.status === 404) {
				// Preference does not exist, create it
				return fetch(`${URL_BASE}/api/user/create-preference`, {
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
				}).then((createResponse) => {
					if (createResponse.ok) {
						return createResponse
							.json()
							.then((data) => data.preference_value ?? default_value);
					} else {
						return default_value;
					}
				});
			} else {
				return default_value;
			}
		})
		.catch((err) => {
			console.error("Error loading or creating preference:", err);
			return default_value;
		})
		.finally(() => {
			hideLoading();
		});
}

function savePreference(key, value) {
	if (!loggedIn) return Promise.resolve(false);
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
	if (!loggedIn) return Promise.resolve(false);
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
	if (!loggedIn) return Promise.resolve(null);
	const token = sessionStorage.getItem("jwt");
	if (!token) {
		return Promise.resolve(null);
	}
	showLoading();
	return fetch(
		`${URL_BASE}/api/user/get-preference?preference_key=${encodeURIComponent(
			key
		)}`,
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
	if (!loggedIn) return Promise.resolve([]);
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
