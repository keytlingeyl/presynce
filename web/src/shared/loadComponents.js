async function loadGroupModal() {
  const container = document.getElementById("assignGroupModalContainer");

  if (!container) return;

  // Prevent loading twice
  if (document.getElementById("assignGroupModal")) return;

  const response = await fetch("../components/assignGroupModal.html");

  if (!response.ok) {
    throw new Error("Unable to load assignGroupModal.html");
  }

  container.innerHTML = await response.text();
}
