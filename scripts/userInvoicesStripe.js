// Fetch and display Stripe invoices for the logged-in user
async function fetchAndDisplayInvoices() {
	const invoicesContainer = document.getElementById("invoicesContainer");
	const alertDiv = document.getElementById("alertInvoices");
	invoicesContainer.innerHTML = "";
	alertDiv.style.display = "none";

	// Add loading bar
	const loadingBar = document.getElementById("listLoadingBar");
	// Show loading spinner
	loadingBar.style.display = "block";
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
			throw new Error("Failed to fetch invoices.");
		}
		const data = await response.json();
		if (!data.data || data.data.length === 0) {
			invoicesContainer.innerHTML = `<div class="invoices__empty">No invoices found.</div>`;
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
          <span class="invoices__number">Invoice #${
						invoice.number || invoice.id
					}</span>
          <span class="invoices__status invoices__status--${invoice.status}">${
				invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)
			}</span>
        </div>
        <div class="invoices__details">
          <span class="invoices__amount">Amount: <strong>$${(
						invoice.amount_due / 100
					).toFixed(2)}</strong></span>
          <span class="invoices__date">Date: ${new Date(
						invoice.created * 1000
					).toLocaleDateString()}</span>
        </div>
        <div class="invoices__actions">
          <a href="${
						invoice.hosted_invoice_url
					}" target="_blank" class="btn btn-primary invoices__view-btn">View Invoice</a>
          ${
						invoice.status === "open"
							? `<a href="${invoice.hosted_invoice_url}" target="_blank" class="btn btn-success invoices__pay-btn">Pay Now</a>`
							: ""
					}
        </div>
      `;
			invoicesList.appendChild(invoiceItem);
		});
		invoicesContainer.appendChild(invoicesList);
		// Remove loading bar after fetch
		loadingBar.style.display = "none";
	} catch (error) {
		loadingBar.style.display = "none";
		if (typeof showAlert === "function") {
			showAlert(`Error loading invoices: ${error.message}`, true, alertDiv);
		} else {
			alertDiv.style.display = "block";
			alertDiv.innerHTML = `Error loading invoices: ${error.message}`;
		}
		invoicesContainer.innerHTML = "";
	}
}

// Run on page load
window.addEventListener("authChecked", fetchAndDisplayInvoices);
