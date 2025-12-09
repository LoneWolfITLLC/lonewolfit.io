// Admin car editor: dynamically generated UI inside #adminCarEditorRoot
// Enhancements: drag-and-drop reorder of existing images, multi-file upload (up to 8 files at once)
// Uses backend endpoints:
//  - GET /api/cars/used/:id
//  - POST /api/admin/cars/:id/images  (multipart form, field name "images" accepted as array)
//  - DELETE /api/admin/cars/:id/images (body { imageName })
//  - POST /api/admin/cars/update-listing/:id  (used to persist reordered images and other fields)
// Depends on globals: URL_BASE, showLoadingModal, hideLoadingModal, alertModal, confirmModal, openImageModal
// Note: server-side update endpoint must accept "images" in body for reordering to persist.

// Admin car editor: dynamically generated UI inside #adminCarEditorRoot
// Enhancements in this version:
//  - Fix slideshow positioning & animation (slides no longer use absolute half-offset positioning)
//  - Ensure readable font colors for admin UI
//  - Add "Manual / Prefill" toggle for Year / Make / Model: when Prefill is enabled, populates dropdowns from cars92to24.json
//  - Multi-file upload up to 8 files (already supported) preserved
//  - Drag-and-drop reordering remains and Save Image Order posts images array to server
//
// Dependencies (globals): URL_BASE, showLoadingModal, hideLoadingModal, alertModal, confirmModal, openImageModal

// Updated admin editor for edit_car.html
// - Fixes: initial slideshow state, drag-reorder, responsive layout, color/contrast fixes
// - Two responsive breakpoints only: max-width 970px and max-width 768px
// - Uses .btn-primary and .btn-secondary (never .btn alone)
// - Body styles populated from catalog when prefill is used or from DEFAULT_BODY_STYLES when manual
//
// Depends on site globals: URL_BASE, showLoadingModal, hideLoadingModal, alertModal, confirmModal, openImageModal
// Triggered by auth.js's "authChecked" event (same as before)

// Updated editCarListing.js
// - One unified "Save Changes" button (no separate Save Image Order)
// - All frontend calls have robust error handling and use alertModal()
// - Delete button on slides uses class "car__delete-btn"
// - Drag & drop reordering preserved and works; reorder updates imagesArray immediately
// - Validate required fields before saving; server requires all fields
// - Uses existing button classes (btn btn-primary, btn btn-secondary); does NOT rely on bare .btn
// - Responsive behavior handled via CSS (blocks/car.css)
//
// Dependencies (globals): URL_BASE, showLoadingModal, hideLoadingModal, alertModal, confirmModal, openImageModal, getTokenFromSession
// Trigger: window event "authChecked" (auth.js)

window.addEventListener("authChecked", () => {
	initCarListing();
});

let car = {};
let imagesArray = [];
let activeImageIndex = 0;

let carsCatalog = {
	years: [],
	makes: [],
	modelsByMake: {},
	bodyStylesByKey: {},
	rawData: [],
};
const DEFAULT_BODY_STYLES = ["SUV", "Wagon", "Truck", "Sedan", "Van"];

function getQueryParam(name) {
	const params = new URLSearchParams(window.location.search);
	return params.get(name);
}

async function initCarListing() {
	const id = getQueryParam("id");
	const root = document.getElementById("adminCarEditorRoot");
	if (!root) return;
	root.innerHTML = "";

	if (!id) {
		root.innerHTML = `<div class="admin-editor__empty">No car id provided. Return to <a href="admin_inventory.html">inventory</a>.</div>`;
		return;
	}

	try {
		showLoadingModal();
		const res = await fetch(
			`${URL_BASE}/api/cars/used/${encodeURIComponent(id)}`
		);
		if (!res.ok) {
			const errJson = await safeParseJson(res);
			alertModal(
				(errJson.message || "Failed to load car.") +
					" [Will redirect in 3 seconds]",
				false
			);
			setTimeout(() => {
				window.location.href = "admin_inventory.html";
			}, 3000);
			return;
		}
		car = await res.json();
		imagesArray = normalizeImages(car.images || []);
		activeImageIndex = 0;
		document.title = `${car.year} ${car.make} ${car.model} | Edit Used Car Listing | Buy Smart Auto Sales 365, LLC | Used Cars`;
		await tryLoadCarsCatalog(); // best-effort
		buildEditor(root, car);
	} catch (err) {
		console.error("initCarListing error:", err);
		alertModal(
			err.message || "An unexpected error occurred while loading the car."
		);
	} finally {
		hideLoadingModal();
	}
}

async function safeParseJson(response) {
	try {
		const text = await response.text();
		return JSON.parse(text);
	} catch {
		return null;
	}
}

function normalizeImages(raw) {
	let arr = [];
	if (Array.isArray(raw)) arr = raw.slice();
	else if (typeof raw === "string") {
		try {
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed)) arr = parsed.slice();
			else
				arr = String(raw)
					.split(",")
					.map((s) => s.trim());
		} catch {
			arr = String(raw)
				.split(",")
				.map((s) => s.trim());
		}
	}
	return arr.map((s) => String(s).trim().replace(/^"|"$/g, "")).filter(Boolean);
}

async function tryLoadCarsCatalog() {
	const candidates = ["assets/cars92to24.json"];
	showLoadingModal("Loading car catalog...");
	for (const p of candidates) {
		try {
			const r = await fetch(p);
			if (!r.ok) continue;
			const json = await r.json();
			processCatalogJson(json);
			return;
		} catch {
			// ignore and try next
		}
	}
	hideLoadingModal();
}

function processCatalogJson(json) {
	carsCatalog = {
		years: [],
		makes: [],
		modelsByMake: {},
		bodyStylesByKey: {},
		rawData: [],
	};
	if (!json) return;

	if (Array.isArray(json)) {
		// Store raw data for body style lookups
		carsCatalog.rawData = json;

		const years = new Set(),
			makes = new Set(),
			modelsByMake = {},
			bsMap = {};
		json.forEach((item) => {
			const y = item.year ? String(item.year) : "";
			const m = item.make ? String(item.make) : "";
			const mo = item.model ? String(item.model) : "";
			const bs =
				item.body_styles || item.body_style || item.bodyStyles || item.body;
			if (y) years.add(y);
			if (m) {
				makes.add(m);
				modelsByMake[m] = modelsByMake[m] || new Set();
				if (mo) modelsByMake[m].add(mo);
				if (bs && mo) {
					const key = `${m}||${mo}||${y || ""}`;
					bsMap[key] = bsMap[key] || new Set();
					if (Array.isArray(bs)) bs.forEach((b) => bsMap[key].add(b));
					else bsMap[key].add(bs);
				}
			}
		});
		carsCatalog.years = Array.from(years).sort((a, b) => b - a);
		carsCatalog.makes = Array.from(makes).sort();
		Object.entries(modelsByMake).forEach(
			([mk, set]) => (carsCatalog.modelsByMake[mk] = Array.from(set).sort())
		);
		Object.keys(bsMap).forEach(
			(k) => (carsCatalog.bodyStylesByKey[k] = Array.from(bsMap[k]))
		);
		return;
	}

	if (json.years && json.makes && json.modelsByMake) {
		carsCatalog.years = Array.isArray(json.years) ? json.years.slice() : [];
		carsCatalog.makes = Array.isArray(json.makes) ? json.makes.slice() : [];
		carsCatalog.modelsByMake =
			typeof json.modelsByMake === "object" ? json.modelsByMake : {};
		return;
	}

	// make->models map
	const isMap = Object.values(json).every((v) => Array.isArray(v));
	if (isMap) {
		carsCatalog.makes = Object.keys(json).sort();
		carsCatalog.modelsByMake = {};
		carsCatalog.makes.forEach(
			(mk) => (carsCatalog.modelsByMake[mk] = json[mk].slice().sort())
		);
	}
}

function createEl(tag, opts = {}) {
	const el = document.createElement(tag);
	if (opts.className) el.className = opts.className;
	if (opts.attrs)
		Object.entries(opts.attrs).forEach(([k, v]) => el.setAttribute(k, v));
	if (opts.text) el.textContent = opts.text;
	if (opts.html) el.innerHTML = opts.html;
	return el;
}

function buildEditor(root, carData) {
	root.innerHTML = "";

	const container = createEl("div", { className: "admin-editor-root" });

	const card = createEl("div", { className: "admin-editor" });

	// Add back button at the top (matches car.html style)
	const backBtn = createEl("button", {
		className: "car__back-btn car__back-btn-image",
		text: "Go back to inventory",
		attrs: { type: "button" },
	});
	backBtn.onclick = () => (window.location.href = "admin_inventory.html");
	card.appendChild(backBtn);

	// LEFT column
	const left = createEl("section", { className: "admin-editor__left" });
	left.appendChild(
		createEl("h2", {
			className: "admin-editor__title main__heading",
			text: "Edit Car Listing",
		})
	);
	left.appendChild(
		createEl("p", {
			className: "admin-editor__meta main__text",
			text: `ID: ${carData.id || "(new)"} • Last modified: ${
				carData.modified_at
					? new Date(carData.modified_at).toLocaleString()
					: "n/a"
			}`,
		})
	);

	const form = createEl("form", {
		className: "admin-editor__form",
		attrs: { autocomplete: "off" },
	});

	// Input Mode toggle
	const toggleRow = createEl("div", { className: "admin-form-row" });
	toggleRow.appendChild(
		createEl("label", { className: "admin-form-label", text: "Input Mode" })
	);
	const toggleWrap = createEl("div", { className: "admin-form-toggle" });
	const prefillRadio = createEl("input", {
		attrs: {
			type: "radio",
			id: "inputModePrefill",
			name: "inputMode",
			value: "prefill",
		},
	});
	const prefillLabel = createEl("label", {
		className: "admin-form-toggle__label small",
		attrs: { for: "inputModePrefill" },
		text: "Prefill (dropdowns)",
	});
	const manualRadio = createEl("input", {
		attrs: {
			type: "radio",
			id: "inputModeManual",
			name: "inputMode",
			value: "manual",
		},
	});
	const manualLabel = createEl("label", {
		className: "admin-form-toggle__label small",
		attrs: { for: "inputModeManual" },
		text: "Manual (text inputs)",
	});
	toggleWrap.appendChild(prefillRadio);
	toggleWrap.appendChild(prefillLabel);
	toggleWrap.appendChild(manualRadio);
	toggleWrap.appendChild(manualLabel);
	toggleRow.appendChild(toggleWrap);
	form.appendChild(toggleRow);

	// selects and manual inputs
	const selects = {
		year: createEl("select", {
			className: "admin-form-input admin-form-input--select select-mode",
			attrs: { id: "select-year" },
		}),
		make: createEl("select", {
			className: "admin-form-input admin-form-input--select select-mode",
			attrs: { id: "select-make" },
		}),
		model: createEl("select", {
			className: "admin-form-input admin-form-input--select select-mode",
			attrs: { id: "select-model" },
		}),
	};
	const manualInputs = {
		year: createEl("input", {
			className: "admin-form-input manual-mode",
			attrs: {
				id: "field-year",
				name: "year",
				type: "number",
				placeholder: "e.g. 2018",
			},
		}),
		make: createEl("input", {
			className: "admin-form-input manual-mode",
			attrs: {
				id: "field-make",
				name: "make",
				type: "text",
				placeholder: "e.g. Toyota",
			},
		}),
		model: createEl("input", {
			className: "admin-form-input manual-mode",
			attrs: {
				id: "field-model",
				name: "model",
				type: "text",
				placeholder: "e.g. Camry",
			},
		}),
	};

	// meta fields
	const metaFields = [
		{ key: "year", label: "Year" },
		{ key: "make", label: "Make" },
		{ key: "model", label: "Model" },
		{ key: "trim", label: "Trim" },
		{ key: "price", label: "Price", type: "number" },
		{ key: "mileage", label: "Mileage", type: "number" },
		{ key: "body_style", label: "Body Style" },
		{ key: "color", label: "Color" },
		{ key: "vin", label: "VIN" },
		{ key: "location", label: "Location" },
		{ key: "status", label: "Status" },
	];

	metaFields.forEach((f) => {
		const row = createEl("div", { className: "admin-form-row" });
		row.appendChild(
			createEl("label", {
				className: "admin-form-label",
				text: f.label,
				attrs: { for: `field-${f.key}` },
			})
		);

		if (["year", "make", "model"].includes(f.key)) {
			const wrap = createEl("div", { className: "admin-form-field" });
			wrap.appendChild(selects[f.key]);
			wrap.appendChild(manualInputs[f.key]);
			if (f.key === "year" && car.year) manualInputs.year.value = car.year;
			if (f.key !== "year") manualInputs[f.key].value = car[f.key] || "";
			row.appendChild(wrap);
		} else if (f.key === "body_style") {
			const bsSelect = createEl("select", {
				className: "admin-form-input",
				attrs: { id: "field-body_style", name: "body_style" },
			});
			row.appendChild(bsSelect);
		} else if (f.key === "status") {
			const statusSelect = createEl("select", {
				className: "admin-form-input",
				attrs: { id: "field-status", name: "status" },
			});
			// Add status options
			const statusOptions = [
				{ value: "Available", label: "Available" },
				{ value: "Pending Sale", label: "Pending Sale" },
				{ value: "Sold", label: "Sold" },
				{ value: "Repairs Needed", label: "Repairs Needed" },
				{ value: "Not Available", label: "Not Available" },
			];
			statusOptions.forEach((opt) => {
				const option = createEl("option", {
					attrs: { value: opt.value },
					text: opt.label,
				});
				if (car.status === opt.value) {
					option.selected = true;
				}
				statusSelect.appendChild(option);
			});
			row.appendChild(statusSelect);
		} else {
			const input =
				f.type === "number"
					? createEl("input", {
							className: "admin-form-input",
							attrs: {
								id: `field-${f.key}`,
								name: f.key,
								type: "number",
								value: car[f.key] || "",
								min: 0,
							},
					  })
					: createEl("input", {
							className: "admin-form-input",
							attrs: {
								id: `field-${f.key}`,
								name: f.key,
								type: "text",
								value: car[f.key] || "",
							},
					  });
			row.appendChild(input);
		}

		form.appendChild(row);
	});

	// description
	const descRow = createEl("div", { className: "admin-form-row" });
	descRow.appendChild(
		createEl("label", {
			className: "admin-form-label",
			text: "Description",
			attrs: { for: "field-description" },
		})
	);
	const descInput = createEl("textarea", {
		className: "admin-form-textarea",
		attrs: { id: "field-description", name: "description", rows: 6 },
	});
	descInput.value = carData.description || "";
	descRow.appendChild(descInput);
	form.appendChild(descRow);

	// actions - SINGLE Save button (unified), keep other buttons but no separate image-order button
	const actions = createEl("div", { className: "admin-form-actions" });
	const saveBtn = createEl("button", {
		className: "btn btn-primary",
		text: "Save Changes",
		attrs: { type: "button" },
	});
	const viewCarBtn = createEl("button", {
		className: "btn btn-secondary",
		text: "View Car Listing",
		attrs: { type: "button" },
	});
	const cancelBtn = createEl("button", {
		className: "btn btn-delete",
		text: "Cancel",
		attrs: { type: "button" },
	});
	actions.appendChild(saveBtn);
	actions.appendChild(viewCarBtn);
	actions.appendChild(cancelBtn);
	form.appendChild(actions);

	left.appendChild(form);

	// RIGHT column - images
	const right = createEl("aside", { className: "admin-editor__right" });
	right.appendChild(
		createEl("h3", {
			className: "admin-editor__title main__heading",
			text: "Images",
		})
	);

	const slideshowWrap = createEl("div", { className: "admin-slideshow-wrap" });
	const slideshow = createEl("div", {
		className: "admin-slideshow",
		attrs: { id: "admin-slideshow" },
	});
	slideshowWrap.appendChild(slideshow);
	const prevBtn = createEl("button", {
		className: "admin-slideshow__nav admin-slideshow__nav--prev",
		text: "‹",
		attrs: { type: "button", "aria-label": "Previous image" },
	});
	const nextBtn = createEl("button", {
		className: "admin-slideshow__nav admin-slideshow__nav--next",
		text: "›",
		attrs: { type: "button", "aria-label": "Next image" },
	});
	slideshowWrap.appendChild(prevBtn);
	slideshowWrap.appendChild(nextBtn);
	right.appendChild(slideshowWrap);

	const thumbs = createEl("div", {
		className: "admin-thumbnails",
		attrs: { id: "admin-thumbnails" },
	});
	right.appendChild(thumbs);

	// Add centered slideshow heading beneath thumbnails showing the car title
	const slideshowHeading = createEl("div", {
		className: "admin__slideshow-heading",
		text: `${carData.year || ""} ${carData.make || ""} ${carData.model || ""}`,
	});
	// keep DOM order: place heading right after thumbnails
	right.appendChild(slideshowHeading);

	// upload controls
	const uploadWrap = createEl("div", { className: "admin-upload" });
	const uploadLabel = createEl("label", {
		className: "btn btn-primary admin-upload__label",
		text: "Upload Images",
		attrs: { for: "imageUpload" },
	});
	const fileInput = createEl("input", {
		attrs: {
			type: "file",
			id: "imageUpload",
			accept: "image/*",
			multiple: "multiple",
		},
	});
	fileInput.style.display = "none";
	const uploadInfo = createEl("p", {
		className: "main__text admin-upload__info",
		text: "You may upload up to 20 images at once. Drag thumbnails to reorder. Reordering does not work on touch screens. Must be done on a desktop/laptop.",
	});
	uploadWrap.appendChild(uploadLabel);
	uploadWrap.appendChild(fileInput);
	uploadWrap.appendChild(uploadInfo);
	right.appendChild(uploadWrap);

	right.appendChild(
		createEl("div", {
			className: "admin-help",
			html: `<p class="main__text">Click an image to preview. Use Delete to remove. Drag thumbnails to reorder. After arranging, click 'Save Changes' to persist the whole listing (all fields required).</p>`,
		})
	);

	card.appendChild(left);
	card.appendChild(right);
	container.appendChild(card);
	root.appendChild(container);

	// populate prefill selects and body styles
	populatePrefillControls();

	// Determine whether the current car's year/make/model exist in the generated selects.
	// If all three can be selected from the prefill dropdowns, use prefill mode; otherwise fall back to manual.
	const selYearCheck = document.getElementById("select-year");
	const selMakeCheck = document.getElementById("select-make");
	const selModelCheck = document.getElementById("select-model");
	let canSelectCarValues = true;
	try {
		if (selYearCheck && (carData.year || "") !== "") {
			canSelectCarValues = Array.from(selYearCheck.options).some(
				(o) => String(o.value) === String(carData.year)
			);
		}
		if (canSelectCarValues && selMakeCheck && (carData.make || "") !== "") {
			canSelectCarValues = Array.from(selMakeCheck.options).some(
				(o) => String(o.value).toLowerCase() === String(carData.make).toLowerCase()
			);
		}
		if (canSelectCarValues && selModelCheck && (carData.model || "") !== "") {
			canSelectCarValues = Array.from(selModelCheck.options).some(
				(o) => String(o.value).toLowerCase() === String(carData.model).toLowerCase()
			);
		}
	} catch (e) {
		canSelectCarValues = false;
	}

	const defaultMode = canSelectCarValues ? "prefill" : "manual";
	document.getElementById(
		defaultMode === "prefill" ? "inputModePrefill" : "inputModeManual"
	).checked = true;
	updateInputMode(defaultMode);

	// Events
	prevBtn.addEventListener("click", () => setActiveSlide(activeImageIndex - 1));
	nextBtn.addEventListener("click", () => setActiveSlide(activeImageIndex + 1));
	fileInput.addEventListener("change", handleFileUploadMulti);
	saveBtn.addEventListener("click", handleSaveAll);
	viewCarBtn.addEventListener("click", () => {
		const carUrl = `car.html?id=${encodeURIComponent(car.id)}`;
		window.open(carUrl, "_blank");
	});
	cancelBtn.addEventListener("click", () => {
		confirmModal("Discard unsaved changes and reload?", (c) => {
			if (c) initCarListing();
		});
	});

	document
		.getElementById("inputModePrefill")
		.addEventListener("change", () => updateInputMode("prefill"));
	document
		.getElementById("inputModeManual")
		.addEventListener("change", () => updateInputMode("manual"));

	// render images and ensure first slide visible
	renderSlidesAndThumbs();
	applyBodyStylesBasedOnSelection();

	// wire selection/model/year change to update body styles
	const selMake = document.getElementById("select-make");
	const selModel = document.getElementById("select-model");
	const selYear = document.getElementById("select-year");
	if (selMake)
		selMake.addEventListener("change", () => {
			populateModelsForMake(selMake.value);
			applyBodyStylesBasedOnSelection();
		});
	if (selModel)
		selModel.addEventListener("change", () =>
			applyBodyStylesBasedOnSelection()
		);
	if (selYear)
		selYear.addEventListener("change", () => applyBodyStylesBasedOnSelection());

	// manual inputs update
	["field-year", "field-make", "field-model"].forEach((id) => {
		const el = document.getElementById(id);
		if (el)
			el.addEventListener("input", () => {
				if (document.getElementById("inputModeManual").checked)
					applyBodyStylesBasedOnSelection();
			});
	});
}

function populatePrefillControls() {
	const selYear = document.getElementById("select-year");
	const selMake = document.getElementById("select-make");
	const selModel = document.getElementById("select-model");
	if (!selYear || !selMake || !selModel) return;

	selYear.innerHTML = "";
	if (carsCatalog.years && carsCatalog.years.length) {
		carsCatalog.years.forEach((y) => {
			const opt = document.createElement("option");
			opt.value = y;
			opt.textContent = y;
			if (String(car.year) === String(y)) opt.selected = true;
			selYear.appendChild(opt);
		});
	} else {
		const cur = car.year ? Number(car.year) : new Date().getFullYear();
		for (let y = cur; y >= cur - 30; y--) {
			const opt = document.createElement("option");
			opt.value = y;
			opt.textContent = y;
			if (String(car.year) === String(y)) opt.selected = true;
			selYear.appendChild(opt);
		}
	}

	selMake.innerHTML = "";
	if (carsCatalog.makes && carsCatalog.makes.length) {
		carsCatalog.makes.forEach((mk) => {
			const opt = document.createElement("option");
			opt.value = mk;
			opt.textContent = mk;
			if ((car.make || "").toLowerCase() === (mk || "").toLowerCase())
				opt.selected = true;
			selMake.appendChild(opt);
		});
	} else {
		const opt = document.createElement("option");
		opt.value = car.make || "";
		opt.textContent = car.make || "Select make";
		selMake.appendChild(opt);
	}

	populateModelsForMake(
		selMake.value || Object.keys(carsCatalog.modelsByMake)[0] || ""
	);
}

function populateModelsForMake(make) {
	const selModel = document.getElementById("select-model");
	if (!selModel) return;
	selModel.innerHTML = "";
	let models = carsCatalog.modelsByMake[make] || [];
	if (!models || !models.length) {
		if (carsCatalog.modelsByMake["(all)"])
			models = carsCatalog.modelsByMake["(all)"];
	}
	if (!models || !models.length) {
		const opt = document.createElement("option");
		opt.value = car.model || "";
		opt.textContent = car.model || "Select model";
		selModel.appendChild(opt);
		return;
	}
	models.forEach((mo) => {
		const opt = document.createElement("option");
		opt.value = mo;
		opt.textContent = mo;
		if ((car.model || "").toLowerCase() === (mo || "").toLowerCase())
			opt.selected = true;
		selModel.appendChild(opt);
	});
}

function applyBodyStylesBasedOnSelection() {
	const mode = document.getElementById("inputModePrefill")?.checked
		? "prefill"
		: "manual";
	const bsSelect = document.getElementById("field-body_style");
	if (!bsSelect) return;

	const currentValue = bsSelect.value; // preserve current selection if possible
	bsSelect.innerHTML = "";

	let styles = [];

	if (mode === "manual") {
		const manualYear = document.getElementById("field-year")?.value || "";
		const manualMake = document.getElementById("field-make")?.value || "";
		const manualModel = document.getElementById("field-model")?.value || "";

		// Try to find matching body styles from catalog even in manual mode
		if (
			manualYear &&
			manualMake &&
			manualModel &&
			carsCatalog.rawData &&
			carsCatalog.rawData.length
		) {
			const matches = carsCatalog.rawData.filter(
				(c) =>
					String(c.year) === String(manualYear) &&
					c.make === manualMake &&
					c.model === manualModel
			);

			if (matches.length > 0) {
				const bodyStylesSet = new Set();
				matches.forEach((m) => {
					const bs = m.body_styles || m.body_style || m.bodyStyles || m.body;
					if (Array.isArray(bs)) {
						bs.forEach((b) => bodyStylesSet.add(b));
					} else if (bs) {
						bodyStylesSet.add(bs);
					}
				});
				styles = Array.from(bodyStylesSet);
			}
		}

		// Fall back to default if no matches
		if (styles.length === 0) {
			styles = [...DEFAULT_BODY_STYLES];
		}
	} else {
		// Prefill mode
		const year = document.getElementById("select-year")?.value || "";
		const make = document.getElementById("select-make")?.value || "";
		const model = document.getElementById("select-model")?.value || "";

		// Find matching entries from raw data (same logic as carMakeModelFields.js)
		if (
			year &&
			make &&
			model &&
			carsCatalog.rawData &&
			carsCatalog.rawData.length
		) {
			const matches = carsCatalog.rawData.filter(
				(c) =>
					String(c.year) === String(year) &&
					c.make === make &&
					c.model === model
			);

			if (matches.length > 0) {
				const bodyStylesSet = new Set();
				matches.forEach((m) => {
					const bs = m.body_styles || m.body_style || m.bodyStyles || m.body;
					if (Array.isArray(bs)) {
						bs.forEach((b) => bodyStylesSet.add(b));
					} else if (bs) {
						bodyStylesSet.add(bs);
					}
				});
				styles = Array.from(bodyStylesSet);
			}
		}

		// Fall back to default if no matches
		if (styles.length === 0) {
			styles = [...DEFAULT_BODY_STYLES];
		}
	}

	// Sort and populate
	styles.sort();
	styles.forEach((bs) => {
		const o = document.createElement("option");
		o.value = bs;
		o.textContent = bs;
		bsSelect.appendChild(o);
	});

	// Restore previous selection if it exists in new options
	if (currentValue && styles.includes(currentValue)) {
		bsSelect.value = currentValue;
	} else if (car.body_style && styles.includes(car.body_style)) {
		bsSelect.value = car.body_style;
	}
}

function updateInputMode(mode) {
	const selects = document.querySelectorAll(".select-mode");
	const manuals = document.querySelectorAll(".manual-mode");
	if (mode === "prefill") {
		selects.forEach((s) => (s.style.display = ""));
		manuals.forEach((m) => (m.style.display = "none"));
	} else {
		selects.forEach((s) => (s.style.display = "none"));
		manuals.forEach((m) => (m.style.display = ""));
	}
	applyBodyStylesBasedOnSelection();
}

function renderSlidesAndThumbs() {
	const slideshow = document.getElementById("admin-slideshow");
	const thumbs = document.getElementById("admin-thumbnails");
	if (!slideshow || !thumbs) return;
	slideshow.innerHTML = "";
	thumbs.innerHTML = "";

	if (!imagesArray || !imagesArray.length) {
		const placeholder = createEl("div", {
			className: "admin-slide admin-slide--placeholder",
			html: `<p>No images available</p>`,
		});
		slideshow.appendChild(placeholder);
	} else {
		imagesArray.forEach((src, idx) => {
			const slide = createEl("div", {
				className: "admin-slide",
				attrs: { "data-index": idx },
			});
			const img = createEl("img", {
				className: "admin-slide__img",
				attrs: { src, alt: `Car image ${idx + 1}` },
			});
			img.addEventListener("click", () => openCarImagePreviewModal(src));
			slide.appendChild(img);

			// delete button uses BEM inventory__delete-btn
			const deleteBtn = createEl("button", {
				className: "inventory__delete-btn",
				text: "",
				attrs: { type: "button", "aria-label": `Delete image ${idx + 1}` },
			});
			deleteBtn.addEventListener("click", (e) => {
				e.preventDefault();
				// Use a simple confirm message (user reported the dialog text was wrong)
				confirmModal(`Delete this image?`, async (confirmed) => {
					if (!confirmed) return;
					try {
						await deleteCarImage(src);
					} catch (err) {
						alertModal(err.message || "Delete failed.");
					}
				});
			});
			slide.appendChild(deleteBtn);
			slideshow.appendChild(slide);

			// thumbnail
			const thumb = createEl("button", {
				className: "admin-thumb",
				attrs: {
					type: "button",
					"data-index": idx,
					draggable: "true",
					title: `Drag to reorder`,
				},
			});
			const timg = createEl("img", {
				className: "admin-thumb__img",
				attrs: { src, alt: `Thumbnail ${idx + 1}` },
			});
			thumb.appendChild(timg);
			thumbs.appendChild(thumb);
		});
	}

	attachThumbnailHandlers();
	setActiveSlide(activeImageIndex, true);
}

function attachThumbnailHandlers() {
	const thumbs = Array.from(document.querySelectorAll(".admin-thumb"));
	thumbs.forEach((thumb, idx) => {
		thumb.setAttribute("data-index", idx);
		thumb.onclick = () => setActiveSlide(idx);

		thumb.ondragstart = (ev) => {
			ev.dataTransfer.effectAllowed = "move";
			ev.dataTransfer.setData("text/plain", String(idx));
			thumb.classList.add("dragging");
		};
		thumb.ondragend = () => thumb.classList.remove("dragging");
		thumb.ondragover = (ev) => {
			ev.preventDefault();
			thumb.classList.add("drag-over");
		};
		thumb.ondragleave = () => thumb.classList.remove("drag-over");
		thumb.ondrop = (ev) => {
			ev.preventDefault();
			thumb.classList.remove("drag-over");
			const from = Number(ev.dataTransfer.getData("text/plain"));
			const to = Number(thumb.getAttribute("data-index"));
			if (Number.isFinite(from) && Number.isFinite(to) && from !== to)
				reorderImages(from, to);
		};
	});
}

function reorderImages(fromIdx, toIdx) {
	if (!Array.isArray(imagesArray)) return;
	const arr = imagesArray.slice();
	const [moved] = arr.splice(fromIdx, 1);
	arr.splice(toIdx, 0, moved);
	imagesArray = arr;
	activeImageIndex = toIdx;
	renderSlidesAndThumbs();
}

function setActiveSlide(index, instant = false) {
	const slides = Array.from(document.querySelectorAll(".admin-slide"));
	const thumbs = Array.from(document.querySelectorAll(".admin-thumb"));
	if (!slides.length) return;
	index = Math.max(0, Math.min(index, slides.length - 1));

	slides.forEach((s, i) => {
		if (i === index) {
			s.style.display = "";
			s.classList.add("is-active");
			if (!instant) requestAnimationFrame(() => s.classList.add("is-visible"));
			else s.classList.add("is-visible");
		} else {
			s.classList.remove("is-visible");
			s.classList.remove("is-active");
			setTimeout(() => {
				if (!s.classList.contains("is-visible")) s.style.display = "none";
			}, 240);
		}
	});

	thumbs.forEach((t, i) => t.classList.toggle("is-active", i === index));
	const wrap = document.querySelector(".admin-slideshow-wrap");
	if (wrap) wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
	activeImageIndex = index;
	if (activeImageIndex === 0) {
		document.querySelector(".admin-slideshow__nav--prev").disabled = true;
	} else {
		document.querySelector(".admin-slideshow__nav--prev").disabled = false;
	}
	if (activeImageIndex === imagesArray.length - 1 || imagesArray.length === 0) {
		document.querySelector(".admin-slideshow__nav--next").disabled = true;
	} else {
		document.querySelector(".admin-slideshow__nav--next").disabled = false;
	}
}

/* ---------- image ops ---------- */
function openCarImagePreviewModal(imgSrc) {
	const previewModal = document.getElementById("preview-modal");
	if (typeof openImageModal === "function") {
		openImageModal(previewModal, imgSrc, "");
		const modalImg = document.querySelector("#preview-modal .modal__image");
		if (modalImg) {
			modalImg.src = imgSrc;
			modalImg.alt = "Car image preview";
		}
		return;
	}
	if (!previewModal) return;
	const modalImgElm = previewModal.querySelector(".modal__image");
	modalImgElm.src = imgSrc;
	modalImgElm.alt = "Car image preview";
	previewModal.classList.add("modal_is-opened");
}

/* ---------- image ops ---------- */
async function deleteCarImage(src) {
	const id = getQueryParam("id");
	const token = getTokenFromSession
		? getTokenFromSession()
		: sessionStorage.getItem("jwt");
	if (!token) {
		alertModal("Invalid session. Please sign in again.");
		return;
	}
	try {
		showLoadingModal();
		const res = await fetch(
			`${URL_BASE}/api/admin/cars/${encodeURIComponent(id)}/images`,
			{
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				// backend expects imageName (filename) not full URL
				body: JSON.stringify({ imageName: src.split("/").pop() }),
			}
		);
		if (!res.ok) {
			const err = (await safeParseJson(res)) || {
				message: `Delete failed (${res.status})`,
			};
			throw new Error(err.message || JSON.stringify(err));
		}

		// If server returns updated images array, prefer it. Otherwise remove locally.
		let json = null;
		try {
			json = await safeParseJson(res);
		} catch (e) {
			// ignore parse errors, we'll fallback
		}

		if (json && Array.isArray(json.images)) {
			imagesArray = normalizeImages(json.images);
		} else {
			// update local - keep the current order, just remove the deleted image
			imagesArray = imagesArray.filter((s) => s !== src);
		}

		// fix active index and re-render in-place (no page reload)
		activeImageIndex = Math.max(
			0,
			Math.min(activeImageIndex, imagesArray.length - 1)
		);
		renderSlidesAndThumbs();
		alertModal(
			"Image deleted. Click 'Save Changes' to persist the image order."
		);
	} catch (err) {
		console.error("deleteCarImage error:", err);
		alertModal(err.message || "Failed to delete image.");
	} finally {
		hideLoadingModal();
	}
}

/* ---------- upload ---------- */
async function handleFileUploadMulti(e) {
	const files = Array.from(e.target.files || []);
	if (!files.length) return;
	if (files.length > 20) {
		alertModal("Please select up to 20 images at a time.");
		e.target.value = "";
		return;
	}
	const id = getQueryParam("id");
	const token = getTokenFromSession
		? getTokenFromSession()
		: sessionStorage.getItem("jwt");
	if (!token) {
		alertModal("Invalid session. Please sign in again.");
		e.target.value = "";
		return;
	}

	const fd = new FormData();
	files.forEach((f) => fd.append("images", f));
	try {
		showLoadingModal();
		const res = await fetch(
			`${URL_BASE}/api/admin/cars/${encodeURIComponent(id)}/images`,
			{
				method: "POST",
				headers: { Authorization: `Bearer ${token}` },
				body: fd,
			}
		);
		if (!res.ok) {
			const err = (await safeParseJson(res)) || {
				message: `Upload failed (${res.status})`,
			};
			throw new Error(err.message || JSON.stringify(err));
		}
		const json = await res.json().catch(() => null);
		if (json && Array.isArray(json.images)) {
			// Preserve existing order and append only new images
			const newImages = normalizeImages(json.images);
			const existingImages = new Set(imagesArray);
			const addedImages = newImages.filter((img) => !existingImages.has(img));
			imagesArray = [...imagesArray, ...addedImages];
		} else {
			await initCarListing(); // refresh canonical
		}
		renderSlidesAndThumbs();
		alertModal(
			"Upload successful. Click 'Save Changes' to persist the image order."
		);
	} catch (err) {
		console.error("handleFileUploadMulti error:", err);
		alertModal(err.message || "Upload failed.");
	} finally {
		hideLoadingModal();
		e.target.value = "";
	}
}

/* ---------- Save: unified (sends all required fields + images array) ---------- */
function validateListingBeforeSave() {
	const required = [
		{
			id: () =>
				document.getElementById("inputModePrefill")?.checked
					? document.getElementById("select-year")
					: document.getElementById("field-year"),
			name: "Year",
		},
		{
			id: () =>
				document.getElementById("inputModePrefill")?.checked
					? document.getElementById("select-make")
					: document.getElementById("field-make"),
			name: "Make",
		},
		{
			id: () =>
				document.getElementById("inputModePrefill")?.checked
					? document.getElementById("select-model")
					: document.getElementById("field-model"),
			name: "Model",
		},
		{ id: () => document.getElementById("field-price"), name: "Price" },
		{ id: () => document.getElementById("field-mileage"), name: "Mileage" },
		{ id: () => document.getElementById("field-color"), name: "Color" },
		{ id: () => document.getElementById("field-trim"), name: "Trim" },
		{
			id: () => document.getElementById("field-body_style"),
			name: "Body Style",
		},
		{ id: () => document.getElementById("field-location"), name: "Location" },
		{ id: () => document.getElementById("field-vin"), name: "VIN" },
		{
			id: () => document.getElementById("field-description"),
			name: "Description",
		},
	];

	const missing = [];
	for (const r of required) {
		try {
			const el =
				typeof r.id === "function" ? r.id() : document.getElementById(r.id);
			const val = el ? (el.value ?? "").toString().trim() : "";
			if (!val) missing.push(r.name);
		} catch {
			missing.push(r.name);
		}
	}
	return missing;
}

/* ---------- Save: unified (sends all required fields + images array) ---------- */
async function handleSaveAll() {
	const id = getQueryParam("id");
	const token = getTokenFromSession
		? getTokenFromSession()
		: sessionStorage.getItem("jwt");
	if (!token) {
		alertModal("Invalid session. Please sign in again.");
		return;
	}

	if (!validateListingBeforeSave()) return;

	// Determine input mode and pick values from selects (prefill) or manual fields
	const prefillMode = document.getElementById("inputModePrefill")?.checked;
	const yearVal = prefillMode
		? document.getElementById("select-year")?.value || ""
		: document.getElementById("field-year")?.value || "";
	const makeVal = prefillMode
		? document.getElementById("select-make")?.value || ""
		: document.getElementById("field-make")?.value || "";
	const modelVal = prefillMode
		? document.getElementById("select-model")?.value || ""
		: document.getElementById("field-model")?.value || "";

	const payload = {
		year: parseInt(yearVal || 0, 10),
		make: makeVal || "",
		model: modelVal || "",
		trim: document.getElementById("field-trim")?.value || "",
		price: document.getElementById("field-price")?.value || 0,
		mileage: document.getElementById("field-mileage")?.value || 0,
		color: document.getElementById("field-color")?.value || "",
		description: document.getElementById("field-description")?.value || "",
		body_style: document.getElementById("field-body_style")?.value || "",
		location: document.getElementById("field-location")?.value || "",
		status: document.getElementById("field-status")?.value || "Available",
		vin: document.getElementById("field-vin")?.value || "",
	};

	// include images ordering - send full image URLs/paths as stored
	// ensure we send a copy of strings (trimmed), not a reference that may later mutate
	payload.images = imagesArray;

	try {
		showLoadingModal();
		const res = await fetch(
			`${URL_BASE}/api/admin/cars/update-listing/${encodeURIComponent(id)}`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			}
		);
		if (!res.ok) {
			const err = (await safeParseJson(res)) || {
				message: `Save failed (${res.status})`,
			};
			throw new Error(err.message || JSON.stringify(err));
		}
		confirmModal(
			"Changes saved. Press confirm to view the listing or cancel to reload the page.",
			(confirmed) => {
				if (confirmed) {
					window.location.href = `/car.html?id=${id}`;
				} else {
					window.location.reload();
				}
			}
		);
	} catch (err) {
		console.error("handleSaveAll error:", err);
		alertModal(err.message || "Failed to save changes.");
	} finally {
		hideLoadingModal();
	}
}
