function toggleDarkMode() {
	const toggleButton = this;
	if(toggleButton.classList.contains("disabled")) {
		return;
	}	
	const body = document.body;
	const isDark = body.classList.toggle("dark-mode");
	setCookie("darkMode", isDark ? "on" : "off", 365);
	if (!toggleButton) return;
	toggleButton.classList.toggle("active", isDark);
}

function applyDarkMode(isDark, darkModeToggleStr = "darkModeToggle") {
	const body = document.body;
	const toggleButton = document.getElementById(darkModeToggleStr);

	if (isDark) {
		body.classList.add("dark-mode");
		if (toggleButton) toggleButton.classList.add("active");
	} else {
		body.classList.remove("dark-mode");
		if (toggleButton) toggleButton.classList.remove("active");
	}
}

function applyAutoDarkMode(isAuto, darkModeToggleStr = "darkModeToggle", autoToggleStr = "autoDarkModeToggle") {
	const autoToggle = document.getElementById(autoToggleStr);
	const toggleButton = document.getElementById(darkModeToggleStr);

	if (isAuto) {
		const systemDark = window.matchMedia(
			"(prefers-color-scheme: dark)"
		).matches;
		applyDarkMode(systemDark);

		if (toggleButton) {
			toggleButton.disabled = true;
			toggleButton.setAttribute("aria-disabled", "true");
			toggleButton.classList.add("disabled");
		}
		if (autoToggle) autoToggle.classList.add("active");
	} else {
		const darkMode = getCookie("darkMode") === "on";
		applyDarkMode(darkMode);

		if (toggleButton) {
			toggleButton.disabled = false;
			toggleButton.setAttribute("aria-disabled", "false");
			toggleButton.classList.remove("disabled");
		}
		if (autoToggle) autoToggle.classList.remove("active");
	}
}

function toggleAutoDarkMode() {
	const autoToggle = this;
	const isAuto = autoToggle.classList.toggle("active");
	setCookie("autoDarkMode", isAuto ? "on" : "off", 365);

	applyAutoDarkMode(isAuto);
}

window.addEventListener("triggerDarkMode", () => {
	Promise.all([getPreference("autoDarkMode"), getPreference("darkMode")]).then(
		([prefAutoDarkMode, prefDarkMode]) => {
			if (prefAutoDarkMode !== null || prefDarkMode !== null) {
				syncCookie("autoDarkMode", prefAutoDarkMode);
				syncCookie("darkMode", prefDarkMode);

				const isAuto = prefAutoDarkMode === "on";
				applyAutoDarkMode(isAuto);

				if (!isAuto) {
					const isDark = prefDarkMode === "on";
					applyDarkMode(isDark);
				}

				// Disable the autoDarkMode toggle if the user is signed in
				const autoToggle = document.getElementById("autoDarkModeToggle");
				if (autoToggle && loggedIn) {
					autoToggle.disabled = true;
					autoToggle.setAttribute("aria-disabled", "true");
					autoToggle.classList.add("disabled");
				}

				// Add event listeners for the toggles if they exist
				const darkModeToggle = document.getElementById("darkModeToggle");
				if (darkModeToggle) {
					darkModeToggle.addEventListener("click", toggleDarkMode);
				}
				if (autoToggle) {
					autoToggle.addEventListener("click", toggleAutoDarkMode);
				}
			} else if (prefAutoDarkMode === null && prefDarkMode === null) {
				// Disable the autoDarkMode toggle if the user is signed in
				const autoToggle = document.getElementById("autoDarkModeToggle");
				if (autoToggle && loggedIn) {
					autoToggle.disabled = true;
					autoToggle.setAttribute("aria-disabled", "true");
					autoToggle.classList.add("disabled");
				}

				// Add event listeners for the toggles if they exist
				const darkModeToggle = document.getElementById("darkModeToggle");
				if (darkModeToggle) {
					darkModeToggle.addEventListener("click", toggleDarkMode);
				}
				if (autoToggle) {
					autoToggle.addEventListener("click", toggleAutoDarkMode);
				}
				// If preferences are not set, initialize them
				applyAutoDarkMode(getCookie("autoDarkMode") === "on");
			}
		}
	);
});

// Listen for system dark mode changes
window
	.matchMedia("(prefers-color-scheme: dark)")
	.addEventListener("change", (e) => {
		const isAuto = getCookie("autoDarkMode") === "on";
		if (isAuto) {
			applyDarkMode(e.matches);
		}
	});
