// =====================================================
// CREATE GROUP FOLDER UI CONTROLLER
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
  renderGroupFolders();

  setupFolderOptions();
});

// =====================================================
// MODAL
// =====================================================

function openCreateGroupModal() {
  const modal = document.getElementById("createGroupModal");

  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
}

function closeCreateGroupModal() {
  const modal = document.getElementById("createGroupModal");

  if (modal) {
    modal.classList.remove("flex");
    modal.classList.add("hidden");
  }
}

// =====================================================
// CREATE GROUP
// =====================================================

function createGroupFolder(event) {
  event.preventDefault();

  const name = document.getElementById("modalGroupName").value.trim();
  const teacher = document.getElementById("modalTeacherName").value.trim();

  if (!name) return;

  const result = GroupManager.createGroup(name, teacher);

  if (!result.success) {
    showConfirmModal({
      title: "Unable to Create Group",
      message: result.message,
      type: "warning",
    });

    return;
  }

  closeCreateGroupModal();
  document.getElementById("groupCreationForm").reset();
  renderGroupFolders();
}

// =====================================================
// RENDER FOLDER CARDS
// =====================================================

function renderGroupFolders() {
  const container = document.getElementById("groupsContainer");

  if (!container) return;

  container.innerHTML = "";

  const groups = GroupManager.getGroups();

  groups.forEach((group) => {
    const folder = document.createElement("div");

    folder.className = "group relative h-50 w-fit overflow-visible";

    folder.innerHTML = `
            <img src="../assets/Open Folder.svg" alt="" class="h-full w-auto opacity-0" />

            <img src="../assets/Default Folder.svg" alt="" class="absolute left-1/2 top-1/2 h-full w-auto -translate-x-1/2 -translate-y-1/2 opacity-100 group-hover:opacity-0 transition-opacity duration-200 ease-out will-change-opacity" />
            <img src="../assets/Open Folder.svg" alt="" class="absolute left-1/2 top-1/2 h-full w-auto -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out will-change-opacity" />
            <div class="groupNameContainer absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center h-[84%] w-[90%] group-hover:h-[74%]">
              <span id="groupName" class="w-[80%] text-center text-brand-chalk font-caveat text-2xl leading-tight wrap-break-word overflow-hidden justify-center line-clamp-3">${group.name}</span>
              ${
                group.teacher?.trim()
                  ? ` <span class="text-center text-white text-sm font-medium line-clamp-2">
                      by ${escapeHtml(group.teacher)}
                      </span>
                    `
                  : ""
              }
            </div>
            <span class="open-options material-symbols-outlined text-4xl! absolute bottom-0 right-5 text-brand-chalk hover:bg-green-500/20 rounded-full leading-none cursor-pointer select-none"> more_horiz </span>

            <div class="folder-options hidden absolute -right-40 bg-white w-50 rounded-lg py-3 z-50">
              <div data-action="open" class="folder-action flex gap-3 px-3 py-1 hover:bg-gray-200 cursor-pointer items-center">
                <span class="material-symbols-outlined"> file_open </span>
                <p class="text-base m-0">Open in new tab</p>
              </div>

              <div data-action="rename" class="folder-action flex gap-3 px-3 py-1 hover:bg-gray-200 cursor-pointer items-center">
                <span class="material-symbols-outlined"> edit </span>
                <p class="text-base m-0">Rename</p>
              </div>

              <div data-action="download" class="folder-action flex gap-3 px-3 py-1 hover:bg-gray-200 cursor-pointer items-center">
                <span class="material-symbols-outlined"> download </span>
                <p class="text-base m-0">Download</p>
              </div>

              <div data-action="share" class="folder-action flex gap-3 px-3 py-1 hover:bg-gray-200 cursor-pointer items-center">
                <span class="material-symbols-outlined"> person_add </span>
                <p class="text-base m-0">Share</p>
              </div>
              <div data-action="delete" class="folder-action flex gap-3 px-3 py-1 hover:bg-gray-200 cursor-pointer items-center">
                <span class="material-symbols-outlined"> delete </span>
                <p class="text-base m-0">Delete</p>
              </div>
            </div>
`;

    attachFolderActions(folder, group);

    container.appendChild(folder);
  });

  setupFolderOptions();
}

// =====================================================
// ACTION EVENTS
// =====================================================

function attachFolderActions(folder, group) {
  folder.classList.add("cursor-pointer");
  folder.addEventListener("click", () => {
    window.location.href = `matrixViewer.html?group=${encodeURIComponent(group.name)}`;
  });

  const actions = folder.querySelectorAll(".folder-action");

  actions.forEach((action) => {
    action.addEventListener("click", () => {
      event.stopPropagation();
      const type = action.dataset.action;

      if (type === "open") {
        window.open(`matrixViewer.html?group=${encodeURIComponent(group.name)}`, "_blank");
      }

      if (type === "rename") {
        showConfirmModal({
          title: "Rename Group",
          message: "Enter a new name for this group.",
          type: "input",
          inputValue: group.name,
          inputPlaceholder: "Group name",

          onConfirm: (newName) => {
            const result = GroupManager.renameGroup(group.name, newName);

            if (!result.success) {
              showConfirmModal({
                title: "Unable to Rename Group",
                message: result.message,
                type: "warning",
              });

              return;
            }

            renderGroupFolders();
          },
        });
      }

      if (type === "delete") {
        showConfirmModal({
          title: "Delete Group",
          message: `Are you sure you want to permanently delete "${group.name}"? This action cannot be undone.`,
          type: "danger",

          onConfirm: () => {
            const result = GroupManager.deleteGroup(group.name);

            if (!result.success) {
              showConfirmModal({
                title: "Unable to Delete Group",
                message: result.message || "The group could not be deleted.",
                type: "warning",
              });

              return;
            }

            renderGroupFolders();
          },
        });
      }

      if (type === "download") {
        showConfirmModal({
          title: "Download Folder Contents",
          message: "To download this folder's contents, open the folder first and use the download option available inside.",
          type: "warning",
        });
      }

      if (type === "share") {
        showConfirmModal({
          title: "Share Unavailable",
          message: "The sharing feature is currently under construction. Soon, you will be able to share your records with attendees for easier transparency.",
          type: "warning",
        });
      }
    });
  });
}

// =====================================================
// RESPONSIVE OPTIONS MENU
// =====================================================

function setupFolderOptions() {
  const buttons = document.querySelectorAll(".open-options");

  buttons.forEach((button) => {
    const wrapper = button.parentElement;
    const folderOptions = wrapper.querySelector(".folder-options");

    button.addEventListener("click", (event) => {
      event.stopPropagation();

      document.querySelectorAll(".folder-options").forEach((menu) => {
        if (menu !== folderOptions) {
          menu.classList.add("hidden");
        }
      });

      if (!folderOptions.classList.contains("hidden")) {
        folderOptions.classList.add("hidden");
        return;
      }

      folderOptions.classList.remove("hidden");
      folderOptions.style.visibility = "hidden";

      const buttonRect = button.getBoundingClientRect();

      const menuWidth = folderOptions.offsetWidth;
      const menuHeight = folderOptions.offsetHeight;

      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      const spaceRight = window.innerWidth - buttonRect.right;
      const spaceLeft = buttonRect.left;

      folderOptions.style.visibility = "";

      // Reset position
      folderOptions.classList.remove("top-full", "bottom-full", "mt-0", "mb-9");

      // Position relative to more_horiz button
      if (spaceBelow < menuHeight) {
        // Above the more_horiz button
        folderOptions.style.top = "auto";
        folderOptions.style.bottom = "0";
        folderOptions.classList.add("mb-9");
      } else {
        // Below the more_horiz button
        folderOptions.style.top = "100%";
        folderOptions.style.bottom = "auto";
        folderOptions.classList.add("mt-0");
      }

      if (spaceRight < menuWidth) {
        // left the more_horiz button
        folderOptions.style.right = "0";
        folderOptions.classList.add("mr-9");
      }
    });
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".folder-options").forEach((menu) => {
      menu.classList.add("hidden");

      menu.style.top = "";
      menu.style.bottom = "";
      menu.classList.remove("mb-0");
      menu.style.top = "";
      menu.style.bottom = "";
      menu.style.left = "";
      menu.style.right = "";
    });
  });
}

document.addEventListener("DOMContentLoaded", setupFolderOptions);
