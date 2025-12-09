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

function initPreferencesPage(
  darkMode,
  autoDarkMode,
  buttonGlow,
  modalGlow,
  formGlow,
  blur
) {
  const darkModeToggle = document.getElementById("darkModePref");
  const autoDarkModeToggle = document.getElementById("autoDarkModePref");
  const buttonGlowToggle = document.getElementById("buttonGlowPref");
  const modalGlowToggle = document.getElementById("modalGlowPref");
  const formGlowToggle = document.getElementById("formGlowPref");
  const blurToggle = document.getElementById("blurPref");

  if (
    !darkModeToggle ||
    !autoDarkModeToggle ||
    !buttonGlowToggle ||
    !modalGlowToggle ||
    !formGlowToggle ||
    !blurToggle
  )
    return;

  // Initialize toggle states
  darkModeToggle.classList.toggle("active", darkMode === "on");
  autoDarkModeToggle.classList.toggle("active", autoDarkMode === "on");
  buttonGlowToggle.classList.toggle("active", buttonGlow === "on");
  modalGlowToggle.classList.toggle("active", modalGlow === "on");
  formGlowToggle.classList.toggle("active", formGlow === "on");
  blurToggle.classList.toggle("active", blur === "on");

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

    buttonGlowToggle.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent default behavior
      const isButtonGlow = buttonGlowToggle.classList.toggle("active");
      savePreference("buttonGlow", isButtonGlow ? "on" : "off").then(
        (success) => {
          if (!success) {
            // Revert the toggle state if saving fails
            buttonGlowToggle.classList.toggle("active", !isButtonGlow);
          } else {
            // Optionally, apply button glow effect here if needed
            if (typeof applyButtonGlow === "function") {
              applyButtonGlow(isButtonGlow);
            }
          }
        }
      );
    });

    modalGlowToggle.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent default behavior
      const isModalGlow = modalGlowToggle.classList.toggle("active");
      savePreference("modalGlow", isModalGlow ? "on" : "off").then(
        (success) => {
          if (!success) {
            // Revert the toggle state if saving fails
            modalGlowToggle.classList.toggle("active", !isModalGlow);
          } else {
            // Optionally, apply modal glow effect here if needed
            if (typeof applyModalGlow === "function") {
              applyModalGlow(isModalGlow);
            }
          }
        }
      );
    });

    blurToggle.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent default behavior
      const isBlur = blurToggle.classList.toggle("active");
      savePreference("blur", isBlur ? "on" : "off").then((success) => {
        if (!success) {
          // Revert the toggle state if saving fails
          blurToggle.classList.toggle("active", !isBlur);
        } else {
          // Optionally, apply blur effect here if needed
          if (typeof applyBlur === "function") {
            applyBlur(isBlur);
          }
        }
      });
    });

    formGlowToggle.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent default behavior
      const isFormGlow = formGlowToggle.classList.toggle("active");
      savePreference("formGlow", isFormGlow ? "on" : "off").then((success) => {
        if (!success) {
          // Revert the toggle state if saving fails
          formGlowToggle.classList.toggle("active", !isFormGlow);
        } else {
          // Optionally, apply form glow effect here if needed
          if (typeof applyFormGlow === "function") {
            applyFormGlow(isFormGlow);
          }
        }
      });
    });

    listenersAddedPreferences = true; // Mark listeners as added
  }
}

function applyModalGlow(isModalGlow) {
  const modals = document.querySelectorAll(".modal-content");
  modals.forEach((modal) => {
    if (modal.parentElement.id !== "loadingModal") {
      if (isModalGlow) {
        modal.classList.remove("modal--no-glow");
      } else {
        modal.classList.add("modal--no-glow");
      }
    }
    else{
      modal.classList.add("modal--no-glow");
    }
  });
}

function applyBlur(isBlur) {
  const content = document.querySelectorAll(".modal");
  if (content) {
    content.forEach((modal) => {
      if (isBlur) {
        modal.classList.remove("modal--no-blur");
      } else {
        modal.classList.add("modal--no-blur");
      }
    });
  }
}
//TODO Apply each preference to the page
function applyPreferences({
  darkMode,
  autoDarkMode,
  buttonGlow,
  modalGlow,
  formGlow,
  blur
}) {
  applyButtonGlow(buttonGlow === "on");
  applyModalGlow(modalGlow === "on");
  applyFormGlow(formGlow === "on");
  applyBlur(blur === "on");
}

function applyButtonGlow(isButtonGlow) {
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
  const buttons = document.querySelectorAll(".btn");
  buttons.forEach((button) => {
    if (isButtonGlow) {
      button.classList.remove("btn--no-glow");
    } else {
      button.classList.add("btn--no-glow");
    }
  });
  const checkboxes = document.querySelectorAll(".form-check-input");
  checkboxes.forEach((checkbox) => {
    if (isButtonGlow) {
      checkbox.classList.remove("btn--no-glow");
    } else {
      checkbox.classList.add("btn--no-glow");
    }
  });
}
function applyFormGlow(isFormGlow) {
  const forms = document.querySelectorAll(".main__form");
  forms.forEach((form) => {
    if (isFormGlow) {
      form.classList.remove("main__form--no-glow");
    } else {
      form.classList.add("main__form--no-glow");
    }
  });
  const formControls = document.querySelectorAll(".form-control");
  formControls.forEach((control) => {
    if (isFormGlow) {
      control.classList.remove("form-control--no-glow");
    } else {
      control.classList.add("form-control--no-glow");
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
  const buttonGlow = createAndLoadPreference("buttonGlow", "on");
  const modalGlow = createAndLoadPreference("modalGlow", "on");
  const formGlow = createAndLoadPreference("formGlow", "on");
  const blur = createAndLoadPreference("blur", "on");
  Promise.all([
    darkMode,
    autoDarkMode,
    buttonGlow,
    modalGlow,
    formGlow,
    blur
  ]).then(
    ([
      resolvedDarkMode,
      resolvedAutoDarkMode,
      resolvedButtonGlow,
      resolvedModalGlow,
      resolvedFormGlow,
      resolvedBlur,
    ]) => {
      window.dispatchEvent(triggerDarkModeEvent);

      // Only initialize preferences page logic if on preferences.html
      if (window.location.pathname === "/preferences.html") {
        initPreferencesPage(
          resolvedDarkMode,
          resolvedAutoDarkMode,
          resolvedButtonGlow,
          resolvedModalGlow,
          resolvedFormGlow,
          resolvedBlur
        );
      }

      // Store preferences globally for later use
      window.userPreferences = {
        darkMode: resolvedDarkMode,
        buttonGlow: resolvedButtonGlow,
        modalGlow: resolvedModalGlow,
        formGlow: resolvedFormGlow,
        blur: resolvedBlur,
      };

      // Ensure applyPreferences runs only after loggedIn is defined
      applyPreferences({
        darkMode: resolvedDarkMode,
        autoDarkMode: resolvedAutoDarkMode,
        buttonGlow: resolvedButtonGlow,
        modalGlow: resolvedModalGlow,
        formGlow: resolvedFormGlow,
        blur: resolvedBlur,
      });

      // Only initialize preferences page logic if on preferences.html
      if (window.location.pathname === "/preferences.html") {
        initPreferencesPage(
          resolvedDarkMode,
          resolvedAutoDarkMode,
          resolvedButtonGlow,
          resolvedModalGlow,
          resolvedFormGlow,
          resolvedBlur
        );
      }
    }
  );
});

//Returns the value for a given preference key, or creates it with a default value if it doesn't exist
//Returns default_value if the user is not logged in.
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
