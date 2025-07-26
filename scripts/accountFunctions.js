function signOut(ofAllDevices = false) {
  const token = sessionStorage.getItem("jwt");
  if (!token) {
    alertModal("No session found. You are already signed out.");
    window.location.href = "index.html";
    return;
  }
  let confirmMessage = ofAllDevices
    ? "Are you sure you want to sign out of all devices?"
    : "Are you sure you want to sign out?";
  confirmModal(confirmMessage, function(result) {
    if (!result) {
      return;
    }
    var loadingModal = document.getElementById("loadingModal");
    if (loadingModal) loadingModal.style.display = "block";
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
          if (loadingModal) loadingModal.style.display = "none";
          alertModal(
            ofAllDevices
              ? "You have been signed out of all devices."
              : "You have been signed out."
          );
          setTimeout(() => {
            window.location.href = "index.html";
          }, 2000);
        } else {
          if (response.status === 401) {
            sessionStorage.removeItem("jwt");
            if (loadingModal) loadingModal.style.display = "none";
            alertModal("Session expired. Please log in again.");
            window.location.href = "login.html#emailloginSection";
            return;
          } else {
            return response.text().then((text) => {
              if (loadingModal) loadingModal.style.display = "none";
              alertModal("Sign out failed: " + text);
            });
          }
        }
      })
      .catch((err) => {
        if (loadingModal) loadingModal.style.display = "none";
        alertModal("Sign out failed: " + err.message);
      });
  });
}
function resetPassword() {
  const token = sessionStorage.getItem("jwt");
  if (token) {
    confirmModal("Are you sure you want to reset your password?", function(result) {
      if (!result) {
        return;
      }
      var loadingModal = document.getElementById("loadingModal");
      if (loadingModal) loadingModal.style.display = "block";
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
            if (loadingModal) loadingModal.style.display = "none";
            alertModal(
              "You have been signed out of all devices. You can now reset your password."
            );
            setTimeout(() => {
              window.location.href = "reset.html";
            }, 3000);
          } else {
            return response.text().then((text) => {
              if (loadingModal) loadingModal.style.display = "none";
              alertModal("Sign out failed: " + text);
            });
          }
        })
        .catch((err) => {
          if (loadingModal) loadingModal.style.display = "none";
          alertModal("Sign out failed: " + err.message);
        });
    });
  }
}
function deleteAccount(redirectUri = "index.html") {
  const token = sessionStorage.getItem("jwt");
  if (!token) {
    alertModal("No session found. You are already signed out.");
    window.location.href = "index.html";
    return;
  }
  confirmModal(
    "Are you sure you want to delete your account? This action cannot be undone.",
    function(result) {
      if (!result) {
        return;
      }
      promptModal("Type 'DELETE' to confirm account deletion:", "", function(deleteConfirmation) {
        if (deleteConfirmation !== "DELETE") {
          alertModal("Account deletion canceled.");
          return;
        }
        var loadingModal = document.getElementById("loadingModal");
        if (loadingModal) loadingModal.style.display = "block";
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
              if (loadingModal) loadingModal.style.display = "none";
              alertModal("Your account has been deleted.");
              setTimeout(() => {
                window.location.href = redirectUri;
              }, 2000);
            } else {
              return response.text().then((text) => {
                if (loadingModal) loadingModal.style.display = "none";
                alertModal("Account deletion failed: " + text);
              });
            }
          })
          .catch((err) => {
            if (loadingModal) loadingModal.style.display = "none";
            alertModal("Account deletion failed: " + err.message);
          });
      });
    }
  );
}
