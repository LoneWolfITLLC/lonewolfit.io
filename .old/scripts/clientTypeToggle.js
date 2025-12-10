window.addEventListener("preAuthChecked", async () => {
  const toggle = document.getElementById("clientTypeToggle");
  const residentialSection = document.getElementById(
    "registerSectionResidential"
  );
  const businessSection = document.getElementById("registerSectionBusiness");

  // Initial state: show residential, hide business
  residentialSection.style.display = "block";
  businessSection.style.display = "none";

  toggle.addEventListener("click", function () {
    toggleClientType();
  });
});
let isBusiness = false;
function toggleClientType() {
  const toggle = document.getElementById("clientTypeToggle");
  const residentialSection = document.getElementById(
    "registerSectionResidential"
  );
  const businessSection = document.getElementById("registerSectionBusiness");
  isBusiness = !isBusiness;
  if (isBusiness) {
    // Hide residential, show business with fadeIn
    residentialSection.style.display = "none";
    businessSection.style.display = "block";
    businessSection.classList.remove("fadeIn");
    void businessSection.offsetWidth; // Force reflow for animation restart
    businessSection.classList.add("fadeIn");
  } else {
    // Hide business, show residential with fadeIn
    businessSection.style.display = "none";
    residentialSection.style.display = "block";
    residentialSection.classList.remove("fadeIn");
    void residentialSection.offsetWidth; // Force reflow for animation restart
    residentialSection.classList.add("fadeIn");
  }
  toggle.classList.toggle("active", isBusiness);
}
