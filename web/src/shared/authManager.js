// =====================================================
// AUTH MANAGER
// Single source of truth for authentication state, shared by
// signin.html and saveAttendance.html. Backed by Firebase Auth's
// own onAuthStateChanged listener (NOT a locally-invented flag),
// with a small localStorage cache used only to avoid a UI flash
// before Firebase resolves the session on first paint.
// =====================================================

const AuthManager = (() => {
  const CACHED_USER_KEY = "platform_auth_user_cache";
  const FIRST_SIGNIN_KEY_PREFIX = "platform_first_signin_"; // + uid

  let currentUser = null; // Firebase User object once resolved, else null
  let authReady = false;
  const listeners = new Set();

  let readyResolve;
  const readyPromise = new Promise((resolve) => {
    readyResolve = resolve;
  });

  function cacheUser(user) {
    if (!user) {
      localStorage.removeItem(CACHED_USER_KEY);
      return;
    }
    const firstKnownKey = FIRST_SIGNIN_KEY_PREFIX + user.uid;
    let firstSignedIn = localStorage.getItem(firstKnownKey);
    if (!firstSignedIn) {
      firstSignedIn = new Date().toISOString();
      localStorage.setItem(firstKnownKey, firstSignedIn);
    }
    localStorage.setItem(
      CACHED_USER_KEY,
      JSON.stringify({
        uid: user.uid,
        displayName: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
        firstSignedIn,
      }),
    );
  }

  function getCachedUser() {
    try {
      const raw = localStorage.getItem(CACHED_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function notify() {
    listeners.forEach((cb) => {
      try {
        cb(currentUser);
      } catch (e) {
        console.error("AuthManager listener threw an error:", e);
      }
    });
  }

  function init() {
    if (!firebaseAuth) {
      // firebaseConfig.js has placeholder credentials - fail safe into "signed out"
      authReady = true;
      readyResolve(null);
      return;
    }

    firebaseAuth.onAuthStateChanged(
      (user) => {
        currentUser = user;
        authReady = true;
        cacheUser(user);
        readyResolve(user);
        notify();
      },
      (err) => {
        console.error("Auth state listener error:", err);
        authReady = true;
        readyResolve(null);
      },
    );
  }

  async function signInWithGoogle() {
    if (!firebaseAuth || !googleAuthProvider) {
      throw new Error("Firebase Authentication is not configured yet. Add your project's config in firebaseConfig.js first.");
    }
    try {
      const result = await firebaseAuth.signInWithPopup(googleAuthProvider);
      return result.user;
    } catch (err) {
      // If the popup was blocked (not just closed/cancelled by the user), fall back to redirect.
      if (err && err.code === "auth/popup-blocked") {
        await firebaseAuth.signInWithRedirect(googleAuthProvider);
        return null;
      }
      throw err;
    }
  }

  async function signOut() {
    if (!firebaseAuth) return;
    await firebaseAuth.signOut();
    localStorage.removeItem(CACHED_USER_KEY);
  }

  function isAuthenticated() {
    if (currentUser) return true;
    if (!authReady) return !!getCachedUser(); // optimistic read, only before Firebase resolves
    return false;
  }

  function getCurrentUser() {
    return currentUser || getCachedUser();
  }

  // Registers a listener; fires immediately with current state if already resolved.
  // Returns an unsubscribe function.
  function onAuthChange(callback) {
    listeners.add(callback);
    if (authReady) callback(currentUser);
    return () => listeners.delete(callback);
  }

  function whenReady() {
    return readyPromise;
  }

  init();

  return {
    signInWithGoogle,
    signOut,
    isAuthenticated,
    getCurrentUser,
    onAuthChange,
    whenReady,
  };
})();

window.AuthManager = AuthManager;
