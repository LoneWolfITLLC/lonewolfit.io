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

// Prevent duplicate event listeners
let listenersAddedPreferences = false;

function initPreferencesPage(darkMode, autoDarkMode, logoGlow, titleTextGlow, buttonGlow, modalGlow) {
	const darkModeToggle = document.getElementById("darkModePref");
	const autoDarkModeToggle = document.getElementById("autoDarkModePref");
	const logoGlowToggle = document.getElementById("logoGlowPref");
	const titleTextGlowToggle = document.getElementById("titleTextGlowPref");
	const buttonGlowToggle = document.getElementById("buttonGlowPref");
	const modalGlowToggle = document.getElementById("modalGlowPref");

	if (
		!darkModeToggle ||
		!autoDarkModeToggle ||
		!logoGlowToggle ||
		!titleTextGlowToggle || 
		!buttonGlowToggle ||
		!modalGlowToggle
	)
		return;

	// Initialize toggle states
	darkModeToggle.classList.toggle("active", darkMode === "on");
	autoDarkModeToggle.classList.toggle("active", autoDarkMode === "on");
	logoGlowToggle.classList.toggle("active", logoGlow === "on");
	titleTextGlowToggle.classList.toggle("active", titleTextGlow === "on");
	buttonGlowToggle.classList.toggle("active", buttonGlow === "on");
	modalGlowToggle.classList.toggle("active", modalGlow === "on");

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
	if (!listenersAddedPreferences) {
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

		// MAKE SURE THIS IS SEPARATE FROM autoDarkModeToggle AND FINISH IT
		logoGlowToggle.addEventListener("click", (e) => {
			e.preventDefault(); // Prevent default behavior
			const isLogoGlow = logoGlowToggle.classList.toggle("active");
			savePreference("logoGlow", isLogoGlow ? "on" : "off").then((success) => {
				if (!success) {
					// Revert the toggle state if saving fails
					logoGlowToggle.classList.toggle("active", !isLogoGlow);
				} else {
					// Optionally, apply logo glow effect here if needed
					if (typeof applyLogoGlow === "function") {
						applyLogoGlow(isLogoGlow);
					}
				}
			});
		});

		titleTextGlowToggle.addEventListener("click", (e) => {
			e.preventDefault(); // Prevent default behavior
			const isTitleTextGlow = titleTextGlowToggle.classList.toggle("active");
			savePreference("titleTextGlow", isTitleTextGlow ? "on" : "off").then(
				(success) => {
					if (!success) {
						// Revert the toggle state if saving fails
						titleTextGlowToggle.classList.toggle("active", !isTitleTextGlow);
					} else {
						// Optionally, apply title text glow effect here if needed
						if (typeof applyTitleTextGlow === "function") {
							applyTitleTextGlow(isTitleTextGlow);
						}
					}
				}
			);
		});

		buttonGlowToggle.addEventListener("click", (e) => {
			e.preventDefault(); // Prevent default behavior
			const isButtonGlow = buttonGlowToggle.classList.toggle("active");
			savePreference("buttonGlow", isButtonGlow ? "on" : "off").then((success) => {
				if (!success) {
					// Revert the toggle state if saving fails
					buttonGlowToggle.classList.toggle("active", !isButtonGlow);
				} else {
					// Optionally, apply button glow effect here if needed
					if (typeof applyButtonGlow === "function") {
						applyButtonGlow(darkMode, isButtonGlow);
					}
				}
			});
		});

		modalGlowToggle.addEventListener("click", (e) => {
			e.preventDefault(); // Prevent default behavior
			const isModalGlow = modalGlowToggle.classList.toggle("active");
			savePreference("modalGlow", isModalGlow ? "on" : "off").then((success) => {
				if (!success) {
					// Revert the toggle state if saving fails
					modalGlowToggle.classList.toggle("active", !isModalGlow);
				} else {
					// Optionally, apply modal glow effect here if needed
					if (typeof applyModalGlow === "function") {
						applyModalGlow(darkMode, isModalGlow);
					}
				}
			});
		});

		listenersAddedPreferences = true; // Mark listeners as added
	}
}

function applyLogoGlow(isLogoGlow) {
	const header__logo = document.querySelector(".header__logo");
	const main__logo = document.querySelector(".main__logo");

	if (header__logo) {
		if (isLogoGlow) {
			header__logo.classList.remove("header__logo--no-glow");
		} else {
			header__logo.classList.add("header__logo--no-glow");
		}
	}

	if (main__logo) {
		if (isLogoGlow) {
			// Remove the BEM hoverable class to allow native :hover to work
			main__logo.classList.remove("main__logo--no-glow");
		} else {
			main__logo.classList.add("main__logo--no-glow");
		}
	}
}

function applyTitleTextGlow(isTitleTextGlow) {
	const titleText = document.querySelector(".header__title");
	const mainSectionHeaders = document.querySelectorAll(".main__heading");

	if (titleText) {
		if (isTitleTextGlow) {
			titleText.classList.remove("header__title--no-glow");
		} else {
			titleText.classList.add("header__title--no-glow");
		}
	}

	mainSectionHeaders.forEach((header) => {
		if (isTitleTextGlow) {
			header.classList.remove("main__heading--no-glow");
		} else {
			header.classList.add("main__heading--no-glow");
		}
	});
}

function applyModalGlow(darkMode, isModalGlow) {
	if(!darkMode || darkMode !== "on") {
		// If dark mode is off, we don't apply modal glow settings
		return;
	}

	const modals = document.querySelectorAll(".modal-content");
	modals.forEach((modal) => {
		if(modal.parentElement.id !== "loadingModal") {
			if (isModalGlow) {
				modal.classList.remove("modal--no-glow");
			} else {
				modal.classList.add("modal--no-glow");
			}
		}
	});
}

//TODO Apply each preference to the page
function applyPreferences({ darkMode, logoGlow, titleTextGlow, buttonGlow, modalGlow }) {
	// Only apply logo glow if logoGlow is "on"
	applyLogoGlow(logoGlow === "on");
	applyTitleTextGlow(titleTextGlow === "on");
	applyButtonGlow(darkMode, buttonGlow === "on");
	applyModalGlow(darkMode, modalGlow === "on");
}

function applyButtonGlow(darkMode, isButtonGlow) {
	const menu_sliders = document.querySelectorAll(".menu__item-slider");
	if (menu_sliders) {
		menu_sliders.forEach((menu_slider) => {
			if (isButtonGlow) {
				menu_slider.classList.remove("menu__item-slider--no-glow");
			} else {
				menu_slider.classList.add("menu__item-slider--no-glow");
			}
		});
	}
	if(!darkMode || darkMode !== "on") {
		// If dark mode is off, we don't apply button glow settings
		return;
	}
	const buttons = document.querySelectorAll(".btn");
	buttons.forEach((button) => {
		if (isButtonGlow) {
			button.classList.remove("btn--no-glow");
		} else {
			button.classList.add("btn--no-glow");
		}
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
	const logoGlow = createAndLoadPreference("logoGlow", "on");
	const titleTextGlow = createAndLoadPreference("titleTextGlow", "on");
	const buttonGlow = createAndLoadPreference("buttonGlow", "on");
	const modalGlow = createAndLoadPreference("modalGlow", "on");
	Promise.all([darkMode, autoDarkMode, logoGlow, titleTextGlow, buttonGlow, modalGlow]).then(
		([
			resolvedDarkMode,
			resolvedAutoDarkMode,
			resolvedLogoGlow,
			resolvedTitleTextGlow,
			resolvedButtonGlow,
			resolvedModalGlow
		]) => {
			window.dispatchEvent(triggerDarkModeEvent);

			// Only initialize preferences page logic if on preferences.html
			if (window.location.pathname === "/preferences.html") {
				initPreferencesPage(
					resolvedDarkMode,
					resolvedAutoDarkMode,
					resolvedLogoGlow,
					resolvedTitleTextGlow,
					resolvedButtonGlow,
					resolvedModalGlow
				);
			}

			// Store preferences globally for later use
			window.userPreferences = {
				darkMode: resolvedDarkMode,
				logoGlow: resolvedLogoGlow,
				titleTextGlow: resolvedTitleTextGlow,
				buttonGlow: resolvedButtonGlow,
				modalGlow: resolvedModalGlow
			};

			// Ensure applyPreferences runs only after loggedIn is defined
			applyPreferences({
				darkMode: resolvedDarkMode,
				autoDarkMode: resolvedAutoDarkMode,
				logoGlow: resolvedLogoGlow,
				titleTextGlow: resolvedTitleTextGlow,
				buttonGlow: resolvedButtonGlow,
				modalGlow: resolvedModalGlow
			});

			// Only initialize preferences page logic if on preferences.html
			if (window.location.pathname === "/preferences.html") {
				initPreferencesPage(
					resolvedDarkMode,
					resolvedAutoDarkMode,
					resolvedLogoGlow,
					resolvedTitleTextGlow,
					resolvedButtonGlow,
					resolvedModalGlow
				);
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
			if (isDefined(alertModal) && typeof alertModal === "function") {
				alertModal(
					"An error occurred while saving your preference: " + err.message ||
						"Please try again later and check your connection."
				);
			} else {
				alert(
					"An error occurred while saving your preference: " + err.message ||
						"Please try again later and check your connection."
				);
			}
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
			if (isDefined(alertModal) && typeof alertModal === "function") {
				alertModal(
					"An error occurred while deleting your preference: " + err.message ||
						"Please try again later and check your connection."
				);
			} else {
				alert(
					"An error occurred while deleting your preference: " + err.message ||
						"Please try again later and check your connection."
				);
			}
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
	// showLoading();
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
