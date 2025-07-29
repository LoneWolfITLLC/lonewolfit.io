window.addEventListener("authChecked", async (event) => {
  const admin = event.detail.user ? event.detail.user.adminUser : false;
  if (admin) {
    await loadUsers();
  }
});

// Helper to show/hide modals
function showModal(id) {
  // Remove any existing modal first
  hideModal(id);

  // Modal HTML (all IDs are unique to editUser context)
  const modal = document.createElement("div");
  modal.id = id;
  modal.className = "modal";
  modal.tabIndex = -1;
  modal.style.display = "flex";
  modal.innerHTML = `
    <div class="modal-dialog" id="editUserModalBody">
      <form
        id="editUserForm"
        class="modal-content"
        enctype="multipart/form-data"
      >
        <div class="modal-header">
          <h5 class="modal-title">Edit User</h5>
          <button
            type="button"
            class="modal-close-button"
            id="closeEditUserModalBtn"
          ></button>
        </div>
        <div
          id="editUserModalAlert"
          class="alertDiv main__alert"
          style="display: none"
        ></div>
        <div class="modal-body">
          <input type="hidden" name="editorId" id="editorId" />

          <div class="mb-2">
            <label for="firstName" class="form-label">First Name</label>
            <input
              type="text"
              class="form-control"
              id="firstName"
              name="firstName"
              required
              autocomplete="given-name"
            />
          </div>
          <div class="mb-2">
            <label>Middle Name</label>
            <input
              type="text"
              class="form-control"
              id="middleName"
              name="middleName"
            />
          </div>
          <div class="mb-2">
            <label>Last Name</label>
            <input
              type="text"
              class="form-control"
              id="lastName"
              name="lastName"
              required
            />
          </div>
          <div class="mb-2">
            <label>Username</label>
            <input
              type="text"
              class="form-control"
              id="username"
              name="username"
              required
            />
          </div>
          <div class="mb-2">
            <label>Email</label>
            <input
              type="email"
              class="form-control"
              id="email"
              name="email"
              required
            />
          </div>
          <div class="mb-2">
            <label>Phone</label>
            <input
              type="text"
              class="form-control"
              id="phone"
              name="phone"
              required
            />
          </div>
          <div class="mb-2">
            <label>
              Address<br /><small>(add1,add2,city,state,zip,country)</small>
            </label>
            <input
              type="text"
              class="form-control"
              id="address"
              name="address"
              required
            />
          </div>
          <div class="mb-2">
            <label>Stripe Cust. ID</label>
            <input
              type="text"
              class="form-control"
              id="stripeCustomerId"
              name="stripeCustomerId"
              required
            />
          </div>
          <div class="mb-2">
            <label>DBA Name</label>
            <input
              type="text"
              class="form-control"
              id="dbaName"
              name="dbaName"
            />
          </div>
          <div class="mb-2">
            <label>Business Address</label>
            <input
              type="text"
              class="form-control"
              id="businessAddress"
              name="businessAddress"
            />
          </div>
          <div class="form-check">
            <input
              class="form-check-input"
              type="checkbox"
              id="endUserCanEdit"
              name="endUserCanEdit"
            />
            <label class="form-check-label">End-user can edit</label>
          </div>
          <div class="form-check">
            <input
              class="form-check-input"
              type="checkbox"
              id="adminUser"
              name="adminUser"
            />
            <label class="form-check-label">Admin user</label>
          </div>
        </div>
        <div class="modal-footer">
          <button type="submit" class="btn btn-primary">Save changes</button>
          <button
            type="button"
            class="btn btn-primary"
            id="cancelEditUserModalBtn"
          >
            Cancel
          </button>
          <button type="button" class="btn btn-delete" id="deleteUserModalBtn">
            Delete User
          </button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  const deleteBtn = document.getElementById("deleteUserModalBtn");
  deleteBtn.addEventListener("click", function (e) {
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
          hideModal("editUserModal");
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
          hideModal("editUserModal");
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
    hideModal(id);
  document.getElementById("cancelEditUserModalBtn").onclick = () =>
    hideModal(id);

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
    const confirmBtn = document.querySelector(
      "#editUserForm button[type='submit']"
    );
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
}

function hideModal(id) {
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
  showModal("editUserModal");
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
