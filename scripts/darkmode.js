function toggleDarkMode() {
	const toggleButton = this;
	if (toggleButton.classList.contains("disabled")) {
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

function applyAutoDarkMode(
	isAuto,
	darkModeToggleStr = "darkModeToggle",
	autoToggleStr = "autoDarkModeToggle"
) {
	// Removed all references to autoToggle and toggleButton except for "this" usage
	if (isAuto) {
		const systemDark = window.matchMedia(
			"(prefers-color-scheme: dark)"
		).matches;
		applyDarkMode(systemDark);
	} else {
		const darkMode = getCookie("darkMode") === "on";
		applyDarkMode(darkMode);
	}
}

function toggleAutoDarkMode() {
	const autoToggle = this;
	const isAuto = autoToggle.classList.toggle("active");
	setCookie("autoDarkMode", isAuto ? "on" : "off", 365);

	applyAutoDarkMode(isAuto);
}

const darkMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

function handleSystemDarkModeChange(e) {
	const isAuto = getCookie("autoDarkMode") === "on";
	if (isAuto) {
		applyDarkMode(e.matches);
	}
}

// Modern browsers -- THIS WILL SUFFICE FOR NOW, STILL ONLY RUNS ONCE!!!! THIS IS A BUG WITH THE MEDIA QUERY LISTENER
if (typeof darkMediaQuery.addEventListener === "function") {
	darkMediaQuery.addEventListener("change", handleSystemDarkModeChange);
} else if (typeof darkMediaQuery.addListener === "function") {
	// Older browsers
	darkMediaQuery.addListener(handleSystemDarkModeChange);
}

window.addEventListener("triggerDarkMode", () => {
	Promise.all([getPreference("autoDarkMode"), getPreference("darkMode")]).then(
		([prefAutoDarkMode, prefDarkMode]) => {
			let autoDarkModeValue = prefAutoDarkMode;
			// If the preference is not set, default to "on" and set the cookie
			if (
				autoDarkModeValue === null ||
				typeof autoDarkModeValue === "undefined"
			) {
				autoDarkModeValue = "on";
				setCookie("autoDarkMode", "on", 365);
			}
			const isAuto = autoDarkModeValue === "on";
			applyAutoDarkMode(isAuto);

			if (!isAuto) {
				const isDark = prefDarkMode === "on";
				applyDarkMode(isDark);
			}
		}
	);
});
