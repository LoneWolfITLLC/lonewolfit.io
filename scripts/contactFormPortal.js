// Admin Contact Form Submissions Portal JS
window.addEventListener("authChecked", async function () {
	const loadingBar = document.getElementById(
		"contactFormSubmissionsLoadingBar"
	);
	const alertDiv = document.getElementById("alertContactFormSubmissionsList");
	const listDiv = document.getElementById("contactFormSubmissionsList");
	const refreshBtn = document.getElementById(
		"refreshContactFormSubmissionsBtn"
	);
	if (!listDiv) return;

	async function fetchSubmissions() {
		if (loadingBar) loadingBar.style.display = "block";
		if (alertDiv) alertDiv.style.display = "none";
		listDiv.innerHTML = "";
		try {
			const response = await fetch(
				URL_BASE + "/api/admin/contact-form/submissions",
				{
					headers: {
						Authorization: `Bearer ${
							getTokenFromSession ? getTokenFromSession() : ""
						}`,
					},
				}
			);
			if (!response.ok) {
				const text = await response.text();
				showAlert(text || "Error fetching submissions.", true, alertDiv);
				return;
			}
			const submissions = await response.json();
			if (!submissions.length) {
				listDiv.innerHTML =
					'<div class="main__text main__item-centered">No contact form submissions found.</div>';
				return;
			}
			submissions.forEach((sub) => renderSubmission(sub));
		} catch (err) {
			showAlert(
				"Network error fetching submissions: " + err.message,
				true,
				alertDiv
			);
		} finally {
			if (loadingBar) loadingBar.style.display = "none";
		}
	}

	if (refreshBtn) {
		refreshBtn.addEventListener("click", function () {
			fetchSubmissions();
		});
	}

	function renderSubmission(sub) {
		// BEM: contactform__item, contactform__chevron, contactform__summary, contactform__details, contactform__actions, etc.
		const item = document.createElement("div");
		item.className = "contactform__item";

		// Format date/time (assume sub.created_at or sub.date)
		let dateStr = "-";
		if (sub.created_at || sub.date) {
			const d = new Date(sub.created_at || sub.date);
			if (!isNaN(d)) {
				dateStr = d.toLocaleString();
			}
		}

		// Collapsed summary: name, first 50 chars of message, date/time
		const summary = document.createElement("div");
		summary.className = "contactform__summary";
		summary.innerHTML = `
            <span class="contactform__user-name">${sub.name || "-"}</span>
            <span class="contactform__summary-message">${(
							sub.message || "-"
						).slice(0, 50)}${
			sub.message && sub.message.length > 50 ? "..." : ""
		}</span>
            <span class="contactform__summary-date">${dateStr}</span>
        `;

		// Chevron as sibling to summary and details (child of item)
		const chevron = document.createElement("span");
		chevron.className = "contactform__chevron";
		chevron.title = "Expand";

		// Expanded details: all info, all actions
		const details = document.createElement("div");
		details.className = "contactform__details";
		details.style.display = "none";
		details.innerHTML = `
            <div class="contactform__user">
                <span class="contactform__user-label">Name:</span> <span class="contactform__user-name">${
									sub.name || "-"
								}</span>
                <span class="contactform__user-label">Email:</span> <a href="mailto:${
									sub.email || ""
								}" class="contactform__user-email">${sub.email || "-"}</a>
                <span class="contactform__user-label">Phone:</span> <a href="tel:${
									sub.phone || ""
								}" class="contactform__user-phone">${sub.phone || "-"}</a>
            </div>
            <div class="contactform__message"><strong>Message:</strong><br>${
							sub.message || "-"
						}</div>
            <div class="contactform__actions">
                <button class="btn btn-primary contactform__call-btn" title="Call Client" ${
									sub.phone ? "" : "disabled"
								}>Call Client</button>
                <button class="btn btn-secondary contactform__email-btn" title="Send Email to Client" ${
									sub.email ? "" : "disabled"
								}>Send Email</button>
                <button class="btn btn-danger contactform__delete-btn" title="Delete Submission">Delete Message</button>
            </div>
        `;

		// Chevron expand/collapse logic
		let expanded = false;
		chevron.addEventListener("click", function (e) {
			e.stopPropagation();
			expanded = !expanded;
			details.style.display = expanded ? "block" : "none";
			item.classList.toggle("contactform__item--expanded", expanded);
			chevron.classList.toggle("contactform__chevron--expanded", expanded);
		});
		// Also expand/collapse on summary click
		item.addEventListener("click", function (e) {
			e.stopPropagation();
			if (e.target.closest(".contactform__chevron")) return; // Ignore chevron clicks
			if (e.target.closest(".btn")) return; // Ignore details clicks
			expanded = !expanded;
			details.style.display = expanded ? "block" : "none";
			item.classList.toggle("contactform__item--expanded", expanded);
			chevron.classList.toggle("contactform__chevron--expanded", expanded);
		});

		// Action buttons logic (in details)
		// Email
		const emailBtn = details.querySelector(".contactform__email-btn");
		if (emailBtn) {
			emailBtn.addEventListener("click", function () {
				if (sub.email) {
					window.location.href = `mailto:${sub.email}`;
				}
			});
		}
		// Call
		const callBtn = details.querySelector(".contactform__call-btn");
		if (callBtn) {
			callBtn.addEventListener("click", function () {
				if (sub.phone) {
					window.location.href = `tel:${sub.phone}`;
				}
			});
		}
		// Delete
		const deleteBtn = details.querySelector(".contactform__delete-btn");
		if (deleteBtn) {
			deleteBtn.addEventListener("click", async function () {
				if (!confirm("Are you sure you want to delete this submission?"))
					return;
				if (loadingBar) loadingBar.style.display = "block";
				try {
					const response = await fetch(
						URL_BASE + `/api/admin/contact-form/submission/${sub.id}`,
						{
							method: "DELETE",
							headers: {
								Authorization: `Bearer ${
									getTokenFromSession ? getTokenFromSession() : ""
								}`,
							},
						}
					);
					const text = await response.text();
					if (!response.ok) {
						showAlert(text || "Error deleting submission.", true, alertDiv);
						return;
					}
					showAlert("Submission deleted successfully.", false, alertDiv);
					item.remove();
					// If no more items, show empty message
					if (!listDiv.querySelector(".contactform__item")) {
						listDiv.innerHTML =
							'<div class="main__text main__item-centered">No contact form submissions found.</div>';
					}
				} catch (err) {
					showAlert("Network error deleting submission.", true, alertDiv);
				} finally {
					if (loadingBar) loadingBar.style.display = "none";
				}
			});
		}

		item.appendChild(chevron);
		item.appendChild(summary);
		item.appendChild(details);
		listDiv.appendChild(item);
	}

	fetchSubmissions();
});
