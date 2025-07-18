// --- BEM & ID updates for slideshow ---
let currentCenterSlide = 0; // Current index for the center slide
let testimonials = [];

async function fetchUserDetailsWithoutToken(userId) {
  try {
    const response = await fetch(
      URL_BASE + "/api/auth/get-user-details/withouttoken",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }
    );
    if (!response.ok) {
      console.error(
        `Error fetching user details: ${response.status} ${response.statusText}`
      );
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Network error fetching user details:", error);
    return null;
  }
}

async function displayErrorSlide() {
  const slides = document.querySelector(".slideshow");
  slides.innerHTML =
    '<div class="slideshow__slide slideshow__slide--blank"><p style="color:#0e0e0e;">Error loading available testimonials, please try again later or consult your technician...</p></div>';
}

async function displaySlides() {
  const slides = document.querySelector(".slideshow");
  slides.innerHTML =
    '<div class="slideshow__slide slideshow__slide--blank"><p style="color:#0e0e0e;">No testimonials available, please try again later...</p></div>';
  const slideIndices = [];
  if (!testimonials || testimonials.length === 0) {
    changingSlide = false;
    const prevButton = document.querySelector(".slideshow__nav-btn--prev");
    const nextButton = document.querySelector(".slideshow__nav-btn--next");
    prevButton.style.opacity = 0.5;
    nextButton.style.opacity = 0.5;
    prevButton.style.pointerEvents = "none";
    nextButton.style.pointerEvents = "none";
    return;
  }
  if (testimonials.length === 1) {
    slideIndices.push(currentCenterSlide);
  } else if (testimonials.length === 2) {
    slideIndices.push(
      currentCenterSlide,
      (currentCenterSlide + 1) % testimonials.length
    );
  } else if (testimonials.length >= 3) {
    slideIndices.push(
      (currentCenterSlide - 1 + testimonials.length) % testimonials.length,
      currentCenterSlide,
      (currentCenterSlide + 1) % testimonials.length
    );
  }
  const twoSlides = testimonials.length === 2;
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
      await createSlideContent(testimonials[index], i);
      await new Promise((resolve) => setTimeout(resolve, 125));
    }
  }
  updateNavButtons();
}

let changingSlide = false;
function updateNavButtons() {
  const prevButton = document.querySelector(".slideshow__nav-btn--prev");
  const nextButton = document.querySelector(".slideshow__nav-btn--next");
  prevButton.style.opacity = testimonials.length > 1 ? 1 : 0.5;
  nextButton.style.opacity = testimonials.length > 1 ? 1 : 0.5;
  prevButton.style.pointerEvents = testimonials.length > 1 ? "auto" : "none";
  nextButton.style.pointerEvents = testimonials.length > 1 ? "auto" : "none";
  changingSlide = false;
}
function changeSlide(direction) {
  if (testimonials.length > 1 && !changingSlide) {
    changingSlide = true;
    const slides = document.querySelectorAll(".slideshow__slide");
    slides.forEach((slide) => {
      slide.classList.remove("slide-enter", "slide-enter2");
      slide.classList.add("slideshow__slide--leave");
    });
    setTimeout(() => {
      currentCenterSlide =
        (currentCenterSlide + direction + testimonials.length) %
        testimonials.length;
      displaySlides();
    }, 250);
  }
}

// Fetch testimonials from backend and update the global testimonials array
async function fetchTestimonials() {
  testimonials = []; // Reset approved testimonials array
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
	response = await fetch(`${URL_BASE}/api/testimonials/approved`, {
	  method: "GET",
	});
    if (!response.ok) throw new Error("Failed to fetch testimonials");
    testimonials = await response.json();
    if (typeof shuffleArray === "function") shuffleArray(testimonials);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    testimonials = [];
  } finally {
    loadingBar.style.display = "none"; // Hide loading bar
  }
}

// Fetch and append user info to a testimonial slide element
async function fetchAndDisplayUserInfo(userId, element) {
  const loadingBar = document.getElementById("loadingBar");
  if (loadingBar) loadingBar.style.opacity = "1";
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
  } finally {
    if (loadingBar) loadingBar.style.opacity = "0";
  }
}

// Only extract what is needed for the slideshow
window.addEventListener("authChecked", async function () {
  // Fetch testimonials and display them after auth is checked
  await fetchTestimonials();
  displaySlides();

  // Add click-to-refresh on slideshow wrapper, excluding nav buttons
  const wrapper = document.querySelector(".slideshow__wrapper");
  if (wrapper) {
	let isRefreshing = false;
	wrapper.addEventListener("click", async function (e) {
	  // Exclude nav buttons (and their children)
	  const navBtn = e.target.closest(
		".slideshow__nav-btn--prev, .slideshow__nav-btn--next"
	  );
	  if (navBtn || isRefreshing) return;
	  isRefreshing = true;
	  try {
		await fetchTestimonials();
		displaySlides();
	  } finally {
		isRefreshing = false;
	  }
	});
  }
});
