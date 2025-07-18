let currentCenterSlide = 0; // Current index for the center slide
let approvedTestimonials = []; // Approved testimonials array
let changingSlide = false;

async function fetchApprovedTestimonials() {
  approvedTestimonials = []; // Reset approved testimonials array
  currentCenterSlide = 0; // Reset current center slide index
  const slideshowWrapper = document.querySelector(".slideshow__wrapper");
  let loadingBar = slideshowWrapper.querySelector(".slideshow__loading-bar");

  if (!loadingBar) {
    loadingBar = document.createElement("div");
    loadingBar.className = "slideshow__loading-bar";
    slideshowWrapper.appendChild(loadingBar);
  }

  loadingBar.style.display = "block"; // Show loading bar

  const token = getTokenFromSession ? getTokenFromSession() : null;
  try {
    let response;
    if (token) {
      response = await fetch(`${URL_BASE}/api/testimonials/approved`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
    } else {
      response = await fetch(`${URL_BASE}/api/testimonials/approved`, {
        method: "GET",
      });
    }
    if (!response.ok) throw new Error("Failed to fetch approved testimonials");
    approvedTestimonials = await response.json();
    //showAlert("Approved testimonials fetched successfully!", false, slideshowWrapper);
  } catch (error) {
    console.error("Error fetching approved testimonials:", error);
    approvedTestimonials = [];
    showAlert(
      "Error fetching approved testimonials. Please try again later.",
      true,
      slideshowWrapper
    );
  } finally {
    loadingBar.style.display = "none"; // Hide loading bar
  }
}

async function displaySlides() {
  const slides = document.querySelector(".slideshow");
  slides.innerHTML =
    '<div class="slideshow__slide slideshow__slide--blank"><p style="color:#0e0e0e;">No approved testimonials available, please try again later...</p></div>';
  const slideIndices = [];
  const deleteButton = document.getElementById("deleteButton");

  if (!approvedTestimonials || approvedTestimonials.length === 0) {
    changingSlide = false;
    const prevButton = document.querySelector(".slideshow__nav-btn--prev");
    const nextButton = document.querySelector(".slideshow__nav-btn--next");
    prevButton.style.opacity = 0.5;
    nextButton.style.opacity = 0.5;
    prevButton.style.pointerEvents = "none";
    nextButton.style.pointerEvents = "none";
    if (deleteButton) {
      deleteButton.disabled = true;
      deleteButton.style.opacity = 0.5;
      deleteButton.style.pointerEvents = "none";
    }
    return;
  }

  if (deleteButton) {
    deleteButton.disabled = false;
    deleteButton.style.opacity = 1;
    deleteButton.style.pointerEvents = "auto";
  }

  if (approvedTestimonials.length === 1) {
    slideIndices.push(currentCenterSlide);
  } else if (approvedTestimonials.length === 2) {
    slideIndices.push(
      currentCenterSlide,
      (currentCenterSlide + 1) % approvedTestimonials.length
    );
  } else if (approvedTestimonials.length >= 3) {
    slideIndices.push(
      (currentCenterSlide - 1 + approvedTestimonials.length) %
        approvedTestimonials.length,
      currentCenterSlide,
      (currentCenterSlide + 1) % approvedTestimonials.length
    );
  }
  const twoSlides = approvedTestimonials.length === 2;
  const createSlideContent = async (testimonial, index) => {
    const slide = document.createElement("div");
    slide.className = twoSlides
      ? "slideshow__slide slideshow__slide--dual"
      : "slideshow__slide";
    slide.innerHTML = `<p style="color:#0e0e0e;">"${testimonial.testimonial}"</p>`;
    await fetchAndDisplayUserInfo(testimonial.user_id, slide);
    slides.appendChild(slide);
  };
  slides.innerHTML = "";
  if (slideIndices.length) {
    for (let i = 0; i < slideIndices.length; i++) {
      const index = slideIndices[i];
      await createSlideContent(approvedTestimonials[index], i);
      await new Promise((resolve) => setTimeout(resolve, 125));
    }
  }
  updateNavButtons();
}

function updateNavButtons() {
  const prevButton = document.querySelector(".slideshow__nav-btn--prev");
  const nextButton = document.querySelector(".slideshow__nav-btn--next");
  prevButton.style.opacity = approvedTestimonials.length > 1 ? 1 : 0.5;
  nextButton.style.opacity = approvedTestimonials.length > 1 ? 1 : 0.5;
  prevButton.style.pointerEvents =
    approvedTestimonials.length > 1 ? "auto" : "none";
  nextButton.style.pointerEvents =
    approvedTestimonials.length > 1 ? "auto" : "none";
  changingSlide = false;
}

function changeSlide(direction) {
  if (approvedTestimonials.length > 1 && !changingSlide) {
    changingSlide = true;
    const slides = document.querySelectorAll(".slideshow__slide");
    slides.forEach((slide) => {
      slide.classList.remove("slide-enter", "slide-enter2");
      slide.classList.add("slideshow__slide--leave");
    });
    setTimeout(() => {
      currentCenterSlide =
        (currentCenterSlide + direction + approvedTestimonials.length) %
        approvedTestimonials.length;
      displaySlides();
    }, 250);
  }
}

async function deleteTestimonial(id) {
  const confirmDelete = confirm(
    "Are you sure you want to delete this testimonial?"
  );
  if (!confirmDelete) {
    return;
  }

  const token = getTokenFromSession && getTokenFromSession();
  if (!token) {
    window.location.href = "/";
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
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete testimonial");
    }
    approvedTestimonials = approvedTestimonials.filter(
      (testimonial) => testimonial.id !== id
    );
    displaySlides();
    showAlert(
      "Testimonial deleted successfully!",
      false,
      document.querySelector(".slideshow__wrapper")
    );
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    showAlert(
      error.message || "Error deleting testimonial. Please try again later.",
      true,
      document.querySelector(".slideshow__wrapper")
    );
  } finally {
    if (loadingBar) loadingBar.style.display = "none";
  }
}

async function fetchAndDisplayUserInfo(userId, element) {
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
      element.innerHTML += `<p style="color:#0e0e0e;" class="slideshow__user">- Deleted User</p>`;
      return;
    }
    const user = await response.json();
    const city = user.city || "";
    const state = user.state || "";
    const country = user.country || "";
    const firstCharofLastName = user.last_name?.charAt(0) ?? "";
    element.innerHTML += `<p  style="color:#0e0e0e;" class="slideshow__user">- ${user.first_name} ${firstCharofLastName}, ${city}, ${state}, ${country}</p>`;
  } catch (error) {
    console.log("Error fetching user information:", error);
    element.innerHTML += `<p  style="color:#0e0e0e;" class="slideshow__user">- Unknown User</p>`;
  }
}

window.addEventListener("authChecked", async function () {
  await fetchApprovedTestimonials();
  displaySlides();

  // Add click-to-refresh on approved testimonials slideshow wrapper, excluding nav buttons
  const wrapper = document.querySelector(".slideshow__wrapper");
  if (wrapper) {
    let isRefreshing = false;
    wrapper.addEventListener("click", async function (e) {
      const navBtn = e.target.closest(
        ".slideshow__nav-btn--prev, .slideshow__nav-btn--next"
      );
      if (navBtn || isRefreshing) return;
      isRefreshing = true;
      try {
        await fetchApprovedTestimonials();
        displaySlides();
      } finally {
        isRefreshing = false;
      }
    });
  }

  const deleteButton = document.getElementById("deleteButton");
  deleteButton?.addEventListener("click", async function () {
    const currentTestimonial = approvedTestimonials[currentCenterSlide];
    if (currentTestimonial) {
      await deleteTestimonial(currentTestimonial.id);
    }
  });
});
