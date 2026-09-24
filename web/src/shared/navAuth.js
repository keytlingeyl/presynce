// =====================================================
// NAV AUTH LABEL (shared, load on every page that has the nav)
// Flips the "Sign in" nav link to "My Account" based on the
// cached user AuthManager writes to localStorage, so pages that
// don't load Firebase still stay in sync. Pages that DO load
// AuthManager get live updates on top of that.
// =====================================================
(function () {
  const CACHED_USER_KEY = "platform_auth_user_cache";

  function getNavLink() {
    // matches "signin.html", "../signin.html", "./signin.html"
    return document.querySelector('nav a[href$="signin.html"]');
  }

  function hasCachedUser() {
    try {
      return !!JSON.parse(localStorage.getItem(CACHED_USER_KEY) || "null");
    } catch (e) {
      return false;
    }
  }

  function refresh(user) {
    const link = getNavLink();
    if (!link) return;
    const signedIn = user !== undefined ? !!user : hasCachedUser();
    link.innerText = signedIn ? "My Account" : "Sign in";
  }

  document.addEventListener("DOMContentLoaded", () => {
    refresh();
    if (window.AuthManager) AuthManager.onAuthChange((user) => refresh(user));
  });

  // Sign in/out in another tab
  window.addEventListener("storage", (e) => {
    if (e.key === CACHED_USER_KEY) refresh();
  });

  window.NavAuth = { refresh };
})();
