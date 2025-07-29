document.addEventListener("DOMContentLoaded", function () {
	const toggle = document.getElementById("navbarToggle");
	const nav = document.getElementById("headerNav");
	toggle.addEventListener("click", function () {
		nav.classList.toggle("header__nav--open");
	});
	document.addEventListener("click", function (event) {
		if (!nav.contains(event.target) && !toggle.contains(event.target)) {
			nav.classList.remove("header__nav--open");
		}
	});
	const links = document.querySelectorAll(".header__nav-link");
	links.forEach((link) => {
		link.addEventListener("click", function () {
			nav.classList.remove("header__nav--open");
		});
	});
});
function goToMemberPortal() {
	if (
		(typeof MEMBER_PATH !== "undefined" &&
			window.location.pathname.endsWith(MEMBER_PATH)) ||
		window.location.pathname.endsWith("/members.html")
	) {
        if (typeof alertModal === "function") {
            alertModal("You are already on the member portal page.");
        }
        else {
            console.warn("You are already on the member portal page.");
            alert("You are already on the member portal page.");
        }
		return; // Already on the member portal page
	}
	if (typeof loggedIn !== "undefined" && !loggedIn) {
		if (typeof confirmModal !== "function") {
			const yes = confirm("You must be logged in to access the member portal. Log in now?");
			if (yes) {
				window.location.href = "/login.html";
			}
		} else
			confirmModal(
				"You must be logged in to access the member portal. Log in now?",
				function (yes) {
					if (yes) {
						window.location.href = "/login.html";
					}
				}
			);
		return;
	} else if (loggedIn) {
		if (typeof MEMBER_PATH === "undefined") {
			window.location.href = "/members.html";
		} else {
			window.location.href = MEMBER_PATH;
		}
	}
}
