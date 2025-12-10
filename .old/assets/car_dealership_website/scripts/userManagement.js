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

  // build modal
  const modal = document.createElement("div");
  modal.id = id;
  modal.className = "modal";
  modal.tabIndex = -1;
  modal.style.display = "flex";
  modal.style.animation = "modalBGFadeIn 0.35s ease forwards";

  const dialog = document.createElement("div");
  dialog.className = "modal-dialog";
  dialog.id = "editUserModalBody";

  const form = document.createElement("form");
  form.id = "editUserForm";
  form.className = "modal-content modal-content--opening";
  form.enctype = "multipart/form-data";

  // header
  const header = document.createElement("div");
  header.className = "modal-header";
  const h5 = document.createElement("h5");
  h5.className = "modal-title";
  h5.textContent = "Edit User";
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "modal-close-button";
  closeBtn.id = "closeEditUserModalBtn";
  header.appendChild(h5);
  header.appendChild(closeBtn);
  form.appendChild(header);

  // alert div
  const alertDiv = document.createElement("div");
  alertDiv.id = "editUserModalAlert";
  alertDiv.className = "alertDiv main__alert";
  alertDiv.style.display = "none";
  form.appendChild(alertDiv);

  // body
  const body = document.createElement("div");
  body.className = "modal-body";

  const hiddenId = document.createElement("input");
  hiddenId.type = "hidden";
  hiddenId.name = "editorId";
  hiddenId.id = "editorId";
  body.appendChild(hiddenId);

  function makeField(labelText, id, type = "text", opts = {}) {
    const wrapper = document.createElement("div");
    wrapper.className = opts.wrapperClass || "mb-2";
    if (labelText) {
      const label = document.createElement("label");
      label.htmlFor = id;
      label.innerHTML = labelText;
      wrapper.appendChild(label);
    }
    const input = document.createElement("input");
    input.type = type;
    input.className = "form-control";
    input.id = id;
    input.name = id;
    if (opts.required) input.required = true;
    if (opts.autocomplete) input.autocomplete = opts.autocomplete;
    wrapper.appendChild(input);
    return { wrapper, input };
  }

  body.appendChild(
    makeField("First Name", "firstName", "text", {
      required: true,
      autocomplete: "given-name",
    }).wrapper
  );
  body.appendChild(makeField("Middle Name", "middleName").wrapper);
  body.appendChild(
    makeField("Last Name", "lastName", "text", { required: true }).wrapper
  );
  body.appendChild(
    makeField("Username", "username", "text", { required: true }).wrapper
  );
  body.appendChild(
    makeField("Email", "email", "email", { required: true }).wrapper
  );
  body.appendChild(
    makeField("Phone", "phone", "text", { required: true }).wrapper
  );

  // address field with small note
  const addrWrapper = document.createElement("div");
  addrWrapper.className = "mb-2";
  const addrLabel = document.createElement("label");
  addrLabel.innerHTML =
    "Address<br /><small>(add1,add2,city,state,zip,country)</small>";
  addrWrapper.appendChild(addrLabel);
  const addrInput = document.createElement("input");
  addrInput.type = "text";
  addrInput.className = "form-control";
  addrInput.id = "address";
  addrInput.name = "address";
  addrInput.required = true;
  addrWrapper.appendChild(addrInput);
  body.appendChild(addrWrapper);

  body.appendChild(makeField("DBA Name", "dbaName").wrapper);
  body.appendChild(makeField("Business Address", "businessAddress").wrapper);

  // checkboxes
  function makeCheckbox(id, labelText) {
    const wrapper = document.createElement("div");
    wrapper.className = "form-check";
    const input = document.createElement("input");
    input.className = "form-check-input";
    input.type = "checkbox";
    input.id = id;
    input.name = id;
    const label = document.createElement("label");
    label.className = "form-check-label";
    label.textContent = labelText;
    wrapper.appendChild(input);
    wrapper.appendChild(label);
    return wrapper;
  }

  body.appendChild(makeCheckbox("endUserCanEdit", "End-user can edit"));
  body.appendChild(makeCheckbox("adminUser", "Admin user"));

  form.appendChild(body);

  // footer
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

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "btn btn-delete";
  delBtn.id = "deleteUserModalBtn";
  delBtn.textContent = "Delete User";

  footer.appendChild(saveBtn);
  footer.appendChild(cancelBtn);
  footer.appendChild(delBtn);
  form.appendChild(footer);

  dialog.appendChild(form);
  modal.appendChild(dialog);

  // preferences & glow / blur (use modal.querySelector for internal elements)
  const darkMode = document.body.classList.contains("dark-mode");

  const modalGlow = getPreference("modalGlow").then((value) => value === "on");
  modalGlow.then((isGlowing) => {
    if (darkMode) {
      modal.querySelectorAll(".modal-content").forEach((content) => {
        if (isGlowing) content.classList.remove("modal--no-glow");
        else content.classList.add("modal--no-glow");
      });
    }
  });

  const buttonGlow = getPreference("buttonGlow").then(
    (value) => value === "on"
  );
  if (darkMode) {
    buttonGlow.then((isGlowing) => {
      const confirmBtn = modal.querySelector(
        "#editUserForm button[type='submit']"
      );
      const cancelBtnLocal = modal.querySelector("#cancelEditUserModalBtn");
      const deleteBtnLocal = modal.querySelector("#deleteUserModalBtn");
      if (confirmBtn) {
        if (isGlowing) confirmBtn.classList.remove("btn--no-glow");
        else confirmBtn.classList.add("btn--no-glow");
      }
      if (cancelBtnLocal) {
        if (isGlowing) cancelBtnLocal.classList.remove("btn--no-glow");
        else cancelBtnLocal.classList.add("btn--no-glow");
      }
      if (deleteBtnLocal) {
        if (isGlowing) deleteBtnLocal.classList.remove("btn--no-glow");
        else deleteBtnLocal.classList.add("btn--no-glow");
      }
    });
  }

  const modalBlur = getPreference("blur").then((value) => value === "on");
  modalBlur.then((isBlurred) => {
    if (isBlurred) modal.classList.remove("modal--no-blur");
    else modal.classList.add("modal--no-blur");
  });

  // append to DOM
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

  // delete handler (use modal-scoped selector)
  const deleteBtn = modal.querySelector("#deleteUserModalBtn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", function (e) {
      confirmModal(
        "Are you sure you want to delete this user? This cannot be undone.",
        async function (confirmed) {
          if (!confirmed) return;
          const token = getTokenFromSession();
          const editorIdVal = modal.querySelector("#editorId").value;
          showLoading();
          const res = await fetch(URL_BASE + "/api/admin/delete-account", {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ editorId: editorIdVal }),
          });
          hideLoading();
          if (res.ok) {
            showMessage("User deleted successfully.", true);
            await new Promise((resolve) => setTimeout(resolve, 2000));
            hideEditUserModal(id);
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
  }

  // Handle form submit (use modal-scoped selectors)
  const formEl = modal.querySelector("#editUserForm");
  if (formEl) {
    formEl.addEventListener("submit", async function (e) {
      try {
        e.preventDefault();
        const getVal = (sel) =>
          modal.querySelector(sel) ? modal.querySelector(sel).value : "";
        const getChecked = (sel) =>
          modal.querySelector(sel) ? modal.querySelector(sel).checked : false;

        const data = {
          editorId: getVal("#editorId"),
          firstName: getVal("#firstName"),
          middleName: getVal("#middleName"),
          lastName: getVal("#lastName"),
          username: getVal("#username"),
          email: getVal("#email"),
          phone: getVal("#phone"),
          address: getVal("#address"),
          dbaName: getVal("#dbaName"),
          businessAddress: getVal("#businessAddress"),
          endUserCanEdit: getChecked("#endUserCanEdit").toString(),
          adminUser: getChecked("#adminUser").toString(),
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
          try {
            const errJson = await res.json().catch(() => null);
            errorMsg = errJson?.error || errJson?.message || errorMsg;
          } catch {}
          showMessage(errorMsg, false);
        } else {
          showMessage("User updated!", true);
          showLoading();
          hideLoading();
          loadUsers();
          await new Promise((resolve) => setTimeout(resolve, 2000));
          hideEditUserModal(id);
          return;
        }
      } catch (err) {
        let errorMsg = "Update failed";
        try {
          if (err instanceof Response) {
            const errJson = await err.json();
            errorMsg = errJson?.error || errJson?.message || errorMsg;
          } else if (err && err.error) {
            errorMsg = err.error;
          } else if (err && err.message) {
            errorMsg = err.message;
          }
        } catch {}
        showMessage(errorMsg, false);
      }
    });
  }

  // Attach close/cancel button handlers (modal-scoped)
  const closeBtnLocal = modal.querySelector("#closeEditUserModalBtn");
  const cancelBtnLocal = modal.querySelector("#cancelEditUserModalBtn");
  if (closeBtnLocal) closeBtnLocal.onclick = () => hideEditUserModal(id);
  if (cancelBtnLocal) cancelBtnLocal.onclick = () => hideEditUserModal(id);
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
  document.getElementById("dbaName").value = u.dbaName || "";
  document.getElementById("businessAddress").value = u.businessAddress || "";
  document.getElementById("endUserCanEdit").checked = Boolean(u.endUserCanEdit);
  document.getElementById("adminUser").checked = Boolean(u.adminUser);
}
