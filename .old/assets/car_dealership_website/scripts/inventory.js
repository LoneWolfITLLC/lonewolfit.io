/*
  inventory.js
  - Fetches /api/cars/used
  - Renders cards into .inventory__container using createElement/append
  - Adds a top loading bar (.inventory__loading-bar) inside the inventory container
  - Cards are clickable and navigate to an item detail page (inventory_item.html?id=...)
*/
window.addEventListener("authChecked", async function () {
  const URL_BASE = window.URL_BASE || ""; // fallback if not defined elsewhere
  const container = document.getElementById("inventoryContainer");
  if (!container) return;

  // create and prepend loading bar
  const loadingBar = document.createElement("div");
  loadingBar.className = "inventory__loading-bar";
  loadingBar.setAttribute("role", "status");
  loadingBar.setAttribute("aria-hidden", "false");
  container.prepend(loadingBar);

  // --- added: sort bar + client-side sorting state ---
  let inventoryList = []; // current fetched list
  let currentSort = { key: "listing_new", label: "Listing (newest)" };

  function createSortBar() {
    // container for sort controls
    const sortBar = document.createElement("div");
    sortBar.className = "inventory__sortbar";
    sortBar.style.display = "flex";
    sortBar.style.justifyContent = "space-between";
    sortBar.style.alignItems = "center";
    sortBar.style.gap = "12px";
    sortBar.style.padding = "10px 12px";
    sortBar.style.borderBottom = "1px solid rgba(0,0,0,0.06)";
    sortBar.style.background = "transparent";

    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.alignItems = "center";
    left.style.gap = "8px";

    const label = document.createElement("span");
    label.textContent = "Sort by:";
    label.className = "main__text";
    label.style.fontWeight = "600";

    const dropdown = document.createElement("div");
    dropdown.className = "inventory__sort-dropdown";
    dropdown.style.position = "relative";
    dropdown.style.display = "inline-block";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn inventory__sort-btn";
    btn.textContent = currentSort.label + " ▾";
    btn.style.cursor = "pointer";

    const menu = document.createElement("div");
    menu.className = "inventory__sort-menu";
    menu.style.position = "absolute";
    menu.style.top = "calc(100% + 6px)";
    menu.style.left = "0";
    menu.style.minWidth = "220px";
    menu.style.background = "#fff";
    menu.style.border = "1px solid rgba(0,0,0,0.08)";
    menu.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
    menu.style.zIndex = "50";
    menu.style.display = "none";
    menu.style.padding = "6px 6px";
    menu.style.borderRadius = "6px";

    const options = [
      { key: "year_new", label: "Vehicle year (newest)" },
      { key: "year_old", label: "Vehicle year (oldest)" },
      { key: "mileage_low", label: "Mileage (low → high)" },
      { key: "mileage_high", label: "Mileage (high → low)" },
      { key: "listing_new", label: "Listing age (newest)" },
      { key: "listing_old", label: "Listing age (oldest)" },
      { key: "price_low", label: "Price (low → high)" },
      { key: "price_high", label: "Price (high → low)" },
    ];

    options.forEach((opt) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "inventory__sort-item";
      item.style.display = "block";
      item.style.width = "100%";
      item.style.textAlign = "left";
      item.style.padding = "8px 10px";
      item.style.border = "none";
      item.style.background = "transparent";
      item.style.cursor = "pointer";
      item.textContent = opt.label;
      item.addEventListener("click", () => {
        currentSort = opt;
        btn.textContent = opt.label + " ▾";
        menu.style.display = "none";
        sortInventory(opt.key);
      });
      menu.appendChild(item);
    });

    // toggle menu
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.style.display = menu.style.display === "none" ? "block" : "none";
    });

    // close on outside click
    document.addEventListener("click", () => {
      if (menu) menu.style.display = "none";
    });

    dropdown.appendChild(btn);
    dropdown.appendChild(menu);

    left.appendChild(label);
    left.appendChild(dropdown);

    // right side (count and optional refresh)
    const right = document.createElement("div");
    right.style.display = "flex";
    right.style.alignItems = "center";
    right.style.gap = "10px";

    const count = document.createElement("span");
    count.className = "inventory__count main__text";
    count.style.opacity = "0.9";
    count.textContent = "0 results";

    const refresh = document.createElement("button");
    refresh.type = "button";
    refresh.className = "btn inventory__sort-btn";
    refresh.textContent = "Refresh";
    refresh.addEventListener("click", () => {
      loadInventory(); // re-fetch and re-render
    });

    right.appendChild(count);
    right.appendChild(refresh);

    sortBar.appendChild(left);
    sortBar.appendChild(right);

    // insert sortBar at top of container (after loading bar)
    container.prepend(sortBar);

    // helper to update count
    function updateCount(n) {
      count.textContent = `${n} result${n === 1 ? "" : "s"}`;
    }

    return {
      updateCount,
      setVisible: (v) => (sortBar.style.display = v ? "flex" : "none"),
    };
  }

  const sortBarControls = createSortBar();

  function renderInventoryList(list) {
    // preserve loadingBar as first child, sortBar as second; start removing everything after that
    while (container.children.length > 1)
      container.removeChild(container.lastChild);

    if (!Array.isArray(list) || list.length === 0) {
      const p = document.createElement("p");
      p.className = "main__text inventory__empty";
      p.textContent = "No vehicles are available in inventory at this time.";
      container.appendChild(p);
      sortBarControls.updateCount(0);
      return;
    }
    list.forEach((car) => {
      const card = createCard(car);
      container.appendChild(card);
    });
    sortBarControls.updateCount(list.length);
  }
  async function getLikedCarsForUser() {
    try {
      // prefer project helper if present, else look for window.USER_TOKEN
      const token =
        typeof getTokenFromSession === "function"
          ? getTokenFromSession()
          : window.USER_TOKEN || null;
      if (!token) return; // not authenticated

      const res = await fetch(`${URL_BASE}/api/users/cars/liked-cars`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        likedCars = new Set();
        return;
      }
      const json = await res.json();
      likedCars = new Set(
        (json.likedCars || []).map((id) => {
          return String(id);
        })
      );
    } catch (err) {
      console.error("Failed to fetch liked cars:", err);
      likedCars = new Set();
    }
  }

  function sortInventory(key) {
    if (!Array.isArray(inventoryList)) return;
    // create shallow copy so we don't mutate original fetched order
    const sorted = inventoryList.slice().sort((a, b) => {
      switch (key) {
        case "year_new":
          return Number(b.year || 0) - Number(a.year || 0);
        case "year_old":
          return Number(a.year || 0) - Number(b.year || 0);
        case "mileage_low":
          return Number(a.mileage || 0) - Number(b.mileage || 0);
        case "mileage_high":
          return Number(b.mileage || 0) - Number(a.mileage || 0);
        case "listing_old": {
          const ta = new Date(a.created_at || a.modified_at || 0).getTime();
          const tb = new Date(b.created_at || b.modified_at || 0).getTime();
          return ta - tb;
        }
        case "listing_new": {
          const ta = new Date(a.created_at || a.modified_at || 0).getTime();
          const tb = new Date(b.created_at || b.modified_at || 0).getTime();
          return tb - ta;
        }
        case "price_low":
          return Number(a.price || 0) - Number(b.price || 0);
        case "price_high":
          return Number(b.price || 0) - Number(a.price || 0);
        default:
          return 0;
      }
    });

    renderInventoryList(sorted);
  }
  // --- end added ---

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
    //like button
    const likeBtn = document.createElement("button");
    likeBtn.type = "button";
    likeBtn.className = "inventory__like-btn";
    likeBtn.id = `likeButton${canonicalId}`;
    likeBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!loggedIn) {
        confirmModal(
          "Please log in to like vehicles. Press Confirm to go to the login page.",
          (confirmed) => {
            if (confirmed)
              window.location.href = `login.html?redirect=inventory.html`;
          }
        );
        return;
      }
      await toggleLike(canonicalId, e.target);
    });
    if (loggedIn && likedCars && likedCars.has(canonicalId)) {
      toggleLike(canonicalId, likeBtn, false);
    } else likeBtn.setAttribute("aria-pressed", "false");
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

    // click handler - navigate to a detail page (adjust target page as needed)
    card.addEventListener("click", () => {
      // prefer an item detail page; if none exists change this behavior
      window.location.href = `car.html?id=${encodeURIComponent(car.id)}`;
    });
    card.addEventListener("keypress", (e) => {
      if (e.key === "Enter") card.click();
    });

    return card;
  }

  // call this from your like button click handler: await toggleLike(canonicalId, likeBtn);
  async function toggleLike(canonicalId, likeBtn, sendLike = true) {
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

    if (sendLike) {
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
          alertModal(`Error liking car: ${errorJson.message}`);
          return;
        }

        // success -> update local likedCars set (used for initial state)
        if (typeof likedCars !== "undefined" && likedCars instanceof Set) {
          if (currentlyLiked) likedCars.delete(String(canonicalId));
          else likedCars.add(String(canonicalId));
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
  }

  async function loadInventory() {
    showLoadingBar();
    await getLikedCarsForUser();
    clearContainer();

    try {
      const res = await fetch(`${URL_BASE}/api/cars/used`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (res.status === 404) {
        // no cars
        inventoryList = [];
        renderInventoryList(inventoryList);
        hideLoadingBar();
        return;
      }

      if (!res.ok) {
        const errText = await res
          .text()
          .catch(() => "Failed to load inventory.");
        const p = document.createElement("p");
        p.className = "main__text";
        p.textContent = `Error loading inventory: ${errText}`;
        container.appendChild(p);
        hideLoadingBar();
        return;
      }

      const list = await res.json();
      inventoryList = Array.isArray(list) ? list : [];
      // default sort (listing_new)
      sortInventory(currentSort.key);
    } catch (err) {
      const p = document.createElement("p");
      p.className = "main__text";
      p.textContent = "Unable to load inventory. Please try again later.";
      container.appendChild(p);
      console.error("Inventory load error:", err);
    } finally {
      hideLoadingBar();
    }
  }

  // initial load
  loadInventory();

  // expose for debugging or future refresh usage
  window.loadInventory = loadInventory;
});
