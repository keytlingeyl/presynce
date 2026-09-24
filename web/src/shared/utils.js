function formatDuration(timeInSeconds) {
  let hh = Math.floor(timeInSeconds / 3600);
  let mm = Math.floor((timeInSeconds % 3600) / 60);
  let ss = timeInSeconds % 60;

  if (hh === 0) {
    return `${mm}m ${ss}s`;
  }

  return `${hh}h ${mm}m ${ss}s`;
}

function escapeHtml(unsafe) {
  return String(unsafe).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
