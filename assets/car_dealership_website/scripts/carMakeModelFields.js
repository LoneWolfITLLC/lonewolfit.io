let carData = [];
window.addEventListener("authChecked", function () {
  const yearSelect = document.getElementById("yearSelect");
  const makeSelect = document.getElementById("makeSelect");
  const modelSelect = document.getElementById("modelSelect");

  const bodyStyleSelect = document.getElementById("bodyStyleSelect");
  const DEFAULT_BODY_STYLES = ["SUV", "Wagon", "Truck", "Sedan", "Van"];

  const manualYear = document.getElementById("manualYear");

  const yearManual = document.getElementById("yearManual");
  const makeManual = document.getElementById("makeManual");
  const modelManual = document.getElementById("modelManual");

  function setRequiredState(selectEl, manualEl, checkbox) {
    if (checkbox && checkbox.checked) {
      selectEl.required = false;
      manualEl.style.display = "";
      selectEl.style.display = "none";
      manualEl.required = true;
    } else {
      selectEl.required = true;
      manualEl.style.display = "none";
      selectEl.style.display = "";
      manualEl.required = false;
    }
  }

  function clearOptions(selectEl, placeholder) {
    selectEl.innerHTML = "";
    if (placeholder) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = placeholder;
      opt.disabled = true;
      opt.selected = true;
      selectEl.appendChild(opt);
    }
  }

  function populateYears() {
    const years = Array.from(new Set(carData.map((c) => c.year))).sort(
      (a, b) => b - a
    );
    clearOptions(yearSelect, "Select year");
    years.forEach((y) => {
      const o = document.createElement("option");
      o.value = y;
      o.textContent = y;
      yearSelect.appendChild(o);
    });
  }

  function populateMakesForYear(year) {
    clearOptions(makeSelect, "Select make");
    const makes = Array.from(
      new Set(
        carData
          .filter((c) => String(c.year) === String(year))
          .map((c) => c.make)
      )
    ).sort();
    makes.forEach((m) => {
      const o = document.createElement("option");
      o.value = m;
      o.textContent = m;
      makeSelect.appendChild(o);
    });
  }

  function populateModelsForYearMake(year, make) {
    clearOptions(modelSelect, "Select model");
    const models = Array.from(
      new Set(
        carData
          .filter((c) => String(c.year) === String(year) && c.make === make)
          .map((c) => c.model)
      )
    ).sort();
    models.forEach((m) => {
      const o = document.createElement("option");
      o.value = m;
      o.textContent = m;
      modelSelect.appendChild(o);
    });
  }

  function populateBodyStylesFor(year, make, model) {
    if (!bodyStyleSelect) return;
    clearOptions(bodyStyleSelect, "Select body style");

    // find matching entries
    const matches =
      year && make && model
        ? carData.filter(
            (c) =>
              String(c.year) === String(year) &&
              c.make === make &&
              c.model === model
          )
        : [];

    // always produce a new array
    let styles;
    if (matches.length === 0) {
      // copy of DEFAULT_BODY_STYLES
      styles = [...DEFAULT_BODY_STYLES];
    } else {
      styles = Array.from(new Set(matches.flatMap((m) => m.body_styles || [])));
      // if no body_styles found, fall back to DEFAULT_BODY_STYLES
      if (styles.length === 0) {
        styles = [...DEFAULT_BODY_STYLES];
      }
    }

    styles.sort();
    styles.forEach((s) => {
      const o = document.createElement("option");
      o.value = s;
      o.textContent = s;
      bodyStyleSelect.appendChild(o);
    });

    // Required logic
    if (manualYear && manualYear.checked) {
      bodyStyleSelect.required = true;
    } else {
      bodyStyleSelect.required =
        bodyStyleSelect.options.length > 1 ||
        (bodyStyleSelect.options.length === 1 &&
          bodyStyleSelect.options[0].value !== "");
    }
  }

  // Load JSON data
  fetch("assets/cars92to24.json")
    .then((r) => (r.ok ? r.json() : Promise.reject("Failed to load")))
    .then((json) => {
      carData = json;
      populateYears();
      // when year changes populate makes
      yearSelect.addEventListener("change", function () {
        if (!this.value) return;
        populateMakesForYear(this.value);
        // reset model
        clearOptions(modelSelect, "Select model");
      });
      // when make changes populate models
      makeSelect.addEventListener("change", function () {
        if (!this.value || !yearSelect.value) return;
        populateModelsForYearMake(yearSelect.value, this.value);
      });

      // when model changes populate body styles
      modelSelect.addEventListener("change", function () {
        populateBodyStylesFor(yearSelect.value, makeSelect.value, this.value);
      });
    })
    .catch((err) => {
      console.error("Error loading car data:", err);
    });

  // Manual toggles
  if (manualYear)
    manualYear.addEventListener("change", function (e) {
      setRequiredState(yearSelect, yearManual, manualYear);
      setRequiredState(makeSelect, makeManual, manualYear);
      setRequiredState(modelSelect, modelManual, manualYear);
      clearOptions(makeSelect, "Select a make");
      clearOptions(modelSelect, "Select a model");
      populateBodyStylesFor(yearSelect.value, null, null);
	  populateMakesForYear(yearSelect.value);
    });
  // Initialize required/display state
  setRequiredState(yearSelect, yearManual, manualYear);
  setRequiredState(makeSelect, makeManual, manualYear);
  setRequiredState(modelSelect, modelManual, manualYear);
  clearOptions(makeSelect, "Select a make");
  clearOptions(modelSelect, "Select a model");
  populateBodyStylesFor(null, null, null);

  // If user resets the form, restore selects and hide manual inputs
  const form = document.getElementById("vehicleAddForm");
  if (form) {
    form.addEventListener("reset", () => {
      // small timeout to allow native reset to clear values first
      setTimeout(() => {
        if (manualYear) manualYear.checked = false;
        setRequiredState(yearSelect, yearManual, manualYear);
        setRequiredState(makeSelect, makeManual, manualYear);
        setRequiredState(modelSelect, modelManual, manualYear);
        // clear manual fields
        if (yearManual) yearManual.value = "";
        if (makeManual) makeManual.value = "";
        if (modelManual) modelManual.value = "";
        clearOptions(makeSelect, "Select a make");
        clearOptions(modelSelect, "Select a model");
        // Clear body style options since model changed (will populate when model selected)
        if (bodyStyleSelect) populateBodyStylesFor(yearSelect.value, null, null);
		populateMakesForYear(yearSelect.value);
		}, 10);
    });
  }
});
