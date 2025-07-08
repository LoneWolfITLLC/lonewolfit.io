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

function initPreferencesPage(darkMode, autoDarkMode, logoGlow, titleTextGlow) {
  const darkModeToggle = document.getElementById("darkModePref");
  const autoDarkModeToggle = document.getElementById("autoDarkModePref");
  const logoGlowToggle = document.getElementById("logoGlowPref");
  const titleTextGlowToggle = document.getElementById("titleTextGlowPref");

  if (
    !darkModeToggle ||
    !autoDarkModeToggle ||
    !logoGlowToggle ||
    !titleTextGlowToggle
  )
    return;

  // Initialize toggle states
  darkModeToggle.classList.toggle("active", darkMode === "on");
  autoDarkModeToggle.classList.toggle("active", autoDarkMode === "on");
  logoGlowToggle.classList.toggle("active", logoGlow === "on");
  titleTextGlowToggle.classList.toggle("active", titleTextGlow === "on");

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

    listenersAddedPreferences = true; // Mark listeners as added
  }
}

function applyLogoGlow(isLogoGlow) {
  const header__logo = document.querySelector(".header__logo"); // Adjust selector to your logo element
  if (header__logo) {
    if (isLogoGlow && document.body.classList.contains("dark-mode")) {
      // Add glow effect using animation: logo-glow-small 5s ease-in-out infinite alternate
      header__logo.style.animation =
        "logo-glow-small 5s ease-in-out infinite alternate";
    } else {
      header__logo.style.animation = "none"; // Remove glow effect
    }
  }

  const main__logo = document.querySelector(".main__logo"); // Adjust selector to your main logo element
  if (main__logo) {
    if (isLogoGlow && document.body.classList.contains("dark-mode")) {
      // Add glow effect using animation: logo-glow-small 5s ease-in-out infinite alternate
      main__logo.style.animation =
        "logo-glow-idle 5s ease-in-out infinite alternate";
      main__logo.style.transition = "animation 0.3s cubic-bezier(0.4,0,0.2,1)";
      //enable the hover class
      main__logo.classList.add("hoverable");
    } else {
      main__logo.style.animation = "none"; // Remove glow effect
      main__logo.style.transition = "none"; // Remove transition
      //disable the hover class
      main__logo.classList.remove("hoverable");
    }
  }
}

function applyTitleTextGlow(isTitleTextGlow) {
  const titleText = document.querySelector(".header__title"); // Adjust selector to your title text element
  if (titleText) {
    if (isTitleTextGlow) {
      // Add glow effect using text-shadow: 3px 0px 15px #00ffff;
      const isDark = document.body.classList.contains("dark-mode");
      const shadow = isDark
        ? "3px 0px 15px #00ffff"
        : "0 0 8px #00ffff, 0 0 16px #00ffff, 0 0 24px #031E3C";
      titleText.style.textShadow = shadow;
    } else {
      titleText.style.textShadow = "none"; // Remove glow effect
    }
  }

  const mainSectionHeaders = document.querySelectorAll(".main__heading"); // Adjust selector to your main section headers
  mainSectionHeaders.forEach((header) => {
    if (header) {
      if (isTitleTextGlow) {
        // Add glow effect using text-shadow: 3px 0px 15px #00ffff;
        // Set text shadow color based on current theme (dark or light)
        const isDark = document.body.classList.contains("dark-mode");
        const shadow = isDark
          ? "3px 0px 15px #00ffff"
          : "0 0 8px #00ffff, 0 0 16px #00ffff, 0 0 24px #031E3C";
        header.style.textShadow = shadow;
      } else {
        header.style.textShadow = "none"; // Remove glow effect
      }
    }
  });
}
let applyPreferencesEvent = null;
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
  Promise.all([darkMode, autoDarkMode, logoGlow, titleTextGlow]).then(
    ([
      resolvedDarkMode,
      resolvedAutoDarkMode,
      resolvedLogoGlow,
      resolvedTitleTextGlow,
    ]) => {
      window.dispatchEvent(triggerDarkModeEvent);

      // Only initialize preferences page logic if on preferences.html
      if (window.location.pathname === "/preferences.html") {
        initPreferencesPage(
          resolvedDarkMode,
          resolvedAutoDarkMode,
          resolvedLogoGlow,
          resolvedTitleTextGlow
        );
      }

      //Create a window event to apply the preferences
      //ADD each preference to the event detail TODO
      applyPreferencesEvent = new CustomEvent("applyPreferences", {
        detail: {
          darkMode: resolvedDarkMode,
          autoDarkMode: resolvedAutoDarkMode,
          logoGlow: resolvedLogoGlow,
          titleTextGlow: resolvedTitleTextGlow
        }
      });
    }
  );
});

window.addEventListener("authChecked", () => {
  // Wait until applyPreferencesEvent exists, then dispatch it
  function tryDispatchApplyPreferencesEvent(retries = 10) {
    if (applyPreferencesEvent) {
      window.dispatchEvent(applyPreferencesEvent);
    } else if (retries > 0) {
      setTimeout(() => tryDispatchApplyPreferencesEvent(retries - 1), 100);
    }
  }
  tryDispatchApplyPreferencesEvent();
});

window.addEventListener("applyPreferences", (event) => {
  const { darkMode, logoGlow, titleTextGlow } = event.detail;
  //TODO apply preferences to the page... RUNS EXACTLY ONCE
  applyLogoGlow(logoGlow === "on" && darkMode === "on");
  applyTitleTextGlow(titleTextGlow === "on");
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
      alert(
        "An error occurred while saving your preference. Please try again later and check your connection."
      );
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
