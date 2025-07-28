// Prevent overlapping fetches
let isLoadingPayments = false;
// Fetch and display Stripe payments for the logged-in user
async function fetchAndDisplayUserPayments() {
	if (isLoadingPayments) {
		console.warn("[Payments] Fetch already in progress, skipping.");
		return;
	}
	isLoadingPayments = true;
	const paymentsContainer = document.getElementById("paymentsContainer");
	const alertDiv = document.getElementById("alertPayments");
	const loadingBar = document.getElementById("listPaymentsLoadingBar");
	// Always show loading bar at the start
	if (loadingBar) loadingBar.style.display = "block";
	if (!paymentsContainer) return;
	paymentsContainer.innerHTML = "";
	if (alertDiv) alertDiv.style.display = "none";

	try {
		const token = sessionStorage.getItem("jwt");
		const response = await fetch(URL_BASE + "/api/user/payments", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});
		if (!response.ok) {
			const text = await response.text();
			const json = JSON.parse(text);
			if (json.message && json.message.trim() === "Malformed token") {
				alertModal("Token expired. Please login again...");
				setTimeout(() => {
					window.location.href = "login.html?redirect_uri=payments.html";
				}, 3000);
				return;
			}
			alertModal("Failed to fetch payments: " + (json.message || text));
			console.error("Failed to fetch payments:", text);
			return;
		}
		const data = await response.json();
		if (!data.data || data.data.length === 0) {
			if (loadingBar) loadingBar.style.display = "none";
			paymentsContainer.innerHTML += `<div class="payments__empty">No payments found.</div>`;
			return;
		}
		// Render payments
		const paymentsList = document.createElement("div");
		paymentsList.className = "payments__list main__item-centered";
		// Only show up to 10 most recent payments
		const sortedPayments = data.data
			.sort((a, b) => b.created - a.created)
			.slice(0, 10);
		for (const payment of sortedPayments) {
			const paymentItem = document.createElement("div");
			paymentItem.className = "payments__item";
			paymentItem.innerHTML = `
				<div class="payments__header">
					<div class="payments__header-main">
						<span class="payments__amount">$${(payment.amount / 100).toFixed(2)}</span>
						<span class="payments__status payments__status--${payment.status}">${
				payment.status.charAt(0).toUpperCase() + payment.status.slice(1)
			}</span>
					</div>
					<div class="payments__header-side">
						<span class="payments__date">${new Date(
							payment.created * 1000
						).toLocaleDateString()}</span>
						<span class="payments__chevron" tabindex="0" aria-label="Expand payment details"></span>
					</div>
				</div>
				<div class="payments__details" style="display:none;">
					<p class="payments__desc"><strong>Description:</strong> ${
						payment.description || "N/A"
					}</p>
					<p class="payments__id"><strong>Payment ID:</strong> ${payment.id}</p>
					<p class="payments__method"><strong>Method:</strong> ${
						payment.payment_method_types
							? payment.payment_method_types.join(", ")
							: "N/A"
					}</p>
				</div>
			`;
			// Collapse/expand logic
			const chevron = paymentItem.querySelector(".payments__chevron");
			const details = paymentItem.querySelector(".payments__details");
			function toggleDetails() {
				const expanded = paymentItem.classList.toggle(
					"payments__item--expanded"
				);
				details.style.display = expanded ? "block" : "none";
			}
			chevron.addEventListener("click", toggleDetails);
			paymentItem.addEventListener("click", function (e) {
				// Prevent double toggle if chevron is clicked
				if (e.target === chevron) return;
				if (e.target.classList.contains("btn")) return;
				toggleDetails();
			});
			paymentItem.addEventListener("keydown", (e) => {
				if (e.key === "Enter" || e.key === " ") {
					chevron.click();
				}
			});
			paymentsList.appendChild(paymentItem);
		}
		paymentsContainer.appendChild(paymentsList);
		if (loadingBar) loadingBar.style.display = "none";
	} catch (error) {
		if (loadingBar) loadingBar.style.display = "none";
		if (typeof showAlert === "function") {
			showAlert(`Error loading payments: ${error.message}`, true, alertDiv);
		} else if (alertDiv) {
			alertDiv.style.display = "block";
			alertDiv.innerHTML = `Error loading payments: ${error.message}`;
		}
		paymentsContainer.innerHTML = "";
	} finally {
		isLoadingPayments = false;
	}
}

// Run on page load
window.addEventListener("authChecked", fetchAndDisplayUserPayments);
