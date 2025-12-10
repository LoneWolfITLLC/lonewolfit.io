/*
  favoriteCars.js
  - Fetches /api/users/cars/liked-cars to get liked car IDs
  - Fetches /api/cars/used/:id for each liked car to get full details
  - Renders cards into #favoriteCarContainer using createElement/append
  - Adds a top loading bar (.inventory__loading-bar) inside the container
  - Cards are clickable and navigate to car detail page (car.html?id=...)
  - Uses existing inventory.css styles
*/
window.addEventListener("authChecked", async function () {
  const URL_BASE = window.URL_BASE || ""; // fallback if not defined elsewhere
  const container = document.getElementById("favoriteCarContainer");
  if (!container) return;

  // create and prepend loading bar
  const loadingBar = document.createElement("div");
  loadingBar.className = "inventory__loading-bar";
  loadingBar.setAttribute("role", "status");
  loadingBar.setAttribute("aria-hidden", "false");
  container.prepend(loadingBar);

  function showLoadingBar() {
    loadingBar.style.display = "block";
    // trigger reflow for animation (if needed)
    void loadingBar.offsetWidth;
    loadingBar.style.opacity = "1";
  }

  function hideLoadingBar() {
    loadingBar.style.opacity = "0";
    setTimeout(() => {
      loadingBar.style.display = "none";
    }, 300);
  }

  // clear existing content (preserve loadingBar which is first child)
  function clearContainer() {
    // remove all children except the loading bar (first child)
    while (container.children.length > 1)
      container.removeChild(container.lastChild);
  }

  function formatPrice(v) {
    if (v == null) return "";
    try {
      return Number(v).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      });
    } catch {
      return String(v);
    }
  }

  function createCard(car) {
    const card = document.createElement("article");
    card.className = "inventory__card";
    card.tabIndex = 0;

    // canonical id for this car (string)
    const canonicalId = String(car.id ?? "");

    // image area
    const imgWrap = document.createElement("div");
    imgWrap.className = "inventory__card-image-wrapper";

    const img = document.createElement("img");
    img.alt = `${car.make} ${car.model}`;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";

    // parse images JSON if present
    let firstImg = "";
    try {
      const imgs = car.images ? JSON.parse(car.images) : [];
      if (Array.isArray(imgs) && imgs.length) firstImg = imgs[0];
    } catch (e) {
      firstImg = "";
    }
    img.src = firstImg || "images/ui/car-placeholder.png";
    imgWrap.appendChild(img);

    // like button (unlike in this context since these are already liked)
    const likeBtn = document.createElement("button");
    likeBtn.type = "button";
    likeBtn.className = "inventory__like-btn inventory__like-btn-liked";
    likeBtn.id = `likeButton${canonicalId}`;
    likeBtn.setAttribute("aria-pressed", "true");
    likeBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await toggleLike(canonicalId, likeBtn);
    });
    imgWrap.appendChild(likeBtn);

    // content area
    const body = document.createElement("div");
    body.className = "inventory__card-body";

    const title = document.createElement("h3");
    title.className = "inventory__card-title";
    title.textContent = `${car.year} ${car.make} ${car.model}`;

    const meta = document.createElement("div");
    meta.className = "inventory__meta";

    const price = document.createElement("div");
    price.className = "inventory__price";
    price.textContent = formatPrice(car.price);

    const mileage = document.createElement("div");
    mileage.className = "inventory__mileage";
    mileage.textContent =
      car.mileage != null ? `${Number(car.mileage).toLocaleString()} mi` : "";

    meta.appendChild(price);
    meta.appendChild(mileage);

    const details = document.createElement("p");
    details.className = "main__text inventory__details";
    // short description: trim, body_style, color, location, status
    const parts = [];
    if (car.trim) parts.push(car.trim);
    if (car.body_style) parts.push(car.body_style);
    if (car.color) parts.push(car.color);
    if (car.location) parts.push(car.location);
    if (car.status) parts.push(`(${car.status})`);
    details.textContent = parts.join(" · ");

    // footer area with small button hint
    const footer = document.createElement("div");
    footer.className = "inventory__footer";

    const more = document.createElement("span");
    more.className = "inventory__more";
    more.textContent = "View details";

    footer.appendChild(more);

    // assemble
    body.appendChild(title);
    body.appendChild(meta);
    body.appendChild(details);

    card.appendChild(imgWrap);
    card.appendChild(body);
    card.appendChild(footer);

    // click handler - navigate to a detail page
    card.addEventListener("click", () => {
      window.location.href = `car.html?id=${encodeURIComponent(car.id)}`;
    });
    card.addEventListener("keypress", (e) => {
      if (e.key === "Enter") card.click();
    });

    return card;
  }

  // Toggle like/unlike for a car
  async function toggleLike(canonicalId, likeBtn) {
    const token =
      typeof getTokenFromSession === "function"
        ? getTokenFromSession()
        : window.USER_TOKEN || null;

    if (!token) {
      if (typeof showMessage === "function")
        showMessage("Please sign in to save favorites.", false);
      else console.warn("Sign in required to like vehicles.");
      return;
    }

    const currentlyLiked = likeBtn.classList.contains(
      "inventory__like-btn-liked"
    );

    // optimistic UI toggle
    if (currentlyLiked) {
      likeBtn.classList.remove("inventory__like-btn-liked");
      likeBtn.setAttribute("aria-pressed", "false");
    } else {
      likeBtn.classList.add("inventory__like-btn-liked");
      likeBtn.setAttribute("aria-pressed", "true");
    }

    const endpoint = currentlyLiked
      ? `${URL_BASE}/api/users/cars/unlike-car`
      : `${URL_BASE}/api/users/cars/like-car`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ carId: Number(canonicalId) }),
      });

      if (!res.ok) {
        // revert optimistic UI on failure
        if (currentlyLiked) {
          likeBtn.classList.add("inventory__like-btn-liked");
          likeBtn.setAttribute("aria-pressed", "true");
        } else {
          likeBtn.classList.remove("inventory__like-btn-liked");
          likeBtn.setAttribute("aria-pressed", "false");
        }
        console.warn("Like/unlike request failed:", res.status);
        const text = await res.text();
        let errorJson = {};
        try {
          errorJson = JSON.parse(text);
        } catch (err) {}
        if (typeof alertModal === "function") {
          alertModal(`Error: ${errorJson.message || "Failed to update favorite"}`);
        }
        return;
      }

      // success -> if unliked, remove the card from display
      if (currentlyLiked) {
        // Card was unliked, reload the list to remove it
        loadFavoriteCars();
      }
    } catch (err) {
      // revert on network error
      if (currentlyLiked) {
        likeBtn.classList.add("inventory__like-btn-liked");
        likeBtn.setAttribute("aria-pressed", "true");
      } else {
        likeBtn.classList.remove("inventory__like-btn-liked");
        likeBtn.setAttribute("aria-pressed", "false");
      }
      console.error("Like/unlike network error:", err);
    }
  }

  async function loadFavoriteCars() {
    showLoadingBar();
    clearContainer();

    const token =
      typeof getTokenFromSession === "function"
        ? getTokenFromSession()
        : window.USER_TOKEN || null;

    if (!token) {
      const p = document.createElement("p");
      p.className = "main__text inventory__empty";
      p.textContent = "Please sign in to view your favorite cars.";
      container.appendChild(p);
      hideLoadingBar();
      return;
    }

    try {
      // Step 1: Fetch liked car IDs
      const likedRes = await fetch(`${URL_BASE}/api/users/cars/liked-cars`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!likedRes.ok) {
        const errText = await likedRes
          .text()
          .catch(() => "Failed to load favorite cars.");
        const p = document.createElement("p");
        p.className = "main__text inventory__empty";
        p.textContent = `Error loading favorites: ${errText}`;
        container.appendChild(p);
        hideLoadingBar();
        return;
      }

      const likedData = await likedRes.json();
      const likedCarIds = likedData.likedCars || [];

      if (likedCarIds.length === 0) {
        const p = document.createElement("p");
        p.className = "main__text inventory__empty";
        p.textContent = "You haven't liked any cars yet. Browse our inventory to find your favorites!";
        container.appendChild(p);
        hideLoadingBar();
        return;
      }

      // Step 2: Fetch details for each liked car
      const carPromises = likedCarIds.map((carId) =>
        fetch(`${URL_BASE}/api/cars/used/${carId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
          .then((res) => {
            if (!res.ok) return null;
            return res.json();
          })
          .catch(() => null)
      );

      const cars = await Promise.all(carPromises);
      const validCars = cars.filter((car) => car !== null);

      if (validCars.length === 0) {
        const p = document.createElement("p");
        p.className = "main__text inventory__empty";
        p.textContent = "No favorite cars found.";
        container.appendChild(p);
        hideLoadingBar();
        return;
      }

      // Step 3: Render cards
      validCars.forEach((car) => {
        const card = createCard(car);
        container.appendChild(card);
      });
    } catch (err) {
      const p = document.createElement("p");
      p.className = "main__text inventory__empty";
      p.textContent = "Unable to load favorite cars. Please try again later.";
      container.appendChild(p);
      console.error("Favorite cars load error:", err);
    } finally {
      hideLoadingBar();
    }
  }

  // initial load
  loadFavoriteCars();

  // expose for debugging or future refresh usage
  window.loadFavoriteCars = loadFavoriteCars;
});
