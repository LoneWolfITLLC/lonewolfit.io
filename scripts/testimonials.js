// --- Testimonials Admin Portal Logic ---
let currentCenterSlide = 0; // Current index for the center slide
let currentEditSlide = -1;
let unapprovedTestimonials = [];
let approvedTestimonials = [];
let changingSlide = false;
let busy = false;
let currentEditContext = "unapproved"; // Track which section is being edited

// Show alert in the correct alertDiv (unapproved or approved section)
function showMessage(message, isSuccess, context = "unapproved") {
	let alertDiv;
	if (context === "approved") {
		alertDiv = document.getElementById("alertFullTestimonialList");
	} else {
		alertDiv = document.getElementById("alertUnapprovedTestimonialList");
	}
	if (!alertDiv) return;
	alertDiv.style.display = "block";
	alertDiv.style.opacity = "1";
	alertDiv.innerHTML = message;
	alertDiv.style.backgroundColor = isSuccess ? "#28a745" : "#dc3545";
	alertDiv.style.boxShadow = isSuccess
		? "0 3px 15px rgba(0, 255, 0, 0.5)"
		: "0 3px 15px rgba(255, 0, 0, 0.5)";
	alertDiv.style.color = "#fff";
	setTimeout(() => {
		alertDiv.style.transition = "opacity 0.5s";
		alertDiv.style.opacity = "0";
		setTimeout(() => {
			alertDiv.style.display = "none";
			alertDiv.style.opacity = "1";
			alertDiv.style.transition = "";
			alertDiv.innerHTML = "";
			alertDiv.style.backgroundColor = "";
			alertDiv.style.boxShadow = "";
			alertDiv.style.color = "";
		}, 500);
	}, 3000);
}

function updateTestimonialTextField() {
	const testimonialText = document.getElementById("testimonialText");
	if (testimonialText)
		testimonialText.value =
			unapprovedTestimonials[currentCenterSlide]?.testimonial || "";
}

async function fetchUnapprovedTestimonials() {
	const token = getTokenFromSession && getTokenFromSession();
	const loadingBar = document.getElementById("loadingBar");
	if (loadingBar) loadingBar.style.display = "block";
	if (token) {
		try {
			const response = await fetch(
				`${URL_BASE}/api/testimonials?approvedTestimonials=0`,
				{
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			if (!response.ok) {
				showMessage("Authentication failed.", false, true);
				if (loadingBar) loadingBar.style.display = "none";
				updateNavButtons();
				return;
			}
			unapprovedTestimonials = await response.json();
			currentCenterSlide = 0;
			displaySlides();
			updateNavButtons();
		} catch (error) {
			console.error("Error fetching testimonials:", error);
			showMessage("Error fetching testimonials.", false, true);
			updateNavButtons();
		}
	} else {
		showMessage("Authentication failed.", false, true);
		updateNavButtons();
	}
	if (loadingBar) loadingBar.style.display = "none";
}

// Fetch approved testimonials for the list only, do not merge with slideshow testimonials
async function fetchApprovedTestimonials() {
	const token = getTokenFromSession && getTokenFromSession();
	const loadingModal = document.getElementById("loadingModal");
	if (loadingModal) loadingModal.style.display = "block";
	if (token) {
		try {
			const response = await fetch(
				`${URL_BASE}/api/testimonials?approvedTestimonials=1`,
				{
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			if (!response.ok) {
				showMessage("Authentication failed.", false, false);
				if (loadingModal) loadingModal.style.display = "none";
				return;
			}
			approvedTestimonials = await response.json();
		} catch (error) {
			console.error("Error fetching testimonials:", error);
			showMessage("Error fetching testimonials.", false, false);
		}
	} else {
		showMessage("Authentication failed.", false, false);
	}
	if (loadingModal) loadingModal.style.display = "none";
}

async function fetchUserDetailsWithoutToken(userId) {
	const loadingModal = document.getElementById("loadingModal");
	if (loadingModal) loadingModal.style.display = "block";
	try {
		const response = await fetch(
			`${URL_BASE}/api/auth/get-user-details/withouttoken`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId }),
			}
		);
		if (!response.ok) {
			if (loadingModal) loadingModal.style.display = "none";
			return null;
		}
		const data = await response.json();
		if (loadingModal) loadingModal.style.display = "none";
		return data;
	} catch (error) {
		if (loadingModal) loadingModal.style.display = "none";
		return null;
	}
}

async function fetchAndDisplayUserInfo(userId, element) {
	const loadingBar = document.getElementById("loadingBar");
	if (loadingBar) loadingBar.style.display = "block";
	try {
		const response = await fetch(
			`${URL_BASE}/api/auth/get-user-details/withouttoken`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId }),
			}
		);
		if (!response.ok) {
			element.innerHTML += `<p style="color: #0e0e0e" class="slideshow__user">- Deleted User</p>`;
			return;
		}
		const user = await response.json();
		const city = user.city || "";
		const state = user.state || "";
		const country = user.country || "";
		const firstCharofLastName = user.last_name?.charAt(0) ?? "";
		element.innerHTML += `<p style="color: #0e0e0e" class="slideshow__user">- ${user.first_name} ${firstCharofLastName}, ${city}, ${state}, ${country}</p>`;
	} catch (error) {
		element.innerHTML += `<p style="color: #0e0e0e" class="slideshow__user">- Unknown User</p>`;
	} finally {
		if (loadingBar) loadingBar.style.display = "none";
	}
}

async function displaySlides() {
	const slides = document.querySelector(".slideshow");
	slides.innerHTML =
		'<div class="slideshow__slide slideshow__slide--blank"><p style="color: #0e0e0e">No testimonials available, please try again later...</p></div>';
	const slideIndices = [];
	if (!unapprovedTestimonials || unapprovedTestimonials.length === 0) {
		changingSlide = false;
		const prevButton = document.getElementById("prev");
		const nextButton = document.getElementById("next");
		prevButton.style.opacity = 0.5;
		nextButton.style.opacity = 0.5;
		prevButton.style.pointerEvents = "none";
		nextButton.style.pointerEvents = "none";
		return;
	}
	if (unapprovedTestimonials.length === 1) {
		slideIndices.push(currentCenterSlide);
	} else if (unapprovedTestimonials.length === 2) {
		slideIndices.push(
			currentCenterSlide,
			(currentCenterSlide + 1) % unapprovedTestimonials.length
		);
	} else if (unapprovedTestimonials.length >= 3) {
		slideIndices.push(
			(currentCenterSlide - 1 + unapprovedTestimonials.length) %
				unapprovedTestimonials.length,
			currentCenterSlide,
			(currentCenterSlide + 1) % unapprovedTestimonials.length
		);
	}
	const twoSlides = unapprovedTestimonials.length === 2;
	const createSlideContent = async (testimonial, index) => {
		if (!testimonial) return;
		const slide = document.createElement("div");
		slide.className = twoSlides
			? "slideshow__slide slideshow__slide--dual"
			: "slideshow__slide";
		slide.innerHTML = `<p style="color: #0e0e0e">${testimonial.testimonial}</p>`;
		await fetchAndDisplayUserInfo(testimonial.user_id, slide);
		slides.appendChild(slide);
	};
	slides.innerHTML = "";
	if (slideIndices.length) {
		for (let i = 0; i < slideIndices.length; i++) {
			const index = slideIndices[i];
			await createSlideContent(unapprovedTestimonials[index], i);
			await new Promise((resolve) => setTimeout(resolve, 125));
		}
	}
	updateNavButtons();
}

function updateNavButtons() {
	const prevButton = document.getElementById("prev");
	const nextButton = document.getElementById("next");
	prevButton.style.opacity = unapprovedTestimonials.length > 1 ? 1 : 0.5;
	nextButton.style.opacity = unapprovedTestimonials.length > 1 ? 1 : 0.5;
	prevButton.style.pointerEvents =
		unapprovedTestimonials.length > 1 ? "auto" : "none";
	nextButton.style.pointerEvents =
		unapprovedTestimonials.length > 1 ? "auto" : "none";
	changingSlide = false;
	updateTestimonialTextField();

	// Disable/enable action buttons based on unapproved testimonials
	const approveBtn = document.getElementById("approveButton");
	const denyBtn = document.getElementById("denyButton");
	const editBtn = document.getElementById("editButton");
	const hasUnapproved = unapprovedTestimonials.length > 0;
	if (approveBtn) {
		approveBtn.disabled = !hasUnapproved;
		approveBtn.style.opacity = hasUnapproved ? 1 : 0.5;
		approveBtn.style.pointerEvents = hasUnapproved ? "auto" : "none";
	}
	if (denyBtn) {
		denyBtn.disabled = !hasUnapproved;
		denyBtn.style.opacity = hasUnapproved ? 1 : 0.5;
		denyBtn.style.pointerEvents = hasUnapproved ? "auto" : "none";
	}
	if (editBtn) {
		editBtn.disabled = !hasUnapproved;
		editBtn.style.opacity = hasUnapproved ? 1 : 0.5;
		editBtn.style.pointerEvents = hasUnapproved ? "auto" : "none";
	}
}

function changeSlide(direction) {
	if (unapprovedTestimonials.length > 1 && !changingSlide) {
		changingSlide = true;
		const slides = document.querySelectorAll(".slideshow__slide");
		slides.forEach((slide) => {
			slide.classList.remove("slide-enter", "slide-enter2");
			slide.classList.add("slideshow__slide--leave");
		});
		setTimeout(() => {
			currentCenterSlide =
				(currentCenterSlide + direction + unapprovedTestimonials.length) %
				unapprovedTestimonials.length;
			displaySlides();
		}, 250);
	}
}

async function deleteTestimonial(id, context = "unapproved") {
	if (busy) return;
	busy = true;
	const token = getTokenFromSession && getTokenFromSession();
	if (!token) {
		window.location.href = "/";
		busy = false;
		return;
	}
	const loadingBar = document.getElementById("loadingBar");
	if (loadingBar) loadingBar.style.display = "block";
	try {
		const response = await fetch(`${URL_BASE}/api/delete-testimonial`, {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ testimonialId: id }),
		});
		if (!response.ok) {
			showMessage("Error: Could not delete the testimonial", false, context);
			if (loadingBar) loadingBar.style.display = "none";
			busy = false;
			return;
		}
		showMessage("Testimonial Deleted", true, context);
		window.location.hash =
			context === "unapproved"
				? "unapprovedTestimonials"
				: "approvedTestimonials";
		if (loadingBar) loadingBar.style.display = "none";
		if (context === "approved") {
			await displayTestimonialList(); // Refresh approved list
		} else {
			unapprovedTestimonials = [];
			currentCenterSlide = 0;
			await fetchUnapprovedTestimonials();
		}
		const editSection = document.getElementById("editTestimonialSection");
		if (editSection) editSection.style.display = "none";
	} catch (error) {
		showMessage("Error: Could not delete the testimonial", false, context);
	}
	if (loadingBar) loadingBar.style.display = "none";
	busy = false;
}

async function displayTestimonialList() {
	await fetchApprovedTestimonials();
	const testimonialList = document.getElementById("testimonialList");
	testimonialList.innerHTML = "";
	if (approvedTestimonials.length === 0) {
		return;
	}
	for (const [index, testimonial] of approvedTestimonials.entries()) {
		const userDetails = await fetchUserDetailsWithoutToken(testimonial.user_id);
		const testimonialItem = document.createElement("div");
		testimonialItem.classList.add("testimonials__item");
		const userParagraph = document.createElement("p");
		userParagraph.className = "testimonials__user";
		const actionsDiv = document.createElement("div");
		actionsDiv.classList.add("testimonials__actions");
		actionsDiv.style.display = "none";
		if (userDetails !== null) {
			userParagraph.innerHTML = `
        <span class="testimonials__user-label">Submitted by:</span> <span class="testimonials__user-name">${userDetails.first_name} ${userDetails.last_name}</span>
        <span class="testimonials__chevron"></span>
      `;
			actionsDiv.innerHTML = `
        <p class="testimonials__text">Client Testimonial: ${testimonial.testimonial}</p>
        <button class="btn btn-primary testimonials__edit-btn" data-index="${index}" style="margin-bottom: 10px;">Edit Testimonial</button>
        <button class="btn btn-delete testimonials__delete-btn" data-id="${testimonial.id}" style="margin-bottom: 10px;">Delete Testimonial</button>
      `;
		} else {
			userParagraph.innerHTML = `
        <span class="testimonials__user-label">Submitted by:</span> <span class="testimonials__user-name">Deleted User</span>
        <span class="testimonials__chevron"></span>
      `;
			actionsDiv.innerHTML = `
        <p class="testimonials__text">Client Testimonial: ${testimonial.testimonial}</p>
        <button class="btn btn-primary testimonials__edit-btn" data-index="${index}" style="margin-bottom: 10px;">Edit Testimonial</button>
        <button class="btn btn-delete testimonials__delete-btn" data-id="${testimonial.id}" style="margin-bottom: 10px;">Delete Testimonial</button>
      `;
		}
		testimonialItem.appendChild(userParagraph);
		testimonialItem.appendChild(actionsDiv);
		const chevron = userParagraph.querySelector(".testimonials__chevron");
		function toggleActions() {
			const expanded = testimonialItem.classList.toggle(
				"testimonials__item--expanded"
			);
			actionsDiv.style.display = expanded ? "block" : "none";
			const editSection = document.getElementById("editTestimonialSection");
			if (
				editSection &&
				editSection.style.display === "block" &&
				currentEditSlide !== currentCenterSlide
			) {
				editSection.style.display = "none";
			}
		}
		chevron.addEventListener("click", function (e) {
			e.stopPropagation();
			toggleActions();
		});
		testimonialItem.addEventListener("click", function (e) {
			// Prevent double toggle if chevron is clicked
			if (e.target === chevron) return;
			toggleActions();
		});
		actionsDiv
			.querySelector(".testimonials__edit-btn")
			.addEventListener("click", function () {
				const editSection = document.getElementById("editTestimonialSection");
				const testimonialText = document.getElementById("testimonialText");
				const idToEdit = this.dataset.index;
				if (editSection.style.display === "block") {
					editSection.style.display = "none";
					currentEditSlide = -1;
					currentEditContext = "unapproved";
					window.location.hash = "unapprovedTestimonials";
					if (testimonialText) testimonialText.value = "";
				} else {
					editSection.style.display = "block";
					testimonialText.value =
						approvedTestimonials[idToEdit]?.testimonial || "";
					currentEditSlide = idToEdit;
					currentEditContext = "approved";
					window.location.hash = "editTestimonialSection";
				}
			});
		actionsDiv
			.querySelector(".testimonials__delete-btn")
			.addEventListener("click", async function () {
				const idToDelete = this.dataset.id;
				const confirmation = confirm(
					"Are you sure you want to delete this testimonial?"
				);
				if (confirmation) {
					await deleteTestimonial(idToDelete, "approved"); // Pass correct context
				}
			});
		testimonialList.appendChild(testimonialItem);
	}
}

window.addEventListener("authChecked", async function () {
	updateNavButtons();
	await fetchUnapprovedTestimonials();
	await displayTestimonialList(); // Ensure approved list loads on page load
	document
		.getElementById("approveButton")
		?.addEventListener("click", async function () {
			if (busy) return;
			busy = true;
			const token = getTokenFromSession && getTokenFromSession();
			if (!token) {
				window.location.href = "/";
				busy = false;
				return;
			}
			// Only operate on unapproved testimonials (slideshow)
			const testimonialId = unapprovedTestimonials[currentCenterSlide]?.id;
			const loadingBar = document.getElementById("loadingBar");
			if (loadingBar) loadingBar.style.display = "block";
			try {
				const response = await fetch(`${URL_BASE}/api/approve-testimonial`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ testimonialId }),
				});
				if (!response.ok) {
					showMessage(
						"Error: Could not approve the testimonial",
						false,
						"unapproved"
					);
					if (loadingBar) loadingBar.style.display = "none";
					busy = false;
					return;
				}
				showMessage("Testimonial Approved", true, "unapproved");
				if (loadingBar) loadingBar.style.display = "none";
				currentCenterSlide = 0;
				await fetchUnapprovedTestimonials();
				await displayTestimonialList(); // Refresh approved list after approving
			} catch (error) {
				showMessage(
					"Error: Could not approve the testimonial",
					false,
					"unapproved"
				);
			}
			if (loadingBar) loadingBar.style.display = "none";
			busy = false;
		});

	document
		.getElementById("denyButton")
		?.addEventListener("click", async function () {
			// Only operate on unapproved testimonials (slideshow)
			await deleteTestimonial(
				unapprovedTestimonials[currentCenterSlide]?.id,
				"unapproved"
			);
			await displayTestimonialList(); // Refresh approved list after deny/delete
		});

	document.getElementById("editButton")?.addEventListener("click", function () {
		// Only operate on unapproved testimonials (slideshow)
		const editSection = document.getElementById("editTestimonialSection");
		const testimonialText = document.getElementById("testimonialText");
		if (!editSection || !testimonialText) return;
		if (editSection.style.display === "none") {
			editSection.style.display = "block";
			testimonialText.value =
				unapprovedTestimonials[currentCenterSlide]?.testimonial || "";
			currentEditSlide = currentCenterSlide;
			currentEditContext = "unapproved";
			window.location.hash = "editTestimonialSection";
		} else {
			editSection.style.display = "none";
			currentEditSlide = -1;
			currentEditContext = "unapproved";
			window.location.hash = "unapprovedTestimonials";
			if (testimonialText) testimonialText.value = "";
		}
	});

	document
		.getElementById("saveTestimonialButton")
		?.addEventListener("click", async function () {
			if (busy) return;
			busy = true;
			const token = getTokenFromSession && getTokenFromSession();
			if (!token) {
				window.location.href = "/";
				busy = false;
				return;
			}
			let testimonialId;
			if (currentEditContext === "approved") {
				testimonialId = approvedTestimonials[currentEditSlide]?.id;
			} else {
				testimonialId = unapprovedTestimonials[currentEditSlide]?.id;
			}
			const updatedTestimonial =
				document.getElementById("testimonialText")?.value;
			const loadingBar = document.getElementById("loadingBar");
			if (loadingBar) loadingBar.style.display = "block";
			try {
				const response = await fetch(`${URL_BASE}/api/edit-testimonial`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ testimonialId, updatedTestimonial }),
				});
				if (!response.ok) {
					showMessage(
						"Error: Could not save the testimonial",
						false,
						currentEditContext
					);
					if (loadingBar) loadingBar.style.display = "none";
					busy = false;
					return;
				}
				showMessage("Testimonial Updated", true, currentEditContext);
				if (loadingBar) loadingBar.style.display = "none";
				currentCenterSlide = 0;
				if (currentEditContext === "approved") {
					await displayTestimonialList();
				} else {
					await fetchUnapprovedTestimonials();
				}
				const editSection = document.getElementById("editTestimonialSection");
				if (editSection) editSection.style.display = "none";
			} catch (error) {
				showMessage(
					"Error: Could not save the testimonial",
					false,
					currentEditContext
				);
			}
			if (loadingBar) loadingBar.style.display = "none";
			busy = false;
		});

	document
		.getElementById("closeEditTestimonialButton")
		?.addEventListener("click", function () {
			const editSection = document.getElementById("editTestimonialSection");
			if (editSection) {
				editSection.style.display = "none";
				currentEditSlide = -1;
				currentEditContext = "unapproved";
				window.location.hash = "unapprovedTestimonials";
				const testimonialText = document.getElementById("testimonialText");
				if (testimonialText) testimonialText.value = "";
			}
		});
});
