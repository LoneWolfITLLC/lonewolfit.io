window.addEventListener("authChecked", async (event) => {
  const admin = event.detail.user ? event.detail.user.adminUser : false;
  if (admin) {
    await loadUsers();
  }
});

// Helper to show/hide modals
function showEditUserModal(id) {
  // Remove any existing modal first
  hideEditUserModal(id);

  // Create modal container
  const modal = document.createElement("div");
  modal.id = id;
  modal.className = "modal";
  modal.tabIndex = -1;
  modal.style.display = "flex";
  modal.style.animation = "modalBGFadeIn 0.35s ease forwards";

  // dialog
  const dialog = document.createElement("div");
  dialog.className = "modal-dialog";
  dialog.id = "editUserModalBody";

  // form
  const form = document.createElement("form");
  form.id = "editUserForm";
  form.className = "modal-content modal-content--opening";
  form.enctype = "multipart/form-data";

  // header
  const header = document.createElement("div");
  header.className = "modal-header";
  const title = document.createElement("h5");
  title.className = "modal-title";
  title.textContent = "Edit User";
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "modal-close-button";
  closeBtn.id = "closeEditUserModalBtn";
  header.appendChild(title);
  header.appendChild(closeBtn);

  // alert div
  const alertDiv = document.createElement("div");
  alertDiv.id = "editUserModalAlert";
  alertDiv.className = "alertDiv main__alert";
  alertDiv.style.display = "none";

  // body
  const body = document.createElement("div");
  body.className = "modal-body";

  // helper to build labeled input block
  function addInputBlock({ labelText, inputAttrs = {}, inputId }) {
    const wrapper = document.createElement("div");
    wrapper.className = "mb-2";
    if (labelText) {
      const label = document.createElement("label");
      if (inputAttrs.type === "text" && inputAttrs.id === "firstName") {
        label.setAttribute("for", inputId);
        label.className = "form-label";
      }
      label.innerHTML = labelText;
      wrapper.appendChild(label);
    }
    const input = document.createElement("input");
    Object.keys(inputAttrs).forEach((k) => (input[k] = inputAttrs[k]));
    if (inputId) input.id = inputId;
    if (inputAttrs.className) input.className = inputAttrs.className;
    else input.className = "form-control";
    wrapper.appendChild(input);
    body.appendChild(wrapper);
  }

  // hidden editorId
  const editorIdInput = document.createElement("input");
  editorIdInput.type = "hidden";
  editorIdInput.name = "editorId";
  editorIdInput.id = "editorId";
  body.appendChild(editorIdInput);

  // fields
  addInputBlock({
    labelText: "<span>First Name</span>",
    inputAttrs: {
      type: "text",
      name: "firstName",
      required: true,
      autocomplete: "given-name",
    },
    inputId: "firstName",
  });

  addInputBlock({
    labelText: "Middle Name",
    inputAttrs: { type: "text", name: "middleName" },
    inputId: "middleName",
  });

  addInputBlock({
    labelText: "Last Name",
    inputAttrs: { type: "text", name: "lastName", required: true },
    inputId: "lastName",
  });

  addInputBlock({
    labelText: "Username",
    inputAttrs: { type: "text", name: "username", required: true },
    inputId: "username",
  });

  addInputBlock({
    labelText: "Email",
    inputAttrs: { type: "email", name: "email", required: true },
    inputId: "email",
  });

  addInputBlock({
    labelText: "Phone",
    inputAttrs: { type: "text", name: "phone", required: true },
    inputId: "phone",
  });

  addInputBlock({
    labelText: "Address<br /><small>(add1,add2,city,state,zip,country)</small>",
    inputAttrs: { type: "text", name: "address", required: true },
    inputId: "address",
  });

  addInputBlock({
    labelText: "Stripe Cust. ID",
    inputAttrs: { type: "text", name: "stripeCustomerId", required: true },
    inputId: "stripeCustomerId",
  });

  addInputBlock({
    labelText: "DBA Name",
    inputAttrs: { type: "text", name: "dbaName" },
    inputId: "dbaName",
  });

  addInputBlock({
    labelText: "Business Address",
    inputAttrs: { type: "text", name: "businessAddress" },
    inputId: "businessAddress",
  });

  // checkboxes
  function addCheckbox(labelText, id, name) {
    const wrapper = document.createElement("div");
    wrapper.className = "form-check";
    const input = document.createElement("input");
    input.className = "form-check-input";
    input.type = "checkbox";
    input.id = id;
    input.name = name;
    const label = document.createElement("label");
    label.className = "form-check-label";
    label.textContent = labelText;
    wrapper.appendChild(input);
    wrapper.appendChild(label);
    body.appendChild(wrapper);
  }

  addCheckbox("End-user can edit", "endUserCanEdit", "endUserCanEdit");
  addCheckbox("Admin user", "adminUser", "adminUser");

  // footer with buttons
  const footer = document.createElement("div");
  footer.className = "modal-footer";

  const saveBtn = document.createElement("button");
  saveBtn.type = "submit";
  saveBtn.className = "btn btn-primary";
  saveBtn.textContent = "Save changes";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "btn btn-primary";
  cancelBtn.id = "cancelEditUserModalBtn";
  cancelBtn.textContent = "Cancel";

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "btn btn-delete";
  deleteBtn.id = "deleteUserModalBtn";
  deleteBtn.textContent = "Delete User";

  footer.appendChild(saveBtn);
  footer.appendChild(cancelBtn);
  footer.appendChild(deleteBtn);

  // assemble
  form.appendChild(header);
  form.appendChild(alertDiv);
  form.appendChild(body);
  form.appendChild(footer);
  dialog.appendChild(form);
  modal.appendChild(dialog);

  const darkMode = document.body.classList.contains("dark-mode");

  const modalGlow = getPreference("modalGlow").then((value) => value === "on");
  modalGlow.then((isGlowing) => {
    if (darkMode) {
      if (isGlowing) {
        modal.querySelectorAll(".modal-content").forEach((content) => {
          content.classList.remove("modal--no-glow");
        });
      } else {
        modal.querySelectorAll(".modal-content").forEach((content) => {
          content.classList.add("modal--no-glow");
        });
      }
    }
  });

  const buttonGlow = getPreference("buttonGlow").then(
    (value) => value === "on"
  );
  if (darkMode) {
    const confirmBtn = form.querySelector("button[type='submit']");
    buttonGlow.then((isGlowing) => {
      if (isGlowing) {
        confirmBtn.classList.remove("btn--no-glow");
        document
          .getElementById("cancelEditUserModalBtn")
          .classList.remove("btn--no-glow");
        document
          .getElementById("deleteUserModalBtn")
          .classList.remove("btn--no-glow");
      } else {
        confirmBtn.classList.add("btn--no-glow");
        document
          .getElementById("cancelEditUserModalBtn")
          .classList.add("btn--no-glow");
        document
          .getElementById("deleteUserModalBtn")
          .classList.add("btn--no-glow");
      }
    });
  }

  const modalBlur = getPreference("blur").then((value) => value === "on");
  modalBlur.then((isBlurred) => {
    if (isBlurred) {
      modal.classList.remove("modal--no-blur");
    } else {
      modal.classList.add("modal--no-blur");
    }
  });

  document.body.appendChild(modal);

  modal.addEventListener(
    "animationend",
    () => {
      modal.querySelectorAll(".modal-content").forEach((content) => {
        content.classList.remove("modal-content--opening");
      });
    },
    { once: true }
  );

  // delete handler
  document
    .getElementById("deleteUserModalBtn")
    .addEventListener("click", function (e) {
      confirmModal(
        "Are you sure you want to delete this user? This cannot be undone.",
        async function (confirmed) {
          if (!confirmed) {
            // Do nothing, leave modal open and allow table/modal events
            return;
          }
          const token = getTokenFromSession();
          const editorId = document.getElementById("editorId").value;
          showLoading();
          const res = await fetch(URL_BASE + "/api/admin/delete-account", {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ editorId }),
          });
          hideLoading();
          if (res.ok) {
            showMessage("User deleted successfully.", true);
            await new Promise((resolve) => setTimeout(resolve, 2000));
            hideEditUserModal("editUserModal");
            loadUsers();
          } else {
            let errorMsg = "Failed to delete user";
            try {
              const errJson = await res.json().catch(() => null);
              errorMsg = errJson?.error || errJson?.message || errorMsg;
            } catch {}
            showMessage(errorMsg, false);
          }
        }
      );
    });

  // Handle form submit
  document
    .getElementById("editUserForm")
    .addEventListener("submit", async function (e) {
      try {
        e.preventDefault();
        // Gather form data as a plain object
        const data = {
          editorId: document.getElementById("editorId").value,
          firstName: document.getElementById("firstName").value,
          middleName: document.getElementById("middleName").value,
          lastName: document.getElementById("lastName").value,
          username: document.getElementById("username").value,
          email: document.getElementById("email").value,
          phone: document.getElementById("phone").value,
          address: document.getElementById("address").value,
          dbaName: document.getElementById("dbaName").value,
          businessAddress: document.getElementById("businessAddress").value,
          stripeCustomerId: document.getElementById("stripeCustomerId").value,
          endUserCanEdit: document
            .getElementById("endUserCanEdit")
            .checked.toString(),
          adminUser: document.getElementById("adminUser").checked.toString(),
        };

        const token = getTokenFromSession();
        showLoading();
        const res = await fetch(URL_BASE + "/api/admin/edit-user", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        hideLoading();
        if (!res.ok) {
          let errorMsg = "Update failed";
          if (res instanceof Response) {
            // If err is a fetch Response object
            try {
              const errJson = await res.json().catch(() => null);
              errorMsg = errJson?.error || errJson?.message || errorMsg;
            } catch {}
          } else if (res && res.error) {
            errorMsg = res.error;
          } else if (res && res.message) {
            errorMsg = res.message;
          }
          showMessage(errorMsg, false);
        } else {
          showMessage("User updated!", true);
          showLoading();
          await updateStripeCustomer(
            new FormData(document.getElementById("editUserForm"))
          );
          hideLoading();
          loadUsers();
          //wait 2 seconds before hiding the loading modal with a promise
          await new Promise((resolve) => setTimeout(resolve, 2000));
          hideEditUserModal("editUserModal");
          return;
        }
      } catch (err) {
        let errorMsg = "Update failed";
        if (err instanceof Response) {
          // If err is a fetch Response object
          try {
            const errJson = await err.json();
            errorMsg = errJson?.error || errJson?.message || errorMsg;
          } catch {}
        } else if (err && err.error) {
          errorMsg = err.error;
        } else if (err && err.message) {
          errorMsg = err.message;
        }
        showMessage(errorMsg, false);
      }
    });

  // Attach close/cancel button handlers
  document.getElementById("closeEditUserModalBtn").onclick = () =>
    hideEditUserModal(id);
  document.getElementById("cancelEditUserModalBtn").onclick = () =>
    hideEditUserModal(id);
}

function hideEditUserModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    closeModalWithAnimation(modal);
  }
}

// Use showAlert from alert.js for all messages
function showMessage(message, isSuccess) {
  // Use the alertDiv in the editUserForm element form...
  let modalElement = document.getElementById("editUserModalBody");
  // If modalElement is not found, fallback to the main section
  if (!modalElement)
    modalElement = document.getElementById("editUserModalAlert");
  showAlert(message, !isSuccess, modalElement);
}

// Fetch & render user list
let users = [];
async function loadUsers() {
  const token = getTokenFromSession();
  if (!token) return (window.location.href = "index.html");
  showLoading();
  try {
    const res = await fetch(URL_BASE + "/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    hideLoading();
    if (!res.ok) return showMessage("Unable to load users", false);
    users = await res.json();
    renderTable();
  } catch (err) {
    hideLoading();
    showMessage("Unable to load users", false);
  }
  //OPTIONAL: Hide modal
}
function renderTable() {
  const tbody = document.getElementById("userTableBody");
  tbody.innerHTML = "";
  users.forEach((u) => {
    const tr = document.createElement("tr");
    tr.dataset.id = u.id;
    tr.classList.add("pricing-table__row");
    // Create and append each cell with dark-mode class if needed
    const fields = [
      { label: "Username", value: u.username },
      { label: "Name", value: `${u.first_name} ${u.last_name}` },
      { label: "Email", value: u.email },
      { label: "Phone", value: u.phone },
      { label: "Admin?", value: u.adminUser ? "✔️" : "&nbsp;" },
    ];
    fields.forEach((field) => {
      const td = document.createElement("td");
      td.setAttribute("data-label", field.label);
      if (document.body.classList.contains("dark-mode")) {
        td.classList.add("dark-mode");
      }
      td.classList.add("pricing-table__cell");
      td.innerHTML = field.value;
      tr.appendChild(td);
    });
    tr.addEventListener("click", (_) => openEditModal(u));
    tbody.append(tr);
  });
}

// Open modal, pre-fill form
function openEditModal(u) {
  showEditUserModal("editUserModal");
  document.getElementById("editorId").value = u.id;
  document.getElementById("firstName").value = u.first_name;
  document.getElementById("middleName").value = u.middle_name || "";
  document.getElementById("lastName").value = u.last_name;
  document.getElementById("username").value = u.username;
  document.getElementById("email").value = u.email;
  document.getElementById("phone").value = u.phone;
  document.getElementById("address").value = u.address;
  document.getElementById("stripeCustomerId").value = u.stripeCustomerId;
  document.getElementById("dbaName").value = u.dbaName || "";
  document.getElementById("businessAddress").value = u.businessAddress || "";
  document.getElementById("endUserCanEdit").checked = Boolean(u.endUserCanEdit);
  document.getElementById("adminUser").checked = Boolean(u.adminUser);
}

// Update Stripe customer (optional, can be called after user update)
async function updateStripeCustomer(fd) {
  if (!(fd instanceof FormData)) {
    console.error("Invalid FormData object");
    return;
  }
  // Extract values from FormData
  const stripeCustomerData = {
    stripeCustomerId: fd.get("stripeCustomerId"),
    username: fd.get("username"),
    firstName: fd.get("firstName"),
    lastName: fd.get("lastName"),
    phone: fd.get("phone"),
    email: fd.get("email"),
    address: fd.get("address"),
    dbaName: fd.get("dbaName"),
    businessAddress: fd.get("businessAddress"),
    endUserCanEdit: fd.get("endUserCanEdit"),
    adminUser: fd.get("adminUser"),
  };
  const token = getTokenFromSession();
  return fetch(URL_BASE + "/api/admin/update-stripe-customer", {
    method: "POST",
    body: JSON.stringify({ stripeCustomerData }),
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}
