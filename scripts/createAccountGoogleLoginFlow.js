function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Helper: show/hide loading modal
function showLoading() {
  const loadingModal = document.getElementById("loadingModal");
  if (loadingModal) loadingModal.style.display = "flex";
}
function hideLoading() {
  const loadingModal = document.getElementById("loadingModal");
  if (loadingModal) loadingModal.style.display = "none";
}

// Helper: show alert using alert.js
function showAlertDiv(message, isError, formElem) {
  if (typeof showAlert === "function") {
    showAlert(message, isError, formElem);
  } else {
    // fallback
    const alertDiv =
      formElem?.querySelector(".alertDiv") || document.getElementById("alert");
    if (alertDiv) {
      alertDiv.style.display = "block";
      alertDiv.textContent = message;
      alertDiv.style.backgroundColor = isError ? "#dc3545" : "#28a745";
    }
  }
}

// Enable/disable submit button based on required fields
function updateSubmitState(form) {
  if (!form) return;
  const submitBtn = form.querySelector(
    'button[type="submit"], button.btn-primary'
  );
  if (!submitBtn) return;
  const requiredFields = form.querySelectorAll("[required]");
  let allFilled = true;
  requiredFields.forEach((field) => {
    if (field.type === "checkbox" && !field.checked) allFilled = false;
    else if (field.type !== "checkbox" && !field.value.trim())
      allFilled = false;
  });
  submitBtn.disabled = !allFilled;
}

// Main onboarding logic
window.addEventListener("authChecked", async function () {
  showLoading();
  // Use stateFields.js logic for country/state fields if available
  if (typeof window.stateFieldsSetup === "function") {
    window.stateFieldsSetup();
  } else if (typeof setupCountryStateDropdowns === "function") {
    setupCountryStateDropdowns();
  }
  // Find forms and alert divs
  const residentialForm = document.getElementById("registerForm");
  const businessForm = document.getElementById("registerFormBusiness");
  const residentialAlert = document.getElementById("alertResidential");
  const businessAlert = document.getElementById("alertBusiness");
  // Default: show residential section
  let activeForm = residentialForm;
  let activeAlert = residentialAlert;
  // Toggle logic is handled by clientTypeToggle.js
  // Only update activeForm/activeAlert and submit state on toggle
  const clientTypeToggle = document.getElementById("clientTypeToggle");
  if (clientTypeToggle) {
    clientTypeToggle.addEventListener("click", function () {
      // Use display property to determine which form is active
      const businessVisible =
        document.getElementById("registerSectionBusiness").style.display !==
        "none";
      if (businessVisible) {
        activeForm = businessForm;
        activeAlert = businessAlert;
      } else {
        activeForm = residentialForm;
        activeAlert = residentialAlert;
      }
      updateSubmitState(activeForm);
    });
  }

  // Fetch temp user data
  const email = getQueryParam("email");
  if (!email) {
    hideLoading();
    window.location.href = getQueryParam("redirect_uri") || "index.html";
    return;
  }
  let tempUserData = null;
  try {
    const response = await fetch(`${URL_BASE}/api/auth/user-temp-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      showAlertDiv("Error: " + errorText, true, activeForm);
      setTimeout(() => {
        window.location.href = getQueryParam("redirect_uri") || "index.html";
      }, 2000);
      hideLoading();
      return;
    }
    tempUserData = await response.json();
    if (!tempUserData || !tempUserData.first_name || !tempUserData.last_name) {
      showAlertDiv("No temporary user data available.", true, activeForm);
      setTimeout(() => {
        window.location.href = getQueryParam("redirect_uri") || "index.html";
      }, 2000);
      hideLoading();
      return;
    }
  } catch (err) {
    showAlertDiv("Network error: " + err.message, true, activeForm);
    setTimeout(() => {
      window.location.href = getQueryParam("redirect_uri") || "index.html";
    }, 2000);
    hideLoading();
    return;
  }

  // Populate both forms with temp user data
  function fillFormFields(form, prefix = "") {
    if (!form) return;
    // Determine if this is the business form by checking for a business-specific field
    const isBusiness = form.id === "registerFormBusiness";
    if (isBusiness) {
      // Business form field IDs
      if (form.querySelector("#usernameBusiness"))
        form.querySelector("#usernameBusiness").value = email
          .split("@")[0]
          .trim();
      if (form.querySelector("#firstNameBusiness"))
        form.querySelector("#firstNameBusiness").value =
          tempUserData.first_name || "";
      if (form.querySelector("#lastNameBusiness"))
        form.querySelector("#lastNameBusiness").value =
          tempUserData.last_name || "";
      if (form.querySelector("#middleNameBusiness"))
        form.querySelector("#middleNameBusiness").value =
          tempUserData.middle_name || "";
      if (form.querySelector("#phoneBusiness"))
        form.querySelector("#phoneBusiness").value = tempUserData.phone || "";
      if (form.querySelector("#emailBusiness"))
        form.querySelector("#emailBusiness").value = email;
    } else {
      // Residential form field IDs
      if (form.querySelector("#usernameResidential"))
        form.querySelector("#usernameResidential").value = email
          .split("@")[0]
          .trim();
      if (form.querySelector("#firstNameResidential"))
        form.querySelector("#firstNameResidential").value =
          tempUserData.first_name || "";
      if (form.querySelector("#lastNameResidential"))
        form.querySelector("#lastNameResidential").value =
          tempUserData.last_name || "";
      if (form.querySelector("#middleNameResidential"))
        form.querySelector("#middleNameResidential").value =
          tempUserData.middle_name || "";
      if (form.querySelector("#phoneResidential"))
        form.querySelector("#phoneResidential").value =
          tempUserData.phone || "";
      if (form.querySelector("#emailResidential"))
        form.querySelector("#emailResidential").value = email;
    }
  }
  // Residential
  fillFormFields(residentialForm, "");
  // Business
  fillFormFields(businessForm, "Business");

  // Enable submit only when all required fields are filled
  [residentialForm, businessForm].forEach((form) => {
    if (!form) return;
    const requiredFields = form.querySelectorAll("[required]");
    requiredFields.forEach((field) => {
      field.addEventListener("input", () => updateSubmitState(form));
      field.addEventListener("change", () => updateSubmitState(form));
    });
    updateSubmitState(form);
  });

  hideLoading();

  // Form submit handlers
  function collectFormData(form, isBusiness) {
    // Compose address string as required by backend
    let address = "",
      businessAddress = "",
      dbaName = "";
    let firstName = "",
      middleName = "",
      lastName = "",
      phone = "",
      username = "";
    let emailVal = email;
    if (isBusiness) {
      dbaName = form.querySelector("#dbaNameBusiness")?.value || "";
      // Business address
      const addr1 =
        form.querySelector("#businessAddress1Business")?.value || "";
      const addr2 =
        form.querySelector("#businessAddress2Business")?.value || "";
      const city = form.querySelector("#businessCityBusiness")?.value || "";
      const stateSel = form.querySelector("#businessState");
      const state =
        (stateSel && stateSel.options[stateSel.selectedIndex]?.text) || "";
      const zip = form.querySelector("#businessZipCodeBusiness")?.value || "";
      const countrySel = form.querySelector("#businessCountry");
      const country =
        (countrySel && countrySel.options[countrySel.selectedIndex]?.text) ||
        "";
      businessAddress = `${addr1}${
        addr2 ? ", " + addr2 : ", "
      }, ${city}, ${state}, ${zip}, ${country}`;
      // User address (for notifications, etc)
      const uaddr1 = form.querySelector("#address1Business")?.value || "";
      const uaddr2 = form.querySelector("#address2Business")?.value || "";
      const ucity = form.querySelector("#cityBusiness")?.value || "";
      const ustateSel = form.querySelector("#stateBusiness");
      const ustate =
        (ustateSel && ustateSel.options[ustateSel.selectedIndex]?.text) || "";
      const uzip = form.querySelector("#zipCodeBusiness")?.value || "";
      const ucountrySel = form.querySelector("#countryBusiness");
      const ucountry =
        (ucountrySel && ucountrySel.options[ucountrySel.selectedIndex]?.text) ||
        "";
      address = `${uaddr1}${
        uaddr2 ? ", " + uaddr2 : ", "
      }, ${ucity}, ${ustate}, ${uzip}, ${ucountry}`;
      firstName = form.querySelector("#firstNameBusiness")?.value || "";
      middleName = form.querySelector("#middleNameBusiness")?.value || "";
      lastName = form.querySelector("#lastNameBusiness")?.value || "";
      phone = form.querySelector("#phoneBusiness")?.value || "";
      username = form.querySelector("#usernameBusiness")?.value || "";
      emailVal = form.querySelector("#emailBusiness")?.value || email;
    } else {
      // Residential
      const addr1 = form.querySelector("#address1Residential")?.value || "";
      const addr2 = form.querySelector("#address2Residential")?.value || "";
      const city = form.querySelector("#cityResidential")?.value || "";
      const stateSel = form.querySelector("#state");
      const state =
        (stateSel && stateSel.options[stateSel.selectedIndex]?.text) || "";
      const zip = form.querySelector("#zipCodeResidential")?.value || "";
      const countrySel = form.querySelector("#country");
      const country =
        (countrySel && countrySel.options[countrySel.selectedIndex]?.text) ||
        "";
      address = `${addr1}${
        addr2 ? ", " + addr2 : ", "
      }, ${city}, ${state}, ${zip}, ${country}`;
      firstName = form.querySelector("#firstNameResidential")?.value || "";
      middleName = form.querySelector("#middleNameResidential")?.value || "";
      lastName = form.querySelector("#lastNameResidential")?.value || "";
      phone = form.querySelector("#phoneResidential")?.value || "";
      username = form.querySelector("#usernameResidential")?.value || "";
      emailVal = form.querySelector("#emailResidential")?.value || email;
    }
    return {
      google_id: window.googleId || "",
      firstName,
      middleName,
      lastName,
      phone,
      address,
      username,
      email: emailVal,
      dbaName: isBusiness ? dbaName : "",
      businessAddress: isBusiness ? businessAddress : "",
    };
  }

  // Attach submit listeners
  if (residentialForm) {
    residentialForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      showLoading();
      updateSubmitState(residentialForm);
      const data = collectFormData(residentialForm, false);
      try {
        const response = await fetch(
          `${URL_BASE}/api/auth/register-google-account`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );
        if (response.ok) {
          const respData = await response.json();
          const token = respData.token;
          const redirectUri = getQueryParam("redirect_uri") || "";
          sessionStorage.setItem("jwt", token);
          showAlertDiv("Account created successfully!", false, residentialForm);
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
          const errorText = await response.text();
          showAlertDiv("Error: " + errorText, true, residentialForm);
        }
      } catch (err) {
        showAlertDiv("Network error: " + err.message, true, residentialForm);
      }
      hideLoading();
    });
  }
  if (businessForm) {
    businessForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      showLoading();
      updateSubmitState(businessForm);
      const data = collectFormData(businessForm, true);
      try {
        const response = await fetch(
          `${URL_BASE}/api/auth/register-google-account`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );
        if (response.ok) {
          const respData = await response.json();
          const token = respData.token;
          sessionStorage.setItem("jwt", token);
          console.log("Login successful, token stored in sessionStorage.");
          showAlertDiv("Account created successfully!", false, businessForm);
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
          const errorText = await response.text();
          showAlertDiv("Error: " + errorText, true, businessForm);
        }
      } catch (err) {
        showAlertDiv("Network error: " + err.message, true, businessForm);
      }
      hideLoading();
    });
  }

  // Store googleId globally for submission
  window.googleId = tempUserData.google_id || "";

  // Attempt to delete temp user data (non-blocking)
  fetch(`${URL_BASE}/api/auth/delete-temp-user`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
    .then((r) => {
      /* no-op */
    })
    .catch(() => {
      /* ignore */
    });
});
