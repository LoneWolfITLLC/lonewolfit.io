function signOut(ofAllDevices = false) {
  const token = sessionStorage.getItem("jwt");
  if (!token) {
    alert("No session found. You are already signed out.");
    window.location.href = "index.html";
    return;
  }
  let confirmMessage = ofAllDevices
    ? "Are you sure you want to sign out of all devices?"
    : "Are you sure you want to sign out?";
  if (!confirm(confirmMessage)) {
    return;
  }
  document.getElementById("loadingModal").style.display = "block";

  fetch(URL_BASE + "/api/auth/sign-out", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      doNotSignOutAllDevices: !ofAllDevices,
    }),
  })
    .then((response) => {
      if (response.ok) {
        sessionStorage.removeItem("jwt");
        document.getElementById("loadingModal").style.display = "none";
        alert(
          ofAllDevices
            ? "You have been signed out of all devices."
            : "You have been signed out."
        );
        window.location.href = "index.html";
      } else {
        // If the fetch call returns 401, redirect the user to the login page and remove the token from session storage.
        if (response.status === 401) {
          sessionStorage.removeItem("jwt");
          document.getElementById("loadingModal").style.display = "none";
          alert("Session expired. Please log in again.");
          window.location.href = "login.html#emailloginSection";
          return;
        } else {
          return response.text().then((text) => {
            document.getElementById("loadingModal").style.display = "none";
            alert("Sign out failed: " + text);
          });
        }
      }
    })
    .catch((err) => {
      document.getElementById("loadingModal").style.display = "none";
      alert("Sign out failed: " + err.message);
    });
}
function resetPassword() {
  const token = sessionStorage.getItem("jwt");
  if (token) {
    if (!confirm("Are you sure you want to reset your password?")) {
      return;
    }

    document.getElementById("loadingModal").style.display = "block";
    fetch(URL_BASE + "/api/auth/sign-out", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        doNotSignOutAllDevices: false,
      }),
    })
      .then((response) => {
        if (response.ok) {
          sessionStorage.removeItem("jwt");
          document.getElementById("loadingModal").style.display = "none";
          alert(
            "You have been signed out of all devices. You can now reset your password."
          );
          window.location.href = "reset.html";
        } else {
          return response.text().then((text) => {
            document.getElementById("loadingModal").style.display = "none";
            alert("Sign out failed: " + text);
          });
        }
      })
      .catch((err) => {
        document.getElementById("loadingModal").style.display = "none";
        alert("Sign out failed: " + err.message);
      });
  }
}
function deleteAccount(redirectUri = "index.html") {
  const token = sessionStorage.getItem("jwt");
  if (!token) {
    alert("No session found. You are already signed out.");
    window.location.href = "index.html";
    return;
  }
  if (
    !confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    )
  ) {
    return;
  }
  const deleteConfirmation = prompt(
    "Type 'DELETE' to confirm account deletion:"
  );
  if (deleteConfirmation !== "DELETE") {
    alert("Account deletion canceled.");
    return;
  }
  document.getElementById("loadingModal").style.display = "block";
  fetch(URL_BASE + "/api/auth/delete-account", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (response.ok) {
        sessionStorage.removeItem("jwt");
        document.getElementById("loadingModal").style.display = "none";
        alert("Your account has been deleted.");
        window.location.href = redirectUri;
      } else {
        return response.text().then((text) => {
          document.getElementById("loadingModal").style.display = "none";
          alert("Account deletion failed: " + text);
        });
      }
    })
    .catch((err) => {
      document.getElementById("loadingModal").style.display = "none";
      alert("Account deletion failed: " + err.message);
    });
}
