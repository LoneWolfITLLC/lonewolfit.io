let hasExecuted = false;
let authNeeded = false; // Track if authentication is needed
let requireLogin = false; // Set this to true if you want to require the user to be logged in to view the page.
let loggedIn = false; // Track if the user is logged in
let redirectToPortal = false; // Set this to true if you want to redirect to portal on auth success
let requireUserToBeAdmin = false; // Set this to true if you want to require the user to be an admin to view the page.
const URL_BASE = "http://localhost:3000";
const ADMIN_PATH = "admin.html";
const MEMBER_PATH = "members.html";

function executeOnLoad() {
  if (!hasExecuted) {
    hasExecuted = true;
    const preAuthEvent = new CustomEvent("preAuthChecked");
    window.dispatchEvent(preAuthEvent);
    onLoad();
    console.log("onLoad executed successfully.");
  }
}

window.addEventListener("pageshow", executeOnLoad);
window.addEventListener("popstate", executeOnLoad);
window.addEventListener("pageshow", (event) => {
  if (event.persisted && !hasExecuted) {
    console.log("Page restored from back-forward cache.");
    hasExecuted = true;
    onLoad(); // Call your function here
  }
});
window.addEventListener("unload", (event) => {
  hasExecuted = false;
});

//––––– loading modal toggles –––––
function showLoading() {
  const loadingModal = document.getElementById("loadingModal");
  if (loadingModal) loadingModal.style.display = "flex";
}
function hideLoading() {
  const loadingModal = document.getElementById("loadingModal");
  if (loadingModal) loadingModal.style.display = "none";
}
function getTokenFromSession() {
  const token = sessionStorage.getItem("jwt");
  console.log(`Retrieved token from session...`);
  const urlParams = new URLSearchParams(window.location.search);
  const urltoken = urlParams.get("token");
  let redirect_uri = urlParams.get("redirect_uri");
  if (!urltoken && redirect_uri) {
    if (redirect_uri === ADMIN_PATH || redirect_uri === MEMBER_PATH) {
      window.location.href = window.location.pathname; // Redirect to the current path if redirect_uri is ADMIN_PATH or MEMBER_PATH
      redirect_uri = undefined; // Clear redirect_uri if it is ADMIN_PATH or MEMBER_PATH
    }
  }
  if (!token && urltoken) {
    sessionStorage.setItem("jwt", urltoken);
    console.log("Set token for session out of urlparams");
    if (redirect_uri === ADMIN_PATH || redirect_uri === MEMBER_PATH) {
      redirect_uri = ""; // Clear redirect_uri if it is ADMIN_PATH or MEMBER_PATH
      window.location.href = window.location.pathname; // Redirect to the current path if redirect_uri is ADMIN_PATH or MEMBER_PATH
    } else
      window.location.href =
        window.location.pathname +
        (redirect_uri ? "?redirect_uri=" + redirect_uri : ""); // Reload the page without the token
  } else if (token && urltoken) {
    console.log("Removing token for session out of urlparams");
    if (redirect_uri === ADMIN_PATH || redirect_uri === MEMBER_PATH) {
      redirect_uri = ""; // Clear redirect_uri if it is ADMIN_PATH or MEMBER_PATH
      window.location.href = window.location.pathname; // Redirect to the current path if redirect_uri is ADMIN_PATH or MEMBER_PATH
    } else
      window.location.href =
        window.location.pathname +
        (redirect_uri ? "?redirect_uri=" + redirect_uri : ""); // Reload the page without the token
  }
  return urltoken ? urltoken : token ? token : null;
}
async function checkAuthentication(token) {
  if (!token) {
    if (requireLogin) {
      window.location.href =
        "login.html?redirect_uri=" +
        window.location.pathname.replace(/^\//, "") +
        "#emailloginSection";
      return false;
    }
    return null;
  }
  try {
    showLoading();
    const res = await fetch(`${URL_BASE}/api/auth/check-auth`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    hideLoading();
    if (!res.ok) {
      if (requireLogin) {
        //If the pathname is NOT the same as ADMIN_PATH or MEMBER_PATH, redirect to login
        if (
          !window.location.pathname.trim().endsWith(ADMIN_PATH) &&
          !window.location.pathname.trim().endsWith(MEMBER_PATH)
        ) {
          window.location.href =
            "login.html?redirect_uri=" +
            window.location.pathname.replace(/^\//, "") +
            "#emailloginSection";
        } else {
          window.location.href = "login.html" + "#emailloginSection";
        }
        return false;
      }
      return null;
    }
    const data = await res.json();
    return data;
  } catch (err) {
    hideLoading();
    console.error(err);
    if (requireLogin) {
      window.location.href =
        "login.html?redirect_uri=" +
        window.location.pathname.replace(/^\//, "") +
        "#emailloginSection";
      return null;
    }
    return null;
  }
}
async function onLoad() {
  const token = getTokenFromSession();
  const logged = await checkAuthentication(token);
  authNeeded = logged === null;
  loggedIn = logged !== null;
  if (loggedIn && logged) {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUri = urlParams.get("redirect_uri");
    const adminUser = logged.user.adminUser;
    if (adminUser) {
      if (redirectUri && !redirectToPortal) {
        window.location.href = redirectUri;
      } else if (
        redirectToPortal &&
        !window.location.pathname.endsWith(ADMIN_PATH) &&
        !requireLogin
      ) {
        window.location.href = ADMIN_PATH;
      }
    } else {
      if (redirectUri && !redirectToPortal) {
        window.location.href = redirectUri;
      } else if (
        (redirectToPortal &&
          !window.location.pathname.endsWith(MEMBER_PATH) &&
          !requireLogin) ||
        (requireUserToBeAdmin &&
          !adminUser &&
          !window.location.pathname.endsWith(MEMBER_PATH))
      ) {
        window.location.href = MEMBER_PATH;
      }
    }

    // If already on /members.html, do not redirect
  } else if (token) {
    //delete token stored here...
    sessionStorage.removeItem("jwt");
    console.log("Removed old, broken session key...");
  } else {
    console.log("Login needed (auth failed)...");
  }
  const authEvent = new CustomEvent("authChecked", {
    detail: {
      loggedIn,
      authNeeded,
      user: logged ? logged.user : null,
    },
  });
  window.dispatchEvent(authEvent);
}
