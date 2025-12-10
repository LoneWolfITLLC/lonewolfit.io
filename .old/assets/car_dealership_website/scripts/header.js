let COLLAPSABLE_WIDTH = 768; // px

window.addEventListener("DOMContentLoaded", init);

// shared state
let touching = false;
let lastTouching;
let lastUpdateTime = 0;
let userCollapsed = false; // persist user's intent to keep sidebar collapsed

function onDocClick(e) {
	const headerNav = document.querySelector(".header__nav");
	const toggleBtn = document.querySelector(".header__toggle");
	if (!headerNav || !toggleBtn) return;
	if (!headerNav.contains(e.target) && e.target !== toggleBtn) {
		closeHeaderNavGlobal();
	}
}

function init() {
	const header = document.querySelector(".header");
	const page = document.querySelector(".page");
	const main = document.querySelector(".main");
	const sidebar =
		document.querySelector(".main__sidebar") ||
		document.getElementById("sidebar");
	const footer = document.querySelector(".footer");
	const navList = document.querySelector(".main__nav");
	const headerNav = document.querySelector(".header__nav");
	const toggleBtn = document.querySelector(".header__toggle");

	const isMobile = () => window.matchMedia(`(max-width: ${COLLAPSABLE_WIDTH}px)`).matches;
	const isLowHeight = () => {
		if (!sidebar) return true;
		const headerHeight = header?.offsetHeight + 20 || 0;
		const sidebarHeight = sidebar?.offsetHeight || 0;
		return window.matchMedia(`(max-height: ${headerHeight + sidebarHeight}px)`)
			.matches;
	};

	function closeHeaderNav() {
		headerNav.classList.remove("header__nav--open");
		toggleBtn.setAttribute("aria-expanded", "false");
		document.removeEventListener("click", onDocClick);
	}

	const update = () => {
		let newTouching = false;
		if (navList && footer) {
			const navRect = navList.getBoundingClientRect();
			const footerRect = footer.getBoundingClientRect();
			newTouching = navRect.bottom >= footerRect.top;
		}

		if (newTouching !== lastTouching) {
			// console.log("Touching (update):", newTouching);
			lastTouching = newTouching;
		}
		touching = newTouching;
		const headerRect = header.getBoundingClientRect();
		const mainRect = main.getBoundingClientRect();
		const isReallySmall = () => window.matchMedia("(max-width: 480px)").matches;
		const scrolled = (mainRect.top + 15) < headerRect.bottom; // Takes into account the header height plus some margin

		if (scrolled) {
			header.classList.add("header--scrolled");
			if (sidebar) sidebar.classList.add("main--scrolled");
		} else {
			header.classList.remove("header--scrolled");
			if (sidebar) sidebar.classList.remove("main--scrolled");
		}

		// auto-collapse when touching (desktop), but never auto-expand if user collapsed
		if (sidebar) {
			const shouldCollapse = isLowHeight() || touching || isMobile();

			if (shouldCollapse && !page.classList.contains("main--collapsed")) {
				// only auto-collapse if the user has NOT explicitly chosen to expand
				if (!userCollapsed) {
					page.classList.add("main--collapsed");
				}
			} else if (
				!shouldCollapse &&
				page.classList.contains("main--collapsed")
			) {
				// only auto-expand if the user has NOT explicitly chosen to collapse
				if (!userCollapsed) {
					page.classList.remove("main--collapsed");
					if (
						!(isMobile() || touching) &&
						headerNav.classList.contains("header__nav--open")
					) {
						closeHeaderNav();
					}
				}
			}
		}

		lastUpdateTime = Date.now();
	};

	if (
		!header ||
		!page ||
		!sidebar ||
		!footer ||
		!navList ||
		!headerNav ||
		!toggleBtn
	) {
		if (!navList && !sidebar) {
			// Fallback: simple headerNav toggle only
			toggleBtn.addEventListener("click", () => {
				const open = headerNav.classList.toggle("header__nav--open");
				toggleBtn.setAttribute("aria-expanded", String(open));
				if (open) {
					setTimeout(() => document.addEventListener("click", onDocClick), 0);
				} else {
					document.removeEventListener("click", onDocClick);
				}
			});
			initHeaderScrollState({ page, sidebar, navList, update });
			return;
		} else return;
	}

	initHeaderToggle({
		page,
		sidebar,
		header,
		headerNav,
		toggleBtn,
		isMobile,
		closeHeaderNav,
		onDocClick,
		update,
	});
	initHeaderScrollState({ page, sidebar, navList, update });

	// defer first update until navList finishes animation/transition or window load
	const runOnce = () => {
		update();
		navList.removeEventListener("animationend", runOnce);
		navList.removeEventListener("transitionend", runOnce);
	};
	navList.addEventListener("animationend", runOnce);
	navList.addEventListener("transitionend", runOnce);
	window.addEventListener("load", update);
}

function closeHeaderNavGlobal() {
	const headerNav = document.querySelector(".header__nav");
	const toggleBtn = document.querySelector(".header__toggle");
	if (!headerNav || !toggleBtn) return;
	headerNav.classList.remove("header__nav--open");
	toggleBtn.setAttribute("aria-expanded", "false");
	document.removeEventListener("click", onDocClick);
}

function initHeaderToggle(ctx) {
	const {
		page,
		sidebar,
		header,
		headerNav,
		toggleBtn,
		isMobile,
		closeHeaderNav,
		onDocClick,
		update,
	} = ctx;

	toggleBtn.addEventListener("click", () => {
		requestAnimationFrame(() => {
			update();
			// console.log("Touching when clicked (after update):", touching);
			const isLowHeight = () => {
				if (!sidebar) return true;
				const headerHeight = header?.offsetHeight + 20 || 0;
				const sidebarHeight = sidebar?.offsetHeight || 0;
				return window.matchMedia(
					`(max-height: ${headerHeight + sidebarHeight}px)`
				).matches;
			};
			if (touching || isMobile() || isLowHeight()) {
				const open = headerNav.classList.toggle("header__nav--open");
				toggleBtn.setAttribute("aria-expanded", String(open));
				if (open) {
					setTimeout(() => document.addEventListener("click", onDocClick), 0);
				} else {
					document.removeEventListener("click", onDocClick);
				}
				return;
			}

			if (!page || !sidebar) return;
			const wasCollapsed = page.classList.contains("main--collapsed");
			const isCollapsed = page.classList.toggle("main--collapsed");
			toggleBtn.setAttribute("aria-expanded", String(!isCollapsed));
			sidebar.classList.remove("main--collapsed-hidden");
			if (wasCollapsed && !isCollapsed && !isMobile()) {
				closeHeaderNav();
			}

			// persist user intent: if user just collapsed, lock it; if user expanded, unlock
			if (!wasCollapsed && isCollapsed) {
				userCollapsed = true;
			} else if (wasCollapsed && !isCollapsed) {
				userCollapsed = false;
			}
		});
	});

	document.addEventListener("keydown", (ev) => {
		if (
			ev.key === "Escape" &&
			headerNav.classList.contains("header__nav--open")
		) {
			closeHeaderNav();
		}
	});

	window.addEventListener("resize", () => {
		if (!isMobile()) closeHeaderNav();
	});
}

function initHeaderScrollState(ctx) {
	const { page, sidebar, navList, update } = ctx;

	// Always listen to window scroll/resize
	window.addEventListener("scroll", update, { passive: true });
	window.addEventListener("resize", update);

	// Only attach to page if it exists
	if (page) {
		page.addEventListener("scroll", update, { passive: true });
	}

	// Only attach to sidebar if it exists
	if (sidebar) {
		sidebar.addEventListener("scroll", update, { passive: true });
	}

	// If navList is missing, update() should still run without error
	// because you already guard navList/footers inside update().
}
