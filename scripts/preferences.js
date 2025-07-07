let usingPreferences = true; // THIS WILL ALWAYS BE TRUE -- USE TO CHECK TO SEE IF SCRIPT IS LOADED

window.addEventListener("authChecked", () => {
	if (window.location.pathname === "/preferences.html") {
		initPreferencesPage();
	}
	window.dispatchEvent(triggerDarkModeEvent);
});

function initPreferencesPage() {}

//Returns the value for a given preference key, or creates it with a default value if it doesn't exist
//Returns null if the user is not logged in.
function createAndLoadPreference(key, default_value) {
	if (!loggedIn) return null; // If not logged in, return null
	const token = sessionStorage.getItem("jwt");
	if (!token) {
		return null;
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
		.then(async (response) => {
			if (response.status === 200) {
				const data = await response.json();
				return data.preference_value;
			} else if (response.status === 404) {
				// Preference does not exist or unauthorized, create it
				return fetch(`${URL_BASE}/api/user/create-preference`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
					body: JSON.stringify({
						preference_key: key,
						preference_value: default_value,
					}),
				}).then(() => default_value);
			}
		})
		.catch((err) => {
			console.error("Error loading or creating preference:", err);
		})
		.finally(() => {
			hideLoading();
		});
}

function savePreference(key, value) {
	if (!loggedIn) return false;
	const token = sessionStorage.getItem("jwt");
	if (!token) {
		return false;
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
	if (!loggedIn) return false;
	const token = sessionStorage.getItem("jwt");
	if (!token) {
		return false;
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
		.then((response) => {
			if (response.ok) {
				return true;
			} else {
				return false;
			}
		})
		.catch((err) => {
			console.error("Error deleting preference:", err);
			return false;
		})
		.finally(() => {
			hideLoading();
		});
}

function getPreference(key) {
	if (!loggedIn) return null;
	const token = sessionStorage.getItem("jwt");
	if (!token) {
		return false;
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
		.then(async (response) => {
			if (response.status === 200) {
				const data = await response.json();
				return data.preference_value;
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
	if (!loggedIn) return [];
	const token = sessionStorage.getItem("jwt");
	if (!token) {
		return false;
	}
	showLoading();
	return fetch(`${URL_BASE}/api/user/preferences`, {
		method: "GET",
		credentials: "include",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
		.then(async (response) => {
			if (response.ok) {
				const data = await response.json();
				return data.preferences;
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
