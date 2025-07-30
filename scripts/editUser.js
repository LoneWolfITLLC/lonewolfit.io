window.addEventListener("authChecked", function () {
	// Initialize form elements and event listeners here
	document
		.getElementById("toggleStripeIdResidential")
		.addEventListener("click", function () {
			const stripeCustomerIdInput = document.getElementById(
				"stripeCustomerIdResidential"
			);
			const eyeIcon = this.querySelector("i");

			// Toggle input type between "password" and "text"
			if (stripeCustomerIdInput.type === "password") {
				stripeCustomerIdInput.type = "text";
				eyeIcon.classList.remove("fa-eye");
				eyeIcon.classList.add("fa-eye-slash");
			} else {
				stripeCustomerIdInput.type = "password";
				eyeIcon.classList.remove("fa-eye-slash");
				eyeIcon.classList.add("fa-eye");
			}
		});
	document
		.getElementById("toggleStripeIdBusiness")
		.addEventListener("click", function () {
			const stripeCustomerIdInput = document.getElementById(
				"stripeCustomerIdBusiness"
			);
			const eyeIcon = this.querySelector("i");

			// Toggle input type between "password" and "text"
			if (stripeCustomerIdInput.type === "password") {
				stripeCustomerIdInput.type = "text";
				eyeIcon.classList.remove("fa-eye");
				eyeIcon.classList.add("fa-eye-slash");
			} else {
				stripeCustomerIdInput.type = "password";
				eyeIcon.classList.remove("fa-eye-slash");
				eyeIcon.classList.add("fa-eye");
			}
		});
	// Helper function to check if all required fields in a form are filled
});

window.addEventListener("preAuthChecked", function () {
	const residentialForm = document.getElementById("registerForm");
	const businessForm = document.getElementById("registerFormBusiness");

	if (residentialForm) {
		residentialForm.addEventListener("submit", function (e) {
			e.preventDefault();
			handleEditUserSubmit("registerForm");
		});
	}
	if (businessForm) {
		businessForm.addEventListener("submit", function (e) {
			e.preventDefault();
			handleEditUserSubmit("registerFormBusiness");
		});
	}
});

function areRequiredFieldsFilled(form) {
	const requiredFields = form.querySelectorAll("[required]");
	for (const field of requiredFields) {
		// Explicitly check businessCountry and businessState for business form
		if (form.id === "registerFormBusiness") {
			if (field.id === "businessCountry" && field.value === "") {
				return false;
			}
			if (field.id === "businessState" && field.value === "") {
				return false;
			}
		}
		// Skip optional fields (not required)
		if (
			(field.type === "checkbox" && !field.checked) ||
			(field.tagName === "SELECT" && field.value === "") ||
			(field.type !== "checkbox" &&
				field.tagName !== "SELECT" &&
				!field.value.trim() &&
				!(
					field.id === "stripeCustomerIdBusiness" ||
					field.id === "stripeCustomerIdResidential" ||
					field.id === "middleNameBusiness" ||
					field.id === "middleNameResidential" ||
					field.id === "address2Business" ||
					field.id === "address2Residential" ||
					field.id === "businessAddress2Business"
				))
		) {
			return false;
		}
	}
	return true;
}

window.addEventListener("authChecked", function (event) {
	const { loggedIn, user } = event.detail;
	if (loggedIn) {
		const fullUserData = retrieveUserDetails();
		if (
			user &&
			user.dbaName &&
			user.dbaName !== "" &&
			user.dbaName !== "null"
		) {
			toggleClientType();
			// Business user...
			// Populate ALL business fields from the data received
			fullUserData.then((data) => {
				if (!data) return;
				document.getElementById("stripeCustomerIdBusiness").value =
					data.stripeCustomerId || "";
				document.getElementById("stripeCustomerIdResidential").value =
					data.stripeCustomerId || "";
				document.getElementById("dbaNameBusiness").value = data.dbaName || "";
				// Split the address string into its components
				if (data.businessAddress) {
					const [
						addr1 = "",
						addr2 = "",
						city = "",
						state = "",
						zip = "",
						country = "",
					] = data.businessAddress.split(",");
					document.getElementById("businessAddress1Business").value =
						addr1.trim();
					document.getElementById("businessAddress2Business").value =
						addr2.trim();
					document.getElementById("businessCityBusiness").value = city.trim();
					document.getElementById("businessZipCodeBusiness").value = zip.trim();
					// Set country first, then wait for state options to load, then set state
					const businessCountryElem =
						document.getElementById("businessCountry");
					const businessStateElem = document.getElementById("businessState");
					// Try to match by value or label (full name or code)
					function setSelectByValueOrText(selectElem, val) {
						val = val.trim();
						// Try value match
						let found = false;
						for (let opt of selectElem.options) {
							if (opt.value === val) {
								selectElem.value = opt.value;
								found = true;
								break;
							}
						}
						if (!found) {
							// Try label/text match (case-insensitive)
							for (let opt of selectElem.options) {
								if (opt.text.toLowerCase() === val.toLowerCase()) {
									selectElem.value = opt.value;
									found = true;
									break;
								}
							}
						}
						return found;
					}
					setSelectByValueOrText(businessCountryElem, country);
					businessCountryElem.dispatchEvent(new Event("change"));
					// Wait for state options to be loaded before setting value
					const setStateValue = () => {
						if (setSelectByValueOrText(businessStateElem, state)) {
							businessStateElem.dispatchEvent(new Event("input"));
						} else {
							setTimeout(setStateValue, 50);
						}
					};
					setStateValue();
				} else {
					document.getElementById("businessAddress1Business").value = "";
					document.getElementById("businessAddress2Business").value = "";
					document.getElementById("businessCityBusiness").value = "";
					document.getElementById("businessState").value = "";
					document.getElementById("businessZipCodeBusiness").value = "";
					document.getElementById("businessCountry").value = "";
				}
				// Add more fields here as needed based on your HTML form
				if (data.address) {
					const [
						addr1 = "",
						addr2 = "",
						city = "",
						state = "",
						zip = "",
						country = "",
					] = data.address.split(",");
					document.getElementById("address1Business").value = addr1.trim();
					document.getElementById("address2Business").value = addr2.trim();
					document.getElementById("cityBusiness").value = city.trim();
					document.getElementById("zipCodeBusiness").value = zip.trim();
					// Set country and state by value or label
					const countryElem = document.getElementById("countryBusiness");
					const stateElem = document.getElementById("stateBusiness");
					function setSelectByValueOrText(selectElem, val) {
						val = val.trim();
						let found = false;
						for (let opt of selectElem.options) {
							if (opt.value === val) {
								selectElem.value = opt.value;
								found = true;
								break;
							}
						}
						if (!found) {
							for (let opt of selectElem.options) {
								if (opt.text.toLowerCase() === val.toLowerCase()) {
									selectElem.value = opt.value;
									found = true;
									break;
								}
							}
						}
						return found;
					}
					setSelectByValueOrText(countryElem, country);
					countryElem.dispatchEvent(new Event("change"));
					// Wait for the state options to be populated before setting the value
					const setStateValue = () => {
						if (setSelectByValueOrText(stateElem, state)) {
							stateElem.dispatchEvent(new Event("input"));
						} else {
							setTimeout(setStateValue, 50);
						}
					};
					setStateValue();
				} else {
					document.getElementById("address1Business").value = "";
					document.getElementById("address2Business").value = "";
					document.getElementById("cityBusiness").value = "";
					document.getElementById("stateBusiness").value = "";
					document.getElementById("zipCodeBusiness").value = "";
					document.getElementById("countryBusiness").value = "";
				}
				document.getElementById("usernameBusiness").value = data.username || "";
				document.getElementById("usernameResidential").value =
					data.username || "";
				document.getElementById("phoneBusiness").value = data.phone || "";
				document.getElementById("firstNameBusiness").value =
					data.first_name || "";
				document.getElementById("middleNameBusiness").value =
					data.middle_name || "";
				document.getElementById("lastNameBusiness").value =
					data.last_name || "";
				document.getElementById("emailBusiness").value = data.email || "";
				document.getElementById("emailResidential").value = data.email || "";
			});
		} else if (user) {
			fullUserData.then((data) => {
				if (!data) return;
				document.getElementById("stripeCustomerIdResidential").value =
					data.stripeCustomerId || "";
				document.getElementById("stripeCustomerIdBusiness").value =
					data.stripeCustomerId || "";
				// Add more fields here as needed based on your HTML form
				if (data.address) {
					const [
						addr1 = "",
						addr2 = "",
						city = "",
						state = "",
						zip = "",
						country = "",
					] = data.address.split(",");
					document.getElementById("address1Residential").value = addr1.trim();
					document.getElementById("address2Residential").value = addr2.trim();
					document.getElementById("cityResidential").value = city.trim();
					document.getElementById("zipCodeResidential").value = zip.trim();
					// Set country and state by value or label
					const countryElem = document.getElementById("country");
					const stateElem = document.getElementById("state");
					function setSelectByValueOrText(selectElem, val) {
						val = val.trim();
						let found = false;
						for (let opt of selectElem.options) {
							if (opt.value === val) {
								selectElem.value = opt.value;
								found = true;
								break;
							}
						}
						if (!found) {
							for (let opt of selectElem.options) {
								if (opt.text.toLowerCase() === val.toLowerCase()) {
									selectElem.value = opt.value;
									found = true;
									break;
								}
							}
						}
						return found;
					}
					setSelectByValueOrText(countryElem, country);
					countryElem.dispatchEvent(new Event("change"));
					// Wait for the state options to be populated before setting the value
					const setStateValue = () => {
						if (setSelectByValueOrText(stateElem, state)) {
							stateElem.dispatchEvent(new Event("input"));
						} else {
							setTimeout(setStateValue, 50);
						}
					};
					setStateValue();
				} else {
					document.getElementById("address1Residential").value = "";
					document.getElementById("address2Residential").value = "";
					document.getElementById("cityResidential").value = "";
					document.getElementById("state").value = "";
					document.getElementById("zipCodeResidential").value = "";
					document.getElementById("country").value = "";
				}
				document.getElementById("usernameBusiness").value = data.username || "";
				document.getElementById("usernameResidential").value =
					data.username || "";
				document.getElementById("phoneResidential").value = data.phone || "";
				document.getElementById("firstNameResidential").value =
					data.first_name || "";
				document.getElementById("middleNameResidential").value =
					data.middle_name || "";
				document.getElementById("lastNameResidential").value =
					data.last_name || "";
				document.getElementById("emailBusiness").value = data.email || "";
				document.getElementById("emailResidential").value = data.email || "";
			});
		}
	}
	// Attach input listeners to all required fields in each form
	const forms = [
		document.getElementById("registerForm"),
		document.getElementById("registerFormBusiness"),
	];
	forms.forEach((form) => {
		if (!form) return;
		const submitBtn = form.querySelector('button[type="submit"]');
		// Get all input, select, and textarea fields (including unrequired ones)
		const requiredFields = form.querySelectorAll("input, select, textarea");
		function updateSubmitState() {
			submitBtn.disabled = !areRequiredFieldsFilled(form);
		}
		requiredFields.forEach((field) => {
			field.addEventListener("input", updateSubmitState);
			field.addEventListener("change", updateSubmitState);
		});
		// Also, for business form, re-validate when country/state options are loaded
		if (form.id === "registerFormBusiness") {
			const businessCountryElem = document.getElementById("businessCountry");
			const businessStateElem = document.getElementById("businessState");
			if (businessCountryElem) {
				businessCountryElem.addEventListener("change", updateSubmitState);
			}
			if (businessStateElem) {
				businessStateElem.addEventListener("change", updateSubmitState);
			}
		}
		// Initial state
		updateSubmitState();
	});
});
function retrieveUserDetails() {
	const token = sessionStorage.getItem("jwt");
	if (!token) {
		alertModal("No session found.");
		return Promise.reject(new Error("No session found."));
	}
	showLoading();
	return fetch(URL_BASE + "/api/auth/get-user-details", {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
	})
		.then((response) => {
			if (response.ok) {
				return response.json();
			} else {
				throw new Error("Failed to retrieve user details.");
			}
		})
		.then((data) => {
			hideLoading();
			return data;
		})
		.catch((err) => {
			hideLoading();
			alertModal("Error: " + err.message);
			return null;
		});
}
function gatherFormData(formName) {
	const form = document.getElementById(formName);
	if (!form) {
		console.error(`Form with name ${formName} not found.`);
		return null;
	}
	if (formName === "registerFormBusiness") {
		const formData = new FormData(form);
		formData.append(
			"firstName",
			document.getElementById("firstNameBusiness").value
		);
		formData.append(
			"middleName",
			document.getElementById("middleNameBusiness").value
		);
		formData.append(
			"lastName",
			document.getElementById("lastNameBusiness").value
		);
		const phone = document.getElementById("phoneBusiness").value;
		if (isNaN(phone) || phone.length < 10) {
			alertModal("Please enter a valid phone number.");
			return null;
		}
		formData.append("phone", phone);
		formData.append("address", getUserAddress("business"));
		formData.append(
			"username",
			document.getElementById("usernameBusiness").value
		);
		formData.append("email", document.getElementById("emailBusiness").value);
		formData.append(
			"stripeCustomerId",
			document.getElementById("stripeCustomerIdBusiness").value
		);
		formData.append(
			"dbaName",
			document.getElementById("dbaNameBusiness").value
		);
		formData.append("businessAddress", getBusinessAddress());
		return formData;
	} else if (formName === "registerForm") {
		const formData = new FormData(form);
		formData.append(
			"firstName",
			document.getElementById("firstNameResidential").value
		);
		formData.append(
			"middleName",
			document.getElementById("middleNameResidential").value
		);
		formData.append(
			"lastName",
			document.getElementById("lastNameResidential").value
		);
		const phone = document.getElementById("phoneResidential").value;
		if (isNaN(phone) || phone.length < 10) {
			alertModal("Please enter a valid phone number.");
			return null;
		}
		formData.append("phone", phone);
		formData.append("address", getUserAddress("residential"));
		formData.append(
			"username",
			document.getElementById("usernameResidential").value
		);
		formData.append("email", document.getElementById("emailResidential").value);
		formData.append(
			"stripeCustomerId",
			document.getElementById("stripeCustomerIdResidential").value
		);
		formData.append("dbaName", null);
		formData.append("businessAddress", null);
		return formData;
	}
}
function getUserAddress(formType) {
	let address1 = "",
		address2 = "",
		city = "",
		state = "",
		zip = "",
		country = "";
	if (formType === "residential") {
		address1 = document.getElementById("address1Residential").value.trim();
		address2 = document.getElementById("address2Residential").value.trim();
		city = document.getElementById("cityResidential").value.trim();
		state = document.getElementById("state").value.trim();
		zip = document.getElementById("zipCodeResidential").value.trim();
		country = document.getElementById("country").value.trim();
	} else if (formType === "business") {
		address1 = document.getElementById("address1Business").value.trim();
		address2 = document.getElementById("address2Business").value.trim();
		city = document.getElementById("cityBusiness").value.trim();
		state = document.getElementById("stateBusiness").value.trim();
		zip = document.getElementById("zipCodeBusiness").value.trim();
		country = document.getElementById("countryBusiness").value.trim();
	}
	return [address1, address2, city, state, zip, country].join(", ");
}
function getBusinessAddress() {
	const address1 = document
		.getElementById("businessAddress1Business")
		.value.trim();
	const address2 = document
		.getElementById("businessAddress2Business")
		.value.trim();
	const city = document.getElementById("businessCityBusiness").value.trim();
	const state = document.getElementById("businessState").value.trim();
	const zip = document.getElementById("businessZipCodeBusiness").value.trim();
	const country = document.getElementById("businessCountry").value.trim();
	return [address1, address2, city, state, zip, country].join(", ");
}
function handleEditUserSubmit(formName) {
	const formData = gatherFormData(formName);
	if (!formData) return; // gatherFormData already alerts on error
	if (formName === "registerFormBusiness") {
		updateStripeCustomerDetails("business");
	} else {
		updateStripeCustomerDetails("residential");
	}
	// Convert FormData to JSON object
	const data = {};
	for (const [key, value] of formData.entries()) {
		// Parse address and businessAddress if they're JSON strings
		if (key === "address" || key === "businessAddress") {
			try {
				data[key] =
					typeof value === "string" ? JSON.stringify(JSON.parse(value)) : value;
			} catch {
				data[key] = value;
			}
		} else {
			data[key] = value;
		}
	}

	// Send PUT request to backend
	const token = sessionStorage.getItem("jwt");

	showLoading();
	fetch(URL_BASE + "/api/auth/edit-user", {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(data),
	})
		.then(async (response) => {
			hideLoading();
			if (response.ok) {
				alertModal("User updated successfully!");
			} else {
				const errorText = await response.text();
				let json = {};
				try {
					json = JSON.parse(errorText);
				} catch (err) {}
				if (json.message && json.message.trim() === "Malformed token") {
					alertModal("Token expired. Please login again...", true);
					setTimeout(() => {
						window.location.href = "login.html?redirect_uri=edit_user.html";
					}, 3000);
					return;
				}
				alertModal(
					"Error updating user: " +
						(errorText ||
							response.statusText ||
							json.message ||
							"Unknown error")
				);
			}
		})
		.catch((err) => {
			hideLoading();
			alertModal("Network error: " + err.message);
		});
}

function updateStripeCustomerDetails(formType) {
	const form =
		formType === "business"
			? document.getElementById("registerFormBusiness")
			: document.getElementById("registerForm");
	if (!form) {
		alertModal("Form not found.");
		return;
	}
	const formData = gatherFormData(form.id);
	if (!formData) return;

	const data = {};
	for (const [key, value] of formData.entries()) {
		data[key] = value;
	}

	// Parse address and businessAddress into objects for the API
	function parseAddress(addressStr) {
		const [
			line1 = "",
			line2 = "",
			city = "",
			state = "",
			postal_code = "",
			country = "",
		] = (addressStr || "").split(",").map((s) => s.trim());
		return { line1, line2, city, state, postal_code, country };
	}

	data.address = parseAddress(data.address);

	const token = sessionStorage.getItem("jwt");
	showLoading();
	fetch(URL_BASE + "/api/auth/update-stripe-customer", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(data),
	})
		.then(async (response) => {
			hideLoading();
			if (response.ok) {
				alertModal("Stripe customer updated successfully!");
				setTimeout(() => window.location.reload(), 3000);
			} else {
				const errorText = await response.text();
				const json = JSON.parse(errorText);
				alertModal(
					"Error updating Stripe customer: " +
						(json.message ||
							errorText ||
							response.statusText ||
							"Unknown error")
				);
			}
		})
		.catch((err) => {
			hideLoading();
			alertModal("Network error: " + err.message);
		});
}
