let usingPreferences = true; // THIS WILL ALWAYS BE TRUE -- USE TO CHECK TO SEE IF SCRIPT IS LOADED

window.addEventListener("authChecked", () => {
    if(window.location.pathname === "/preferences.html") {
        
    }
});

//Returns the value for a given preference key, or creates it with a default value if it doesn't exist
function createAndLoadPreference(key, default_value) {
	showLoading();
	return fetch(
		`${API_BASE}/api/user/get-preference?preference_key=${encodeURIComponent(
			key
		)}`,
		{
			method: "GET",
			credentials: "include",
		}
	)
		.then(async (response) => {
			if (response.status === 200) {
				const data = await response.json();
				return data.preference_value;
			} else if (response.status === 404) {
				// Preference does not exist or unauthorized, create it
				return fetch(`${API_BASE}/api/user/create-preference`, {
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
	showLoading();
	return fetch(`${API_BASE}/api/user/edit-user-preference`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
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
	showLoading();
	return fetch(`${API_BASE}/api/user/delete-preference`, {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
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
    showLoading();
    return fetch(
        `${API_BASE}/api/user/get-preference?preference_key=${encodeURIComponent(
            key
        )}`,
        {
            method: "GET",
            credentials: "include",
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
    showLoading();
    return fetch(`${API_BASE}/api/user/preferences`, {
        method: "GET",
        credentials: "include",
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