window.addEventListener("authChecked", (details) => {
    initVehicleAddForm();
});
function initVehicleAddForm() {
  const form = document.getElementById("vehicleAddForm");
  if (!form) return;

  const yearSelect = document.getElementById("yearSelect");
  const makeSelect = document.getElementById("makeSelect");
  const modelSelect = document.getElementById("modelSelect");

  const submitBtn = form.querySelector('button[type="submit"]');
  const updateSubmitBtn = () => {
    if(submitBtn){
        // gather form inputs & files
        let fd = new FormData(form);
        const valid = validateVehicleAddForm(fd);
        submitBtn.disabled = !valid.ok;
        fd = null;
    } 
  };
  
  // manual toggles (already present in DOM)
  const toggles = [
    { checkbox: "manualYear", manualInput: "yearManual", select: yearSelect },
    { checkbox: "manualMake", manualInput: "makeManual", select: makeSelect },
    {
      checkbox: "manualModel",
      manualInput: "modelManual",
      select: modelSelect,
    },
  ];
  toggles.forEach((t) => {
    const cb = document.getElementById(t.checkbox);
    const mi = document.getElementById(t.manualInput);
    if (!cb || !mi) return;
    cb.addEventListener("change", () => {
      if (cb.checked) {
        mi.style.display = "";
        if (t.select) t.select.required = false;
        mi.required = true;
      } else {
        mi.style.display = "none";
        if (t.select) t.select.required = true;
        mi.required = false;
      }
    });
  });

  // delegate submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    // gather form inputs & files
    const fd = new FormData(form);
    const validation = validateVehicleAddForm(fd);
    if (!validation.ok) {
      const msg = validation.errors.join(" • ");
      alertModal(msg);
      return;
    }
    try {
      if (typeof showLoading === "function") showLoading();
      await submitVehicleAddForm(validation.payload, validation.files);
    } finally {
      if (typeof hideLoading === "function") hideLoading();
    }
  });

  if(submitBtn && typeof updateSubmitBtn === "function") form.addEventListener("change", () => {
    updateSubmitBtn();
  });

  if(submitBtn && typeof updateSubmitBtn === "function") form.addEventListener("input", () => {
    updateSubmitBtn();
  });

  if(updateSubmitBtn && typeof updateSubmitBtn === "function") updateSubmitBtn();

  // If carMakeModelFields.js exists it may populate make/model selects; let it run
}

function validateVehicleAddForm(formData) {
  const errors = [];
  const get = (name) => formData.get(name);

  // Year (manual or select)
  const manualYearChecked = document.getElementById("manualYear")?.checked;
  const yearVal = manualYearChecked
    ? (get("year_manual") || "").toString().trim()
    : (get("year") || "").toString().trim();
  const yearNum = Number(yearVal);
  if (
    !yearVal ||
    !Number.isInteger(yearNum) ||
    yearNum < 1886 ||
    yearNum > 2099
  )
    errors.push("Invalid year");

  const make = document.getElementById("manualYear")?.checked
    ? (get("make_manual") || "").toString().trim()
    : (get("make") || "").toString().trim();
  if (!make) errors.push("Make is required");

  const model = document.getElementById("manualYear")?.checked
    ? (get("model_manual") || "").toString().trim()
    : (get("model") || "").toString().trim();
  if (!model) errors.push("Model is required");

  const price = Number(get("price"));
  if (!Number.isFinite(price) || price < 0) errors.push("Invalid price");

  const mileage = Number(get("mileage"));
  if (!Number.isFinite(mileage) || mileage < 0) errors.push("Invalid mileage");

  const color = (get("color") || "").toString().trim();
  if (!color) errors.push("Color is required");

  const trim = (get("trim") || "").toString().trim();
  if (!trim) errors.push("Trim is required");

  const body_style = (get("body_style") || "").toString().trim();
  if (!body_style) errors.push("Body style is required");

  const location = (get("location") || "").toString().trim();
  if (!location) errors.push("Location is required");

  const status = (get("status") || "").toString().trim();
  if (!status) errors.push("Status is required");

  const vin = (get("vin") || "").toString().trim();
  if (!vin) errors.push("VIN is required (enter N/A if you prefer)");

  const description = (get("description") || "").toString().trim();
  if (!description) errors.push("Description is required");

  // files validation (images input)
  const imagesInput = document.getElementById("images");
  const files = imagesInput ? Array.from(imagesInput.files || []) : [];
  if (files.length > 32) errors.push("You can upload up to 32 images");
  // server limit 5MB per file
  const MAX_BYTES = 5 * 1024 * 1024;
  files.forEach((f) => {
    if (f.size > MAX_BYTES) errors.push(`${f.name} exceeds 5MB`);
  });

  if (errors.length) return { ok: false, errors };

  // construct payload normalized for server
  const payload = {
    make,
    model,
    year: yearNum,
    price,
    mileage,
    color,
    description,
    trim,
    body_style,
    location,
    status,
    vin,
  };

  return { ok: true, payload, files };
}

async function submitVehicleAddForm(payload, files = []) {
  const token =
    typeof getTokenFromSession === "function"
      ? getTokenFromSession()
      : window.USER_TOKEN || null;

  if (!token) {
    alertModal("Authentication required.");
    return;
  }

  try {
    // create listing
    const res = await fetch(`${URL_BASE || ""}/api/admin/cars/create-listing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => null);
      const json = await res.json().catch(() => null);
      const err =
        json?.message || txt || `Create listing failed (${res.status})`;
      alertModal(err);
      return;
    }

    const created = await res.json();
    const listingId = created?.id;
    if (!listingId) {
      alertModal("Listing created but no id returned.");
      return;
    }

    // upload images if any
    if (files && files.length) {
      const form = new FormData();
      files.forEach((f) => form.append("images", f));
      const imgRes = await fetch(
        `${URL_BASE || ""}/api/admin/cars/${encodeURIComponent(
          listingId
        )}/images`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // DO NOT set Content-Type; browser will set multipart boundary
          },
          body: form,
        }
      );
      if (!imgRes.ok) {
        const txt = await imgRes.text().catch(() => null);
        alertModal(
          `Listing created but image upload failed: ${txt || imgRes.status}`
        );
        // do not abort — listing exists
      }
    }

    alertModal(
      "Listing created successfully. Will redirect to the listing page in a moment..."
    );
    // redirect to new car page if available
    new Promise((resolve) => setTimeout(resolve, 3000)).then(() => {
      window.location.href = `car.html?id=${encodeURIComponent(
        listingId
      )}`;
    });
  } catch (err) {
    console.error("submitVehicleAddForm error:", err);
    alertModal("Failed to create listing.");
  }
}