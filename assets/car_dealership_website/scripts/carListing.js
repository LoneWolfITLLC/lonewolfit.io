window.addEventListener("authChecked", (details) => {
  initCarListing();
});

let car = [];
let imagesArray = [];
let currentImage = 0;

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

async function initCarListing() {
  const id = getQueryParam("id");
  if (!id) return;

  const container = document.getElementById("usedCarContainer");
  const slideshowContainer = document.getElementById(
    "carPictureSlideshowContainer"
  );
  const titleElem = document.getElementById("usedCarTitle");

  // detail elements
  const descriptionElem = container
    ? container.querySelector(".car__description")
    : null;
  const priceElem = container ? container.querySelector(".car__price") : null;
  const mileageElem = container
    ? container.querySelector(".car__mileage")
    : null;
  const trimElem = container ? container.querySelector(".car__trim") : null;
  const bodyStyleElem = container
    ? container.querySelector(".car__bodystyle")
    : null;
  const colorElem = container ? container.querySelector(".car__color") : null;
  const vinElem = container ? container.querySelector(".car__vin") : null;
  const statusElem = container
    ? container.querySelector(".car__status")
    : null;
  const modifiedElem = container
    ? container.querySelector(".car__listing-modified")
    : null;
  const createdElem = container
    ? container.querySelector(".car__listing-created")
    : null;
  const mapRow = document.getElementById("carLocationContainer");
  showLoadingModal();
  try {
    const res = await fetch(
      `${URL_BASE}/api/cars/used/${encodeURIComponent(id)}`
    );
    if (!res.ok) {
      hideLoadingModal();
      let errJson = {};
      try {
        errJson = await res.json();
      } catch (e) {}
      alertModal((errJson.message || "Failed to load car.") + " [Will redirect in 3 seconds]", false);
      setTimeout(() => {
        window.location.href = "inventory.html";
      }, 3000);
      return;
    }
    const data = await res.json();
    car = data;

    // Title
    if (titleElem)
      titleElem.textContent = `${car.year || ""} ${car.make || ""} ${
        car.model || ""
      }`.trim();
    document.title = `${car.year || ""} ${car.make || ""} ${
        car.model || ""
      } | `+document.title;

    // Details (fill with safe fallbacks)
    if (descriptionElem) descriptionElem.textContent = `${car.description}`;
    if (priceElem)
      priceElem.textContent = car.price
        ? `$${Number(car.price).toLocaleString()}`
        : "Price: N/A";
    if (mileageElem)
      mileageElem.textContent = car.mileage
        ? `Mileage: ${Number(car.mileage).toLocaleString()} miles`
        : "Mileage: N/A";
    if (trimElem)
      trimElem.textContent = car.trim ? `Trim: ${car.trim}` : "Trim: N/A";
    if (bodyStyleElem)
      bodyStyleElem.textContent = car.body_style
        ? `Body Style: ${car.body_style}`
        : car.bodyStyle || "Body Style: N/A";
    if (colorElem)
      colorElem.textContent = car.color ? `Color: ${car.color}` : "Color: N/A";
    if (vinElem) vinElem.textContent = car.vin ? `VIN: ${car.vin}` : "VIN: N/A";
    if (statusElem)
      statusElem.textContent = car.status
        ? `Status: ${car.status}`
        : "Status: N/A";
    if (modifiedElem)
      modifiedElem.textContent = car.modified_at
        ? `Listing Modified: ${new Date(car.modified_at).toLocaleString()}`
        : "";
    if (createdElem)
      createdElem.textContent = car.created_at
        ? `Listing Created: ${new Date(car.created_at).toLocaleString()}`
        : "";

    // Build slideshow -- normalize car.images which may be a JSON-string
    if (slideshowContainer) {
      if (Array.isArray(car.images)) {
        imagesArray = car.images.slice();
      } else if (typeof car.images === "string") {
        // images may come back as a JSON-encoded string like "[\"url1\",\"url2\"]"
        try {
          const parsed = JSON.parse(car.images);
          if (Array.isArray(parsed)) imagesArray = parsed.slice();
          else if (typeof parsed === "string")
            imagesArray = parsed.split(",").map((s) => s.trim());
        } catch (e) {
          // fallback: comma-separated list
          imagesArray = car.images.split(",").map((s) => s.trim());
        }
      }

      // sanitize entries: remove surrounding quotes and empty strings
      imagesArray = imagesArray
        .map((s) =>
          String(s)
            .replace(/^\s+|\s+$/g, "")
            .replace(/^"|"$/g, "")
        )
        .filter((s) => s.length > 0);

      buildSlideshow(slideshowContainer, imagesArray);
    }

    // Build map/info
    if (mapRow) {
      // clear any children
      mapRow.innerHTML = "";

      const mapContainer = document.createElement("div");
      mapContainer.className = "map-container";
      mapContainer.setAttribute("aria-hidden", "false");

      const iframe = document.createElement("iframe");
      const loc = car.location
        ? String(car.location).replace(/[\s,]+/g, "+")
        : "";
      iframe.src = `https://www.google.com/maps?q=Buy+Smart+Auto+Sales+365+${loc}&z=15&output=embed`;
      iframe.title = `Buy Smart Auto Sales 365 — ${car.location || ""}`;
      iframe.loading = "lazy";
      iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");

      mapContainer.appendChild(iframe);

      const aside = document.createElement("aside");
      aside.className = "map-info";
      aside.setAttribute("aria-label", "Dealership address and contact");

      const h3 = document.createElement("h3");
      h3.className = "main__heading";
      h3.textContent = "Car Location";

      const address = document.createElement("address");
      address.className = "main__text";
      address.textContent = car.location || "";

      const p = document.createElement("p");
      p.className = "main__text";
      p.textContent =
        "Visit us at the address to the left/above to view current listing or call ahead to schedule an appointment.";

      aside.appendChild(h3);
      aside.appendChild(address);
      aside.appendChild(p);

      mapRow.appendChild(mapContainer);
      mapRow.appendChild(aside);
    }
    hideLoadingModal();
  } catch (err) {
    console.error("Error loading car:", err);
    hideLoadingModal();
    alertModal(
      err.message || "An unexpected error occurred while loading the car."
    );
  }
}

function openCarImagePreviewModal(imgSrc) {
  const previewModal = document.getElementById("preview-modal");
  const modalImgElm = previewModal.querySelector(".modal__image");
  if (!imgSrc || !previewModal || !modalImgElm) return;
  if(previewModal.classList.contains("modal_is-opened")) return;
  modalImgElm.src = imgSrc;
  modalImgElm.alt = car
    ? `${car.year} ${car.make} ${car.model} used car image`
    : "Used car image";
  openImageModal(previewModal);
}

function buildSlideshow(rootEl, images) {
  // Clear root
  rootEl.innerHTML = "";

  const block = document.createElement("div");
  block.className = "car-slideshow";

  const track = document.createElement("div");
  track.className = "car-slideshow__track";

  const slides = [];
  images.forEach((src, idx) => {
    const slide = document.createElement("div");
    slide.className = "car-slideshow__slide";
    slide.setAttribute("data-index", String(idx));

    const img = document.createElement("img");
    img.className = "car-slideshow__img";
    img.src = src;
    img.alt = `Car image ${idx + 1}`;
    img.onclick = () => {
      openCarImagePreviewModal(img.src);
    };

    slide.appendChild(img);
    track.appendChild(slide);
    slides.push(slide);
  });

  // If no images, show placeholder
  if (images.length === 0) {
    const slide = document.createElement("div");
    slide.className = "car-slideshow__slide car-slideshow__slide--placeholder";
    const p = document.createElement("p");
    p.textContent = "No images available";
    slide.appendChild(p);
    track.appendChild(slide);
    slides.push(slide);
  }

  // Navigation
  const nav = document.createElement("div");
  nav.className = "car-slideshow__nav";

  const prevBtn = document.createElement("button");
  prevBtn.className = "car-slideshow__btn car-slideshow__btn--prev";
  prevBtn.type = "button";
  prevBtn.setAttribute("aria-label", "Previous image");
  prevBtn.textContent = "<";

  const nextBtn = document.createElement("button");
  nextBtn.className = "car-slideshow__btn car-slideshow__btn--next";
  nextBtn.type = "button";
  nextBtn.setAttribute("aria-label", "Next image");
  nextBtn.textContent = ">";

  if (images.length === 0) {
    prevBtn.disabled = true;
    nextBtn.disabled = true;
  }

  nav.appendChild(prevBtn);
  nav.appendChild(nextBtn);

  block.appendChild(track);
  block.appendChild(nav);
  rootEl.appendChild(block);

  // Simple index-based navigation with sliding animation
  let animating = false;

  function showIndex(targetIndex) {
    if (slides.length === 0) return;
    if (animating) return;
    animating = true;

    // Capture intent before normalization
    const raw = targetIndex;

    // Normalize into bounds
    if (targetIndex < 0) targetIndex = slides.length - 1;
    if (targetIndex >= slides.length) targetIndex = 0;
    if (targetIndex === currentImage) return;

    if (raw === 0) {
      prevBtn.disabled = true;
    } else prevBtn.disabled = false;

    if (raw === slides.length - 1) nextBtn.disabled = true;
    else nextBtn.disabled = false;

    let direction;
    let outgoing, incoming;
    direction = targetIndex > currentImage ? "next" : "prev";
    outgoing = slides[currentImage];
    incoming = slides[targetIndex];

    // Clean up any lingering classes
    outgoing.classList.remove(
      "is-active",
      "enter-from-left",
      "enter-from-right",
      "exit-to-left",
      "exit-to-right"
    );
    incoming.classList.remove(
      "is-active",
      "enter-from-left",
      "enter-from-right",
      "exit-to-left",
      "exit-to-right"
    );

    // Show incoming only
    incoming.classList.add("is-active");
    incoming.style.display = "block";

    // Prepare slides for animation
    if (direction === "next") {
      // outgoing slides left, incoming enters from right
      incoming.classList.add("enter-from-right");
      // small reflow to ensure the browser picks up the starting transform
      //void incoming.offsetWidth;
      // animate outgoing
      outgoing.classList.add("exit-to-left");
    } else {
      // prev: outgoing slides right, incoming enters from left
      incoming.classList.add("enter-from-left");
      //void incoming.offsetWidth;
      outgoing.classList.add("exit-to-right");
    }

    //Update current index before the animation, this is for the keybinds to work properly...
    currentImage = targetIndex;

    // Once outgoing transition ends, hide it and remove transitional classes
    const onOutgoingTransitionEnd = (ev) => {
      // make sure we respond only to transform/opacity transition
      if (ev && ev.propertyName && !/transform|opacity/.test(ev.propertyName))
        return;
      outgoing.removeEventListener("transitionend", onOutgoingTransitionEnd);

      // hide outgoing and clean up classes
      try {
        outgoing.style.display = "none";
      } catch (e) {}
      outgoing.classList.remove(
        "is-active",
        "enter-from-left",
        "enter-from-right",
        "exit-to-left",
        "exit-to-right"
      );

      // keep incoming as the active slide (cleanup its transitional classes)
      incoming.classList.remove("enter-from-left", "enter-from-right");

      animating = false;
    };

    // Attach handler
    outgoing.addEventListener("transitionend", onOutgoingTransitionEnd);

    // Fallback: if transitionend doesn't fire (old browsers) ensure cleanup after duration
    const fallbackMs = 220;
    setTimeout(() => {
      if (outgoing && outgoing.style.display !== "none") {
        // force cleanup as above
        try {
          // In transition end cleanup
          outgoing.style.display = "none";
          incoming.style.display = "block"; // ensure incoming stays visible
        } catch (e) {}
        outgoing.classList.remove(
          "is-active",
          "enter-from-left",
          "enter-from-right",
          "exit-to-left",
          "exit-to-right"
        );
        incoming.classList.remove("enter-from-left", "enter-from-right");
        animating = false;
      }
    }, fallbackMs + 20);
  }

  prevBtn.addEventListener("click", () => showIndex(currentImage - 1));
  nextBtn.addEventListener("click", () => showIndex(currentImage + 1));

  block.focus();

  // keyboard support (keep on the block)
  document.addEventListener("keydown", (e) => {
    const previewModal = document.getElementById("preview-modal");
    if (previewModal.classList.contains("modal_is-opened")) return;
    if (e.key === "ArrowLeft") prevBtn.click();
    if (e.key === "ArrowRight") nextBtn.click();
    if (e.key === "Enter") openCarImagePreviewModal(imagesArray[currentImage]);
  });

  // initialize: show the first slide cleanly
  if (slides.length > 0) {
    slides.forEach((s) => {
      s.style.display = "none";
      s.classList.remove(
        "is-active",
        "enter-from-left",
        "enter-from-right",
        "exit-to-left",
        "exit-to-right",
        "slide-transition"
      );
    });
    slides[0].style.display = "block";
    slides[0].classList.add("is-active");
    prevBtn.disabled = true;
  }
  // set focusable
  prevBtn.tabIndex = 0;
  nextBtn.tabIndex = 0;
  animating = false;
  //Tell me why copilot the animations are not working for the slides...
}
