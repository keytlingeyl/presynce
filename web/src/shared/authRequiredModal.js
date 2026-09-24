// =====================================================
// AUTH GATE — reusable "sign-in required" modal
// Injected into the DOM lazily so it can be dropped into any
// page without touching that page's existing markup.
// =====================================================

(function () {
  function ensureModalMounted() {
    if (document.getElementById("authRequiredModal")) return;

    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div id="authRequiredModal" class="hidden fixed inset-0 bg-slate-900/40 z-99 items-center justify-center p-4">
        <div class="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 text-center">
          <!-- HEADER -->
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-2xl text-amber-500">lock</span>
            <h3 class="text-base font-bold text-slate-900">
              Sign-in Required
            </h3>
          </div>
          <!-- MESSAGE -->
          <p id="authRequiredModalMessage" class="text-xs text-slate-700 mt-4 leading-relaxed text-left"></p>
          <!-- ACTIONS -->
          <div class="flex items-center justify-end gap-3 mt-6">
            <button id="authRequiredCancelBtn" type="button" class="px-4 py-2.5 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all cursor-pointer"></button>
            <button id="authRequiredSignInBtn" type="button" class="px-4 py-2.5 bg-brand-board text-brand-chalk font-bold text-xs rounded-xl hover:opacity-90 transition-all cursor-pointer">Sign in now</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper.firstElementChild);
  }

  window.AuthGate = {
    /**
     * @param {string} featureLabel e.g. "Auto Backup"
     * @param {Function} onCancel called when the user dismisses the modal
     *   (via the cancel button OR clicking the backdrop). Should reset
     *   whatever toggle/UI triggered the gate back to its OFF state.
     * @param {string} [cancelButtonLabel] defaults to "Turn off {featureLabel}"
     */
    requireAuth(featureLabel, onCancel, cancelButtonLabel) {
      ensureModalMounted();
      const modal = document.getElementById("authRequiredModal");
      const message = document.getElementById("authRequiredModalMessage");
      const signInBtn = document.getElementById("authRequiredSignInBtn");
      const cancelBtn = document.getElementById("authRequiredCancelBtn");

      message.innerText = `Access to this feature (${featureLabel}) requires authentication. However, it seems that you are currently not logged in. To continue, please sign in with your Google Account.`;

      cancelBtn.innerText = cancelButtonLabel || `Turn off ${featureLabel}`;

      const close = () => {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
      };

      signInBtn.onclick = () => {
        close();
        window.location.href = "signin.html";
      };

      cancelBtn.onclick = () => {
        close();
        if (typeof onCancel === "function") onCancel();
      };

      modal.onclick = (e) => {
        if (e.target === modal) {
          close();
          if (typeof onCancel === "function") onCancel();
        }
      };

      modal.classList.remove("hidden");
      modal.classList.add("flex");
    },
  };
})();
