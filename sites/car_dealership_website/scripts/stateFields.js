window.addEventListener("preAuthChecked",  async function (event) {
  // Handle all country/state pairs for residential
  document.querySelectorAll("#country").forEach((countrySelect) => {
    const stateSelect = countrySelect.closest("form").querySelector("#state");

    if (!stateSelect) return;

    countrySelect.addEventListener("change", function () {
      const selectedCountry = this.value;

      stateSelect.innerHTML = "";
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Loading states...";
      stateSelect.appendChild(option);

      if (selectedCountry) {
        // Fetch states based on the selected country
        fetch("./assets/iso-3166-2.json")
          .then((response) => {
            if (!response.ok)
              throw new Error("Failed to fetch ISO-3166-2 data");
            return response.json();
          })
          .then((data) => {
            // Assuming the JSON structure has country codes as keys
            const subdivisions = data[selectedCountry]?.divisions; // Adjust based on actual structure
            if (subdivisions) {
              stateSelect.innerHTML = ""; // Clear existing options
              const defaultOption = document.createElement("option");
              defaultOption.value = "";
              defaultOption.textContent = "Select a state";
              stateSelect.appendChild(defaultOption);

              Object.entries(subdivisions).forEach(([code, name]) => {
                const option = document.createElement("option");
                option.value = code; // ISO-3166-2 code
                option.textContent = name; // Subdivision name
                stateSelect.appendChild(option);
              });
            } else {
              throw new Error("No subdivisions found for the selected country");
            }
          })
          .catch((err) => {
            console.error("Error fetching or processing ISO-3166-2 data:", err);
            stateSelect.innerHTML = ""; // Clear options
            const errorOption = document.createElement("option");
            errorOption.value = "";
            errorOption.textContent = "Error loading states";
            stateSelect.appendChild(errorOption);
          });
      } else {
        stateSelect.innerHTML = "";
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Select a state";
        stateSelect.appendChild(option);
      }
    });

    // Initialize if pre-selected
    if (countrySelect.value) {
      countrySelect.dispatchEvent(new Event("change"));
    }
  });

  // Handle all business country/state pairs
  document
    .querySelectorAll("#businessCountry")
    .forEach((businessCountrySelect) => {
      const businessStateSelect = businessCountrySelect
        .closest("form")
        .querySelector("#businessState");

      if (!businessStateSelect) return;

      businessCountrySelect.addEventListener("change", function () {
        const selectedCountry = this.value;
        businessStateSelect.innerHTML = "";

        if (selectedCountry) {
          fetch("./assets/iso-3166-2.json")
            .then((response) => {
              if (!response.ok)
                throw new Error("Failed to fetch ISO-3166-2 data");
              return response.json();
            })
            .then((data) => {
              const subdivisions = data[selectedCountry]?.divisions;
              if (subdivisions) {
                businessStateSelect.innerHTML = "";
                const defaultOption = document.createElement("option");
                defaultOption.value = "";
                defaultOption.textContent = "Select a state";
                businessStateSelect.appendChild(defaultOption);

                Object.entries(subdivisions).forEach(([code, name]) => {
                  const option = document.createElement("option");
                  option.value = code;
                  option.textContent = name;
                  businessStateSelect.appendChild(option);
                });
              } else {
                throw new Error(
                  "No subdivisions found for the selected country"
                );
              }
            })
            .catch((err) => {
              console.error("Error processing ISO-3166-2 data:", err);
              businessStateSelect.innerHTML = "";
              const errorOption = document.createElement("option");
              errorOption.value = "";
              errorOption.textContent = "Error loading states";
              businessStateSelect.appendChild(errorOption);
            });
        } else {
          const defaultOption = document.createElement("option");
          defaultOption.value = "";
          defaultOption.textContent = "Select a state";
          businessStateSelect.appendChild(defaultOption);
        }
      });

      // Initialize if pre-selected
      if (businessCountrySelect.value) {
        businessCountrySelect.dispatchEvent(new Event("change"));
      }
    });
  document
    .querySelectorAll("#countryBusiness")
    .forEach((businessCountrySelect) => {
      const businessStateSelect = businessCountrySelect
        .closest("form")
        .querySelector("#stateBusiness");

      if (!businessStateSelect) return;

      businessCountrySelect.addEventListener("change", function () {
        const selectedCountry = this.value;
        businessStateSelect.innerHTML = "";

        if (selectedCountry) {
          fetch("./assets/iso-3166-2.json")
            .then((response) => {
              if (!response.ok)
                throw new Error("Failed to fetch ISO-3166-2 data");
              return response.json();
            })
            .then((data) => {
              const subdivisions = data[selectedCountry]?.divisions;
              if (subdivisions) {
                businessStateSelect.innerHTML = "";
                const defaultOption = document.createElement("option");
                defaultOption.value = "";
                defaultOption.textContent = "Select a state";
                businessStateSelect.appendChild(defaultOption);

                Object.entries(subdivisions).forEach(([code, name]) => {
                  const option = document.createElement("option");
                  option.value = code;
                  option.textContent = name;
                  businessStateSelect.appendChild(option);
                });
              } else {
                throw new Error(
                  "No subdivisions found for the selected country"
                );
              }
            })
            .catch((err) => {
              console.error("Error processing ISO-3166-2 data:", err);
              businessStateSelect.innerHTML = "";
              const errorOption = document.createElement("option");
              errorOption.value = "";
              errorOption.textContent = "Error loading states";
              businessStateSelect.appendChild(errorOption);
            });
        } else {
          const defaultOption = document.createElement("option");
          defaultOption.value = "";
          defaultOption.textContent = "Select a state";
          businessStateSelect.appendChild(defaultOption);
        }
      });

      // Initialize if pre-selected
      if (businessCountrySelect.value) {
        businessCountrySelect.dispatchEvent(new Event("change"));
      }
    });
});
