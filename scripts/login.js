function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}
function googleCallback() {
  const token = getQueryParam("token");
  const admin = getQueryParam("admin");
  const redirectUri = getQueryParam("redirect_uri");
  if (token) {
    sessionStorage.setItem("jwt", token);
    if (admin) {
      // Only append redirect_uri if it is not the admin or member portal itself
      if (
        redirectUri &&
        redirectUri !== "admin.html" &&
        redirectUri !== "members.html"
      )
        window.location.href = `admin.html?redirect_uri=${redirectUri}`;
      else window.location.href = `admin.html`;
    } else {
      if (
        redirectUri &&
        redirectUri !== "members.html" &&
        redirectUri !== "admin.html"
      )
        window.location.href = `members.html?redirect_uri=${redirectUri}`;
      else window.location.href = `members.html`;
    }
  }
}
window.addEventListener("authChecked", function () {
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const button = document.querySelector('#emaillogin button[type="submit"]');

  function checkInputs() {
    button.disabled = !(email.value.trim() && password.value.trim());
  }

  email.addEventListener("input", checkInputs);
  password.addEventListener("input", checkInputs);
  checkInputs(); // Initial check

  // Get section elements for alert targeting
  const mainSection = document.getElementById("mainSection");
  const emailLoginSection = document.getElementById("emailloginSection");
  const verifyLoginSection = document.getElementById("verifyLoginSection");

  document
    .getElementById("emaillogin")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      document.getElementById("loadingModal").style.display = "block";
      try {
        const response = await fetch(URL_BASE + "/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          showVerifyLoginSection();
          showAlert(
            "Verification code sent! Please check your email and enter the code below.",
            false,
            verifyLoginSection
          );
        } else {
          const errorData = await response.json();
          showAlert(
            errorData.message || "Login failed! Please try again.",
            true,
            emailLoginSection
          );
        }
      } catch (error) {
        console.error("Error logging in:", error);
        showAlert(
          "Login failed due to network error. Please try again later.",
          true,
          emailLoginSection
        );
      }
      document.getElementById("loadingModal").style.display = "none";
    });

  // Helper to show/hide sections for verification step
  function showVerifyLoginSection() {
    const mainSection = document.getElementById("mainSection");
    const emailLoginSection = document.getElementById("emailloginSection");
    if (mainSection) mainSection.style.display = "none";
    if (emailLoginSection) emailLoginSection.style.display = "none";
    if (verifyLoginSection) verifyLoginSection.style.display = "block";
    window.location.hash = "verifyLoginSection"; // Update URL hash
  }

  // Handle verification code confirmation
  document
    .getElementById("verifyAccountButton")
    .addEventListener("click", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const code = document.getElementById("verificationCode").value;
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUri = urlParams.get("redirect_uri");

      // Clear previous alert messages for verification
      const alertDiv = verifyLoginSection.querySelector(".alertDiv");
      alertDiv.style.display = "none";
      alertDiv.innerHTML = "";
      document.getElementById("loadingModal").style.display = "block";
      try {
        const response = await fetch(URL_BASE + "/api/auth/verify-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, code }),
        });

        if (response.ok) {
          const data = await response.json();
          const token = data.token;
          sessionStorage.setItem("jwt", token);
          console.log("Login successful, token stored in sessionStorage.");
          //wait one second before redirecting
          await new Promise((resolve) => setTimeout(resolve, 2000));
          if (data.adminUser) {
            // Only append redirect_uri if it is not the admin or member portal itself
            if (
              redirectUri &&
              redirectUri !== "admin.html" &&
              redirectUri !== "members.html"
            )
              window.location.href = `admin.html?redirect_uri=${redirectUri}`;
            else window.location.href = `admin.html`;
          } else {
            if (
              redirectUri &&
              redirectUri !== "members.html" &&
              redirectUri !== "admin.html"
            )
              window.location.href = `members.html?redirect_uri=${redirectUri}`;
            else window.location.href = `members.html`;
          }
        } else {
          const errorData = await response.text();
          showAlert(
            errorData || "Verification failed! Please try again.",
            true,
            verifyLoginSection
          );
        }
      } catch (error) {
        console.error("Error verifying code:", error);
        showAlert(
          "Verification failed due to network error. Please try again later.",
          true,
          verifyLoginSection
        );
      }
      document.getElementById("loadingModal").style.display = "none";
    });

  // Resend verification code
  document
    .getElementById("resendCodeButton")
    .addEventListener("click", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      document.getElementById("loadingModal").style.display = "block";
      try {
        const response = await fetch(
          URL_BASE + "/api/auth/resend-verification-login",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          }
        );

        if (response.ok) {
          showAlert(
            "Verification code resent! Please check your email.",
            false,
            verifyLoginSection
          );
        } else {
          const errorData = await response.text();
          showAlert(
            "Error resending verification code: " +
              (errorData || "Please try again."),
            true,
            verifyLoginSection
          );
        }
      } catch (error) {
        console.error("Error resending verification code:", error);
        showAlert(
          "Failed to resend verification code due to network error. Please try again later.",
          true,
          verifyLoginSection
        );
      }
      document.getElementById("loadingModal").style.display = "none";
    });
  const verificationCodeInput = document.getElementById("verificationCode");
  const verifyAccountButton = document.getElementById("verifyAccountButton");
  if (verificationCodeInput && verifyAccountButton) {
    verifyAccountButton.disabled = true;
    verificationCodeInput.addEventListener("input", function () {
      // Only enable if exactly 6 digits
      verifyAccountButton.disabled = !/^\d{6}$/.test(this.value.trim());
    });
  }
  document
    .getElementById("loginGoogle")
    .addEventListener("click", async (e) => {
      e.preventDefault();
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUri = urlParams.get("redirect_uri");
      if (redirectUri) {
        window.location.href =
          URL_BASE + "/auth/google?redirect_uri=" + redirectUri;
      } else {
        window.location.href = URL_BASE + "/auth/google";
      }
    });
  googleCallback(); // Call this to handle any existing token in the URL
});
