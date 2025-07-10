window.addEventListener("authChecked", async (event) => {
  const admin = event.detail.user ? event.detail.user.adminUser : false;
  if (admin) {
    await buttonFunctions();
    await loadUsers();
  }
});

// Helper to show/hide modals
function showModal(id) {
  document.getElementById(id).style.display = "flex";
}
function hideModal(id) {
  document.getElementById(id).style.display = "none";
}

// Use showAlert from alert.js for all messages
function showMessage(message, isSuccess) {
  // Use the alertDiv in the editUserForm element form...
  let modalElement = document.getElementById("editModalBody");
  // If modalElement is not found, fallback to the main section
  if (!modalElement) modalElement = document.getElementById("editUserAlert");
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
  showModal("editUserModal");
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

async function buttonFunctions() {
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
  // DELETE USER HANDLER
  const deleteBtn = document.getElementById("deleteUserBtn");
  deleteBtn.addEventListener("click", async () => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This cannot be undone."
      )
    ) {
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
      // Wait 2 seconds before hiding the modal
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
      //OPTIONAL: Hide modal
    }
  });
}
