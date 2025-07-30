window.addEventListener("authChecked", function () {
  const form = document.getElementById("testimonialForm");
  if (!form) return;
  const textarea = document.getElementById("testimonialText");
  const checkbox = document.getElementById("checkboxConsent");
  const submitBtn = form.querySelector("button[type='submit']");
  const minChars = 10;
  const maxChars =
    typeof window.MAX_CHARACTER_COUNT === "number"
      ? window.MAX_CHARACTER_COUNT
      : 250;
  const alertDiv = document.getElementById("alertUserSubmission");

  function validate() {
    const textLen = textarea.value.trim().length;
    const isChecked = checkbox.checked;
    const valid = textLen >= minChars && textLen <= maxChars && isChecked;
    submitBtn.disabled = !valid;
  }

  textarea.addEventListener("input", validate);
  checkbox.addEventListener("change", validate);
  validate();

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (submitBtn.disabled) return;
    showLoading();
    let token =
      typeof getTokenFromSession === "function" ? getTokenFromSession() : null;
    try {
      const response = await fetch(URL_BASE + "/api/submit-testimonial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ testimonial: textarea.value.trim() }),
      });
      const data = await response.json();
      if (response.ok) {
        window.location.hash = "#userSubmissionSection";
        hideLoading();
        alertModal(data.message || "Submitted your testimonial!");
        await fetchUserTestimonials(); // Refresh user testimonials
        await displayUserSlides(); // Update user slides
        textarea.value = "";
        checkbox.checked = false;
        validate();
        // Reset character count display if present
        var charCountElem = document.getElementById("characterCount");
        if (charCountElem) {
          charCountElem.textContent = `0/${maxChars} characters`;
        }
        await fetchTestimonials(); // Refresh public testimonials
        await displaySlides(); // Update public slides
        setTimeout(() => {
          window.location.hash = "#selfTestimonialSection";
        }, 2000);
      } else {
        hideLoading();
        window.location.hash = "#userSubmissionSection";
        alertModal(data.message || "An error occurred. Please try again.");
        if (data.message && data.message.trim() === "Malformed token") {
          alertModal("Token expired. Please login again...", true);
          setTimeout(() => {
            window.location.href =
              "login.html?redirect_uri=submit_testimonial.html#userSubmissionSection";
          }, 2000);
          return;
        }
      }
    } catch (error) {
      hideLoading();
      window.location.hash = "#userSubmissionSection";
      alertModal(
        `Unable to submit testimonial. Error: ${
          error && error.toString ? error.toString() : String(error)
        }`
      );
    }
  });
});
