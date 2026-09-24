// =====================================================
// SIGN-IN PAGE CONTROLLER
// Wires the already-existing signin.html markup (signed-out-state,
// signed-in-state, backup-modal, restore-modal) to AuthManager /
// BackupManager. No new UI was introduced - only IDs added to the
// two elements that had none (see signin.html diff).
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {
  const signedOutState = document.getElementById("signed-out-state");
  const signedInState = document.getElementById("signed-in-state");
  const signInButton = document.getElementById("google-signin-button");

  // Keep both hidden until we actually know the auth state, to avoid a flash
  // of the wrong state while Firebase resolves the existing session.
  signedOutState.classList.add("hidden");
  signedOutState.classList.remove("flex");
  signedInState.classList.add("hidden");
  signedInState.classList.remove("flex");

  await AuthManager.whenReady();
  renderAuthState(AuthManager.getCurrentUser());
  updateNavAuthLabel(AuthManager.getCurrentUser());
  AuthManager.onAuthChange((user) => {
    renderAuthState(user);
    updateNavAuthLabel(user);
  });

  if (signInButton) {
    signInButton.addEventListener("click", async () => {
      const label = signInButton.querySelector("span");
      const originalLabel = label ? label.innerText : "Sign in with Google";

      signInButton.disabled = true;
      signInButton.classList.add("opacity-60", "cursor-not-allowed");
      if (label) label.innerText = "Signing in...";

      try {
        await AuthManager.signInWithGoogle();
        // onAuthChange listener above handles re-rendering into the signed-in state.
      } catch (err) {
        // Covers both explicit failures and the user closing/cancelling the Google popup.
        console.error("Google sign-in failed or was cancelled:", err);
        if (err && err.message && err.message.includes("not configured")) {
          showConfirmModal({
            title: "Google Sign-In Not Configured",
            message: "Google Sign-In isn't configured yet. Add your Firebase project credentials in src/shared/firebaseConfig.js.",
            type: "warning",
          });
        } else if (!(err && err.code === "auth/popup-closed-by-user")) {
          showConfirmModal({
            title: "Sign-In Failed",
            message: "Sign-in failed. Please try again.",
            type: "warning",
          });
        }
      } finally {
        signInButton.disabled = false;
        signInButton.classList.remove("opacity-60", "cursor-not-allowed");
        if (label) label.innerText = originalLabel;
      }
    });
  }

  const signOutButton = document.getElementById("sign-out-button");
  if (signOutButton) {
    signOutButton.addEventListener("click", async () => {
      signOutButton.disabled = true;
      try {
        await AuthManager.signOut();
      } catch (err) {
        console.error("Sign-out failed:", err);
      } finally {
        signOutButton.disabled = false;
      }
    });
  }

  wireBackupModal();
  wireRestoreModal();
});

function updateNavAuthLabel(user) {
  const navLink = document.getElementById("navAuthLink");
  if (!navLink) return;
  navLink.innerText = user ? "My Account" : "Sign in";
}

function renderAuthState(user) {
  const signedOutState = document.getElementById("signed-out-state");
  const signedInState = document.getElementById("signed-in-state");

  if (user) {
    signedInState.classList.remove("hidden");
    signedInState.classList.add("flex");
    signedOutState.classList.add("hidden");
    signedOutState.classList.remove("flex");
    populateSignedInUI(user);
  } else {
    signedOutState.classList.remove("hidden");
    signedOutState.classList.add("flex");
    signedInState.classList.add("hidden");
    signedInState.classList.remove("flex");
  }
}

function populateSignedInUI(user) {
  const photo = document.getElementById("google-profile-photo");
  const name = document.getElementById("google-name");
  const email = document.getElementById("google-email");
  const firstSignedIn = document.getElementById("first-signed-in");

  if (photo && user.photoURL) photo.src = user.photoURL;
  if (name) name.innerText = user.displayName || "Presynce User";
  if (email) email.innerText = user.email || "";

  let cached = null;
  try {
    cached = JSON.parse(localStorage.getItem("platform_auth_user_cache") || "null");
  } catch (e) {}

  if (firstSignedIn) {
    const iso = cached?.firstSignedIn || new Date().toISOString();
    firstSignedIn.innerText = new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  }

  refreshLastBackupLabel();
  refreshRestoreAvailability(user);
}

function refreshLastBackupLabel() {
  const label = document.getElementById("last-backup-date");
  if (!label) return;
  const ms = BackupManager.getLastBackupTimestampMs();
  label.innerText = ms ? new Date(ms).toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }) : "No backup yet";
}

async function refreshRestoreAvailability(user) {
  const restoreBtn = document.getElementById("restore-button");
  if (!restoreBtn) return;
  try {
    const cloud = await BackupManager.getCloudSnapshot(user.uid);
    const hasData = cloud.exists && (cloud.records > 0 || cloud.groups > 0);
    // restoreBtn.disabled = !hasData;
    // restoreBtn.classList.toggle("opacity-50", !hasData);
    // restoreBtn.classList.toggle("cursor-not-allowed", !hasData);
    restoreBtn.title = hasData ? "" : "No cloud backup found yet - open to see details";
  } catch (err) {
    console.error("Failed to check restore availability:", err);
  }
}

// =====================================================
// BACKUP MODAL
// =====================================================

function wireBackupModal() {
  const modal = document.getElementById("backup-modal");
  const openBtn = document.getElementById("backup-button");
  const closeBtn = document.getElementById("close-backup-modal");
  const cancelBtn = document.getElementById("cancel-backup");
  const confirmBtn = document.getElementById("confirm-backup");

  if (!modal || !openBtn) return;

  const close = () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  };

  openBtn.addEventListener("click", async () => {
    const user = AuthManager.getCurrentUser();
    if (!user) return;

    const device = BackupManager.getDeviceSnapshot();
    let cloud = { records: 0, groups: 0 };
    try {
      cloud = await BackupManager.getCloudSnapshot(user.uid);
    } catch (err) {
      console.error("Failed to read cloud snapshot:", err);
    }

    document.getElementById("backup-google-email").innerText = user.email || "";
    document.getElementById("cloud-record-count").innerText = cloud.records;
    document.getElementById("cloud-group-count").innerText = cloud.groups;
    document.getElementById("device-record-count").innerText = device.records;
    document.getElementById("device-group-count").innerText = device.groups;
    document.getElementById("backup-warning-cloud-records").innerText = cloud.records;
    document.getElementById("backup-warning-cloud-groups").innerText = cloud.groups;
    document.getElementById("backup-warning-email").innerText = user.email || "";
    document.getElementById("backup-warning-device-records").innerText = device.records;
    document.getElementById("backup-warning-device-groups").innerText = device.groups;

    modal.classList.remove("hidden");
    modal.classList.add("flex");
  });

  if (closeBtn) closeBtn.addEventListener("click", close);
  if (cancelBtn) cancelBtn.addEventListener("click", close);

  if (confirmBtn) {
    confirmBtn.addEventListener("click", async () => {
      const user = AuthManager.getCurrentUser();
      if (!user) return;

      const originalLabel = confirmBtn.innerText;
      confirmBtn.disabled = true;
      confirmBtn.innerText = "Backing up...";

      try {
        await BackupManager.backupNow(user.uid);
        refreshLastBackupLabel();
        refreshRestoreAvailability(user);
        close();
        showConfirmModal({
          title: "Backup Complete",
          message: "Your Records and Groups have been successfully backed up.",
          type: "warning",
        });
      } catch (err) {
        console.error("Backup failed:", err);
        showConfirmModal({
          title: "Backup Failed",
          message: "Backup failed. Please check your connection and try again.",
          type: "warning",
        });
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerText = originalLabel;
      }
    });
  }
}

// =====================================================
// RESTORE MODAL
// =====================================================

function wireRestoreModal() {
  const modal = document.getElementById("restore-modal");
  const openBtn = document.getElementById("restore-button");
  const closeBtn = document.getElementById("close-restore-modal");
  const cancelBtn = document.getElementById("cancel-restore");
  const confirmBtn = document.getElementById("confirm-restore");

  if (!modal || !openBtn) return;

  const close = () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  };

  openBtn.addEventListener("click", async () => {
    const user = AuthManager.getCurrentUser();
    if (!user) return;

    const emptyState = document.getElementById("restore-empty-state");
    const dataState = document.getElementById("restore-data-state");
    const confirmBtn = document.getElementById("confirm-restore");

    // Open immediately with a lightweight loading label so the click always
    // gives instant feedback, rather than waiting on the network in silence.
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    emptyState.classList.add("hidden");
    dataState.classList.add("hidden");
    if (confirmBtn) confirmBtn.classList.add("hidden");

    let cloud = { records: 0, groups: 0, lastBackupTimestamp: null, exists: false };
    try {
      cloud = await BackupManager.getCloudSnapshot(user.uid);
    } catch (err) {
      console.error("Failed to read cloud snapshot:", err);
    }

    const hasData = cloud.exists && (cloud.records > 0 || cloud.groups > 0);

    if (!hasData) {
      emptyState.classList.remove("hidden");
      emptyState.classList.add("flex");
      dataState.classList.add("hidden");
      if (confirmBtn) confirmBtn.classList.add("hidden");
      return;
    }

    emptyState.classList.add("hidden");
    emptyState.classList.remove("flex");
    dataState.classList.remove("hidden");
    if (confirmBtn) confirmBtn.classList.remove("hidden");

    document.getElementById("restore-backup-date").innerText = cloud.lastBackupTimestamp ? new Date(cloud.lastBackupTimestamp).toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : "Unknown";
    document.getElementById("restore-record-count").innerText = cloud.records;
    document.getElementById("restore-group-count").innerText = cloud.groups;
    document.getElementById("merge-record-count").innerText = cloud.records;
    document.getElementById("merge-group-count").innerText = cloud.groups;
  });

  if (closeBtn) closeBtn.addEventListener("click", close);
  if (cancelBtn) cancelBtn.addEventListener("click", close);

  if (confirmBtn) {
    confirmBtn.addEventListener("click", async () => {
      const user = AuthManager.getCurrentUser();
      if (!user) return;

      const mergeChk = document.getElementById("merge-on-restore");
      const originalLabel = confirmBtn.innerText;
      confirmBtn.disabled = true;
      confirmBtn.innerText = "Restoring...";

      try {
        await BackupManager.restoreNow(user.uid, mergeChk?.checked || false);
        close();
        showConfirmModal({
          title: "Restore Complete",
          message: "Your Records and Groups have been updated on this device.",
          type: "warning",
        });
      } catch (err) {
        console.error("Restore failed:", err);
        showConfirmModal({
          title: "Restore Failed",
          message: "Please check your connection and try again.",
          type: "warning",
        });
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerText = originalLabel;
      }
    });
  }
}
