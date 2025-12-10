// Prevent overlapping fetches
let isLoadingInvoices = false;
// Fetch and display Stripe invoices for the logged-in user
async function fetchAndDisplayInvoices() {
	console.log("[Invoices] fetchAndDisplayInvoices called");
	if (isLoadingInvoices) {
		console.warn("[Invoices] Fetch already in progress, skipping.");
		return;
	}
	isLoadingInvoices = true;
	const loadingBar = document.getElementById("listInvoicesLoadingBar");
	const invoicesContainer = document.getElementById("invoicesContainer");
	const alertDiv = document.getElementById("alertInvoices");
	// Always show loading bar at the start
	if (loadingBar) {
		loadingBar.style.display = "block";
	}
	if (invoicesContainer) invoicesContainer.innerHTML = "";
	if (alertDiv) alertDiv.style.display = "none";

	try {
		const token = sessionStorage.getItem("jwt");
		const response = await fetch(URL_BASE + "/api/user/invoices", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});
		if (!response.ok) {
			const text = await response.text();
			let json = {};
			try {
				json = JSON.parse(text);
			} catch (err) {}
			if (json.message && json.message.trim() === "Malformed token") {
				alertModal("Token expired. Please login again...", true);
				setTimeout(() => {
					window.location.href = "login.html?redirect_uri=invoices.html";
				}, 3000);
				return;
			}
			alertModal("Failed to fetch invoices: " + (json.message || text));
			console.error("Failed to fetch invoices:", text);
			return;
		}
		const data = await response.json();
		if (!data.data || data.data.length === 0) {
			if (invoicesContainer)
				invoicesContainer.innerHTML = `<div class="invoices__empty">No invoices found.</div>`;
			if (loadingBar) loadingBar.style.display = "none";
			return;
		}
		// Render invoices
		const invoicesList = document.createElement("div");
		invoicesList.className = "invoices__list main__item-centered";
		data.data.forEach((invoice) => {
			const invoiceItem = document.createElement("div");
			invoiceItem.className = "invoices__item";
			invoiceItem.innerHTML = `
				<div class="invoices__header">
					<div class="invoices__header-main">
						<span class="invoices__number">Invoice #${invoice.number || invoice.id}</span>
						<span class="invoices__status invoices__status--${invoice.status}">${
				invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)
			}</span>
					</div>
					<div class="invoices__header-side">
						<span class="invoices__amount">$${(invoice.amount_due / 100).toFixed(2)}</span>
						<span class="invoices__date">${new Date(
							invoice.created * 1000
						).toLocaleDateString()}</span>
						<span class="invoices__chevron" tabindex="0" aria-label="Expand invoice details"></span>
					</div>
				</div>
				<div class="invoices__details" style="display:none;">
					<p class="invoices__desc"><strong>Description:</strong> ${
						invoice.description || "N/A"
					}</p>
					<p class="invoices__id"><strong>Invoice ID:</strong> ${invoice.id}</p>
					<p class="invoices__customer"><strong>Customer:</strong> ${
						invoice.customer_name ||
						invoice.customer_email ||
						invoice.customer ||
						"N/A"
					}</p>
					<p class="invoices__period"><strong>Period:</strong> ${
						invoice.period_start
							? new Date(invoice.period_start * 1000).toLocaleDateString()
							: "N/A"
					} - ${
				invoice.period_end
					? new Date(invoice.period_end * 1000).toLocaleDateString()
					: "N/A"
			}</p>
					<p class="invoices__due"><strong>Due Date:</strong> ${
						invoice.due_date
							? new Date(invoice.due_date * 1000).toLocaleDateString()
							: "N/A"
					}</p>
					<p class="invoices__receipt">${
						invoice.hosted_invoice_url
							? `<button onclick="window.open('${invoice.hosted_invoice_url}', '_blank')" class="btn btn-primary main__item-centered">View Invoice</button>`
							: '<span class="invoices__receipt-na">Invoice N/A</span>'
					}</p>
					${
						invoice.status === "open"
							? `<a href="${invoice.hosted_invoice_url}" target="_blank" class="btn btn-success">Pay Now</a>`
							: ""
					}
				</div>
			`;
			// Collapse/expand logic
			const chevron = invoiceItem.querySelector(".invoices__chevron");
			const details = invoiceItem.querySelector(".invoices__details");
			function toggleDetails() {
				const expanded = invoiceItem.classList.toggle(
					"invoices__item--expanded"
				);
				details.style.display = expanded ? "block" : "none";
			}
			chevron.addEventListener("click", toggleDetails);
			invoiceItem.addEventListener("click", function (e) {
				// Prevent double toggle if chevron is clicked
				if (e.target === chevron) return;
				if (e.target.classList.contains("btn")) return;
				toggleDetails();
			});
			invoiceItem.addEventListener("keydown", (e) => {
				if (e.key === "Enter" || e.key === " ") {
					chevron.click();
				}
			});
			invoicesList.appendChild(invoiceItem);
		});
		if (invoicesContainer) invoicesContainer.appendChild(invoicesList);
		// Remove loading bar after fetch
		if (loadingBar) loadingBar.style.display = "none";
	} catch (error) {
		if (loadingBar) loadingBar.style.display = "none";
		if (typeof showAlert === "function") {
			showAlert(`Error loading invoices: ${error.message}`, true, alertDiv);
		} else if (alertDiv) {
			alertDiv.style.display = "block";
			alertDiv.innerHTML = `Error loading invoices: ${error.message}`;
		}
		if (invoicesContainer) invoicesContainer.innerHTML = "";
	} finally {
		isLoadingInvoices = false;
	}
}

// Run on page load
window.addEventListener("authChecked", fetchAndDisplayInvoices);
