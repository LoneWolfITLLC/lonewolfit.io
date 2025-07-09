// Helper to show alert and auto-hide after 3s, using the alertDiv within the parent section
function showAlert(message, isError, formElem) {
  let alertDiv;
  if (formElem) {
    alertDiv = formElem.closest("section")?.querySelector(".alertDiv");
    if(!alertDiv) alertDiv = formElem.querySelector(".alertDiv");
    if(!alertDiv) alertDiv = formElem;
  }
  if (!alertDiv) {
    // fallback to global alert if not found
    alertDiv = document.getElementById("alert");
  }
  alertDiv.style.display = "block";
  alertDiv.style.opacity = "1";
  alertDiv.innerHTML = message;
  alertDiv.style.backgroundColor = isError ? "#dc3545" : "#28a745"; // Red for error, green for success
  alertDiv.style.boxShadow = isError
    ? "0 3px 15px rgba(255, 0, 0, 0.5)"
    : "0 3px 15px rgba(0, 255, 0, 0.5)";
  alertDiv.style.color = "#fff";
  // Fade out after 3 seconds
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
