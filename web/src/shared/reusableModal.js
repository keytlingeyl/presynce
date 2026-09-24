/*
 * ============================================================
 * REUSABLE CONFIRMATION / WARNING / INPUT MODAL
 * ============================================================
 *
 * Available types:
 *
 * "confirm" → Cancel + OK
 * "danger"  → Cancel + Delete
 * "warning" → Close only
 * "input"   → Cancel + Save
 *
 * ============================================================
 */

// ============================================================
// CONFIGURATION
// ============================================================

const REUSABLE_MODAL_HTML = "../components/reusableModal.html";

let reusableModalLoading = null;

// ============================================================
// LOAD MODAL HTML
// ============================================================

async function loadReusableModal() {
  if (document.getElementById("confirmModal")) {
    return;
  }

  if (reusableModalLoading) {
    return reusableModalLoading;
  }

  reusableModalLoading = (async () => {
    const container = document.getElementById("confirmModalContainer");

    if (!container) {
      throw new Error("confirmModalContainer was not found in the page.");
    }

    const response = await fetch(REUSABLE_MODAL_HTML);

    if (!response.ok) {
      throw new Error(`Unable to load reusableModal.html (${response.status})`);
    }

    container.innerHTML = await response.text();
  })();

  try {
    await reusableModalLoading;
  } finally {
    reusableModalLoading = null;
  }
}

// ============================================================
// CLOSE MODAL
// ============================================================

function closeConfirmModal() {
  const modal = document.getElementById("confirmModal");

  if (!modal) return;

  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

// ============================================================
// SHOW MODAL
// ============================================================

async function showConfirmModal({ title = "Confirm Action", message = "Are you sure you want to continue?", type = "confirm", inputValue = "", inputPlaceholder = "", onConfirm = null } = {}) {
  // ----------------------------------------------------------
  // LOAD MODAL
  // ----------------------------------------------------------

  try {
    await loadReusableModal();
  } catch (error) {
    console.error("Reusable modal failed to load:", error);
    return;
  }

  // ----------------------------------------------------------
  // GET ELEMENTS
  // ----------------------------------------------------------

  const modal = document.getElementById("confirmModal");
  const titleElement = document.getElementById("confirmModalTitle");
  const messageElement = document.getElementById("confirmModalMessage");
  const closeButton = document.getElementById("confirmModalClose");
  const cancelButton = document.getElementById("confirmModalCancel");
  const okButton = document.getElementById("confirmModalOk");

  const inputContainer = document.getElementById("confirmModalInputContainer");

  const inputElement = document.getElementById("confirmModalInput");

  if (!modal || !titleElement || !messageElement || !closeButton || !cancelButton || !okButton || !inputContainer || !inputElement) {
    console.error("Reusable modal elements are missing from reusableModal.html.");

    return;
  }

  // ----------------------------------------------------------
  // SET CONTENT
  // ----------------------------------------------------------

  titleElement.textContent = title;
  messageElement.textContent = message;

  // ----------------------------------------------------------
  // RESET INPUT
  // ----------------------------------------------------------

  inputContainer.classList.add("hidden");

  inputElement.value = "";
  inputElement.placeholder = "";

  // ----------------------------------------------------------
  // REMOVE OLD OK EVENT
  // ----------------------------------------------------------

  const newOkButton = okButton.cloneNode(true);

  okButton.replaceWith(newOkButton);

  const currentOkButton = document.getElementById("confirmModalOk");

  // ----------------------------------------------------------
  // CONFIRM TYPE
  // ----------------------------------------------------------

  if (type === "confirm") {
    cancelButton.classList.remove("hidden");
    currentOkButton.classList.remove("hidden");
    closeButton.classList.remove("hidden");

    cancelButton.textContent = "Cancel";
    currentOkButton.textContent = "OK";

    currentOkButton.className = "px-4 py-2 text-sm font-semibold text-white " + "bg-indigo-600 hover:bg-indigo-700 " + "rounded-xl transition-all";
  }

  // ----------------------------------------------------------
  // DANGER TYPE
  // ----------------------------------------------------------
  else if (type === "danger") {
    cancelButton.classList.remove("hidden");
    currentOkButton.classList.remove("hidden");
    closeButton.classList.remove("hidden");

    cancelButton.textContent = "Cancel";
    currentOkButton.textContent = "Delete";

    currentOkButton.className = "px-4 py-2 text-sm font-semibold text-white " + "bg-red-600 hover:bg-red-700 " + "rounded-xl transition-all";
  }

  // ----------------------------------------------------------
  // WARNING TYPE
  // ----------------------------------------------------------
  else if (type === "warning") {
    cancelButton.classList.add("hidden");
    currentOkButton.classList.remove("hidden");
    closeButton.classList.remove("hidden");

    currentOkButton.textContent = "Close";

    currentOkButton.className = "px-4 py-2 text-sm font-semibold text-white " + "bg-[#4286f5] hover:bg-[#3478e5] " + "rounded-xl transition-all";
  }

  // ----------------------------------------------------------
  // INPUT TYPE
  // ----------------------------------------------------------
  else if (type === "input") {
    cancelButton.classList.remove("hidden");
    currentOkButton.classList.remove("hidden");
    closeButton.classList.remove("hidden");

    cancelButton.textContent = "Cancel";
    currentOkButton.textContent = "Save";

    currentOkButton.className = "px-4 py-2 text-sm font-semibold text-white " + "bg-[#4286f5] hover:bg-[#3478e5] " + "rounded-xl transition-all";

    inputContainer.classList.remove("hidden");

    inputElement.value = inputValue;
    inputElement.placeholder = inputPlaceholder;

    setTimeout(() => {
      inputElement.focus();
      inputElement.select();
    }, 0);
  }

  // ----------------------------------------------------------
  // OK / CONFIRM BUTTON
  // ----------------------------------------------------------

  currentOkButton.addEventListener("click", () => {
    if (type === "input") {
      const value = inputElement.value.trim();

      if (!value) {
        inputElement.focus();
        return;
      }

      closeConfirmModal();

      if (typeof onConfirm === "function") {
        onConfirm(value);
      }

      return;
    }

    closeConfirmModal();

    if (typeof onConfirm === "function") {
      onConfirm();
    }
  });

  // ----------------------------------------------------------
  // CANCEL BUTTON
  // ----------------------------------------------------------

  cancelButton.onclick = () => {
    closeConfirmModal();
  };

  // ----------------------------------------------------------
  // CLOSE BUTTON
  // ----------------------------------------------------------

  closeButton.onclick = () => {
    closeConfirmModal();
  };

  // ----------------------------------------------------------
  // CLICK OUTSIDE
  // ----------------------------------------------------------

  modal.onclick = (event) => {
    if (event.target === modal) {
      closeConfirmModal();
    }
  };

  // ----------------------------------------------------------
  // ENTER KEY
  // ----------------------------------------------------------

  inputElement.onkeydown = (event) => {
    if (event.key === "Enter" && type === "input") {
      event.preventDefault();
      currentOkButton.click();
    }
  };

  // ----------------------------------------------------------
  // SHOW MODAL
  // ----------------------------------------------------------

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}
