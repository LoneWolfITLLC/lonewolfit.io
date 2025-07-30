async function deleteUserTestimonial(id) {
  const slideshowWrapper = document.getElementById("selfTestimonialSlideshow");
  if (!id) return;
  confirmModal(
    "Are you sure you want to delete this testimonial?",
    async function (confirmDelete) {
      if (!confirmDelete) return;
      let token =
        typeof getTokenFromSession === "function"
          ? getTokenFromSession()
          : null;
      showLoading();
      try {
        const response = await fetch(
          `${URL_BASE}/api/user/delete-testimonial`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ testimonialId: id }),
          }
        );
        const data = await response.json();
        if (!response.ok) {
          if (data.message && data.message.trim() === "Malformed token") {
            hideLoading();
            alertModal("Token expired. Please login again...", true);
            if (loadingBar) loadingBar.style.display = "none";
            updateNavButtons();
            setTimeout(() => {
              window.location.href = "login.html";
            }, 3000);
            return;
          }
          hideLoading();
          showAlert(
            data.message || "Error deleting testimonial.",
            true,
            slideshowWrapper
          );
          return;
        }
        // Remove deleted testimonial from array
        userTestimonials = userTestimonials.filter((t) => t.id !== id);
        // Adjust current slide index if needed
        if (currentUserSlide >= userTestimonials.length) {
          currentUserSlide = Math.max(0, userTestimonials.length - 1);
        }
        await fetchUserTestimonials(); // Refresh user testimonials
        await displayUserSlides(); // Update display
        await fetchTestimonials(); // Refresh public testimonials
        await displaySlides(); // Update public slides
        showAlert("Testimonial deleted successfully!", false, slideshowWrapper);
      } catch (error) {
        hideLoading();
        showAlert(
          "Network error deleting testimonial.",
          true,
          slideshowWrapper
        );
      }
    }
  );
}
// User Testimonial Slideshow: displays testimonials for the logged-in user
let userTestimonials = [];
let currentUserSlide = 0;

async function fetchUserTestimonials() {
  userTestimonials = [];
  currentUserSlide = 0;
  const slideshowWrapper = document.getElementById("selfTestimonialSlideshow");
  let loadingBar = slideshowWrapper
    ? slideshowWrapper.querySelector(".slideshow__loading-bar")
    : null;
  if (!loadingBar && slideshowWrapper) {
    loadingBar = document.createElement("div");
    loadingBar.className = "slideshow__loading-bar";
    slideshowWrapper.appendChild(loadingBar);
  }
  if (loadingBar) loadingBar.style.display = "block";

  let token =
    typeof getTokenFromSession === "function" ? getTokenFromSession() : null;
  if (!token) {
    if (loadingBar) loadingBar.style.display = "none";
    alertModal("You must be logged in to view your testimonials.");
    return;
  }
  try {
    const response = await fetch(`${URL_BASE}/api/users/testimonials`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const data = await response.json();
      if (data.message && data.message.trim() === "Malformed token") {
        alertModal("Token expired. Please login again...", true);
        setTimeout(() => {
          window.location.href = "login.html";
        }, 3000);
        userTestimonials = [];
        return;
      }
      showAlert(
        data.message || "Error retrieving testimonials.",
        true,
        slideshowWrapper
      );
      userTestimonials = [];
      return;
    }
    userTestimonials = await response.json();
  } catch (error) {
    showAlert("Network error retrieving testimonials.", true, slideshowWrapper);
    userTestimonials = [];
  } finally {
    if (loadingBar) loadingBar.style.display = "none";
  }
}

function displayUserSlides() {
  const slideshowWrapper = document.getElementById("selfTestimonialSlideshow");
  if (!slideshowWrapper) return;
  const slides = slideshowWrapper.querySelector(".slideshow");
  if (!slides) return;
  slides.innerHTML = "";
  if (!userTestimonials || userTestimonials.length === 0) {
    slides.innerHTML =
      '<div class="slideshow__slide slideshow__slide--blank"><p style="color:#0e0e0e;">No testimonials found for your account.</p></div>';
    updateUserNavButtons();
    return;
  }
  const slideIndices = [];
  if (userTestimonials.length === 1) {
    slideIndices.push(currentUserSlide);
  } else if (userTestimonials.length === 2) {
    slideIndices.push(
      currentUserSlide,
      (currentUserSlide + 1) % userTestimonials.length
    );
  } else if (userTestimonials.length >= 3) {
    slideIndices.push(
      (currentUserSlide - 1 + userTestimonials.length) %
        userTestimonials.length,
      currentUserSlide,
      (currentUserSlide + 1) % userTestimonials.length
    );
  }
  const twoSlides = userTestimonials.length === 2;
  slideIndices.forEach((index, i) => {
    const testimonial = userTestimonials[index];
    const slide = document.createElement("div");
    slide.className = twoSlides
      ? "slideshow__slide slideshow__slide--dual"
      : "slideshow__slide";
    slide.innerHTML = `<p style="color:#0e0e0e;">"${testimonial.testimonial}"</p>`;
    // Optionally show approval status
    slide.innerHTML += `<p class="slideshow__user" style="color:#0e0e0e;">${
      testimonial.approved ? "Approved" : "Pending Approval"
    }</p>`;
    slides.appendChild(slide);
  });
  updateUserNavButtons();
}

function updateUserNavButtons() {
  const deleteButton = document.getElementById("deleteButton");
  const slideshowWrapper = document.getElementById("selfTestimonialSlideshow");
  if (!slideshowWrapper) return;
  const prevButton = slideshowWrapper.querySelector(
    ".slideshow__nav-btn--prev"
  );
  const nextButton = slideshowWrapper.querySelector(
    ".slideshow__nav-btn--next"
  );
  const slidesExist = userTestimonials && userTestimonials.length > 0;
  const navEnabled = userTestimonials.length > 1;
  if (prevButton) {
    prevButton.style.opacity = navEnabled ? 1 : 0.5;
    prevButton.style.pointerEvents = navEnabled ? "auto" : "none";
    prevButton.disabled = !slidesExist || !navEnabled;
  }
  if (nextButton) {
    nextButton.style.opacity = navEnabled ? 1 : 0.5;
    nextButton.style.pointerEvents = navEnabled ? "auto" : "none";
    nextButton.disabled = !slidesExist || !navEnabled;
  }
  if (deleteButton) {
    deleteButton.disabled = userTestimonials.length === 0;
    deleteButton.style.opacity = userTestimonials.length === 0 ? 0.5 : 1;
    deleteButton.style.pointerEvents =
      userTestimonials.length === 0 ? "none" : "auto";
  }
}

function changeUserSlide(direction) {
  const slideshowWrapper = document.getElementById("selfTestimonialSlideshow");
  if (userTestimonials.length > 1 && slideshowWrapper) {
    const slides = slideshowWrapper.querySelectorAll(".slideshow__slide");
    slides.forEach((slide) => {
      slide.classList.remove("slide-enter", "slide-enter2");
      slide.classList.add("slideshow__slide--leave");
    });
    setTimeout(() => {
      currentUserSlide =
        (currentUserSlide + direction + userTestimonials.length) %
        userTestimonials.length;
      displayUserSlides();
    }, 250);
  }
}

window.addEventListener("authChecked", async function () {
  await fetchUserTestimonials();
  displayUserSlides();

  // Add click-to-refresh and nav button logic within selfTestimonialSlideshow wrapper
  const wrapper = document.getElementById("selfTestimonialSlideshow");
  if (wrapper) {
    let isRefreshing = false;
    wrapper.addEventListener("click", async function (e) {
      // Handle nav buttons
      const prevBtn = wrapper.querySelector(".slideshow__nav-btn--prev");
      const nextBtn = wrapper.querySelector(".slideshow__nav-btn--next");
      if (prevBtn && e.target.closest(".slideshow__nav-btn--prev")) {
        changeUserSlide(-1);
        return;
      }
      if (nextBtn && e.target.closest(".slideshow__nav-btn--next")) {
        changeUserSlide(1);
        return;
      }
      // Exclude nav buttons from refresh
      const navBtn = e.target.closest(
        ".slideshow__nav-btn--prev, .slideshow__nav-btn--next"
      );
      if (navBtn || isRefreshing) return;
      isRefreshing = true;
      try {
        await fetchUserTestimonials();
        displayUserSlides();
      } finally {
        isRefreshing = false;
      }
    });

    // Delete button logic
    const deleteButton = document.getElementById("deleteButton");
    if (deleteButton) {
      deleteButton.addEventListener("click", async function () {
        const currentTestimonial = userTestimonials[currentUserSlide];
        if (currentTestimonial) {
          await deleteUserTestimonial(currentTestimonial.id);
          // Update button state after deletion
          deleteButton.disabled = userTestimonials.length === 0;
          deleteButton.style.opacity = userTestimonials.length === 0 ? 0.5 : 1;
          deleteButton.style.pointerEvents =
            userTestimonials.length === 0 ? "none" : "auto";
        }
      });
      // Initial button state
      deleteButton.disabled = userTestimonials.length === 0;
      deleteButton.style.opacity = userTestimonials.length === 0 ? 0.5 : 1;
      deleteButton.style.pointerEvents =
        userTestimonials.length === 0 ? "none" : "auto";
    }
  }
});
