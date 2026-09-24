let activeRecordIndexForGroup = null;

async function initializeGroupModal() {
  try {
    await loadGroupModal();

    const modal = document.getElementById("assignGroupModal");
    const closeBtn = document.getElementById("closeModalBtn");
    const submitBtn = document.getElementById("submitGroupBtn");

    if (!modal || !closeBtn || !submitBtn) {
      console.error("Group Modal initialization failed.");
      return;
    }

    // Prevent duplicate listeners if initialize runs again
    closeBtn.onclick = closeGroupModal;

    modal.onclick = (event) => {
      if (event.target === modal) {
        closeGroupModal();
      }
    };

    submitBtn.onclick = () => {
      if (GroupManager.updateAssignedGroup(activeRecordIndexForGroup)) {
        closeGroupModal();

        // Refresh whichever view is currently open
        // trialViewer.html: sync the in-memory record + Box 1 text
        // if (typeof activeInstantiatedRecordModel !== "undefined" && activeInstantiatedRecordModel) {
        //   const selector = document.getElementById("groupDropdown");
        //   activeInstantiatedRecordModel.assignedGroup = selector.value || null;
        // }
        // if (typeof initializeViewerGroupAssignmentButton === "function") {
        //   initializeViewerGroupAssignmentButton();
        // }
        if (typeof loadTargetRecordDataset === "function") {
          loadTargetRecordDataset();
        }

        // saveAttendance.html: refresh the table
        if (typeof renderDashboardTable === "function") {
          renderDashboardTable();
        }

        if (typeof window.onGroupAssignmentUpdated === "function") {
          window.onGroupAssignmentUpdated(activeRecordIndexForGroup);
        }
      }
    };
  } catch (error) {
    console.error("Failed loading Group Modal:", error);
  }
}

// Refresh whichever page is currently displaying this data
function refreshCallerView() {
  // saveAttendance.html (dashboard list)
  if (typeof renderDashboardTable === "function") {
    renderDashboardTable();
  }

  // trialViewer.html (single record viewer)
  if (typeof renderSplitDashboards === "function") {
    renderSplitDashboards();
  }
  if (typeof initializeViewerGroupAssignmentButton === "function") {
    initializeViewerGroupAssignmentButton();
  }
}

function openGroupSelectorModal(index) {
  const record = GroupManager.getRecord(index);

  if (!record) {
    console.error("Record not found:", index);
    return;
  }

  activeRecordIndexForGroup = index;

  document.getElementById("modalMeetName").innerText = record.meetingName || "Google Meet Session";

  document.getElementById("modalMeetCode").innerText = record.meetingCode || "N/A";

  document.getElementById("modalMeetDate").innerText = record.date || "N/A";

  document.getElementById("modalMeetDuration").innerText = formatDuration(record.meetingDuration || 0);

  document.getElementById("modalMeetParticipants").innerText = `${record.studentNames ? record.studentNames.length : 0} Participants`;

  GroupManager.populateGroups(record);

  document.getElementById("assignGroupModal").classList.remove("hidden");
  document.getElementById("assignGroupModal").classList.add("flex");
}

function closeGroupModal() {
  const modal = document.getElementById("assignGroupModal");

  if (modal) {
    modal.classList.add("hidden");
  }
}

document.addEventListener("DOMContentLoaded", initializeGroupModal);
