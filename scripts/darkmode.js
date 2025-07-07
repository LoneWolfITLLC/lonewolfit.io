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

function toggleDarkMode() {
  const body = document.body;
  const isDark = body.classList.toggle("dark-mode");
  setCookie("darkMode", isDark ? "on" : "off", 365);
  const toggleButton = document.getElementById("darkModeToggle");
  if (!toggleButton) return;
  toggleButton.classList.toggle("active", isDark);
}

let autoDarkModeInterval = null;

function startAutoDarkModeWatcher() {
  if (autoDarkModeInterval) return; // Don't start multiple intervals
  autoDarkModeInterval = setInterval(() => {
    // If auto mode is OFF, stop the watcher and return
    if (getCookie("autoDarkMode") !== "on") {
      stopAutoDarkModeWatcher();
      return;
    }
    const autoToggle = document.getElementById("autoDarkModeToggle");
    const toggleButton = document.getElementById("darkModeToggle");
    if (
      autoToggle &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      document.body.classList.add("dark-mode");
      if (toggleButton) {
        toggleButton.classList.add("active");
        toggleButton.classList.add("disabled");
        toggleButton.disabled = true;
        toggleButton.setAttribute("aria-disabled", "true");
      }
    } else if (
      autoToggle &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches
    ) {
      document.body.classList.remove("dark-mode");
      if (toggleButton) {
        toggleButton.classList.remove("active");
        toggleButton.classList.add("disabled");
        toggleButton.disabled = true;
        toggleButton.setAttribute("aria-disabled", "true");
      }
    }
  }, 100);
}

function stopAutoDarkModeWatcher() {
  if (autoDarkModeInterval) {
    clearInterval(autoDarkModeInterval);
    autoDarkModeInterval = null;
  }
}

function toggleAutoDarkMode() {
  const autoToggle = document.getElementById("autoDarkModeToggle");
  const toggleButton = document.getElementById("darkModeToggle");
  if (!toggleButton || !autoToggle) return;
  const isAuto = autoToggle.classList.toggle("active");
  setCookie("autoDarkMode", isAuto ? "on" : "off", 365);

  if (isAuto) {
    // Set initial state based on system preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      document.body.classList.add("dark-mode");
      setCookie("darkMode", "on", 365);
      toggleButton.classList.toggle("active", true);
    } else {
      document.body.classList.remove("dark-mode");
      setCookie("darkMode", "off", 365);
      toggleButton.classList.toggle("active", false);
    }
    startAutoDarkModeWatcher();
  } else {
    document.body.classList.remove("dark-mode");
    setCookie("darkMode", "off", 365);
    toggleButton.classList.toggle("active", false);
    stopAutoDarkModeWatcher();
  }

  toggleButton.disabled = isAuto;
  toggleButton.setAttribute("aria-disabled", isAuto);
  toggleButton.classList.toggle("disabled", isAuto);

  if (autoToggle) {
    autoToggle.classList.toggle("active", isAuto);
  }
}

// Optional: Apply dark mode on page load based on cookie
document.addEventListener("DOMContentLoaded", () => {
    const autoToggle = document.getElementById("autoDarkModeToggle");
    const toggleButton = document.getElementById("darkModeToggle");

    // Set initial disabled state and .disabled class on load
    const isAuto = getCookie("autoDarkMode") === "on";
    if (toggleButton) {
        toggleButton.disabled = isAuto;
        toggleButton.setAttribute("aria-disabled", isAuto);
        toggleButton.classList.toggle("disabled", isAuto); // <-- Add or remove .disabled class
    }
    if (toggleButton) {
        toggleButton.addEventListener("click", toggleDarkMode);
    }
    if (autoToggle) {
        autoToggle.addEventListener("click", toggleAutoDarkMode);
    }
    if (isAuto) {
        if (autoToggle) autoToggle.classList.add("active");
        startAutoDarkModeWatcher();
    } else {
        stopAutoDarkModeWatcher();
    }
    // Set isDark based on system preference and cookie
    let isDark =
        document.body.classList.contains("dark-mode") ||
        (isAuto &&
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (getCookie("darkMode") === "on" || isDark) {
        document.body.classList.add("dark-mode");
        if (toggleButton) {
            toggleButton.classList.toggle("active", true);
        }
    }
});
