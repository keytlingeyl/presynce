let knownParticipants = new Set();

// Send meeting code once
const match = location.href.match(/meet\.google\.com\/([a-z\-]+)/);
const meetingCode = match?.[1] || "unknown";

chrome.runtime.sendMessage({
  type: "MEETING_CODE",
  code: meetingCode
});

function extractParticipants() {
  const listContainer = document.querySelector('div[role="list"][aria-label="Participants"]');
  if (!listContainer) return new Set();

  const items = listContainer.querySelectorAll('div[role="listitem"]');
  const names = new Set();

  items.forEach(item => {
    const nameElement = item.querySelector('span');
    const name = nameElement?.textContent?.trim();

    if (!name) return;
    if (name.length < 2) return;
    if (name === "You") return;

    names.add(name);
  });

  return names;
}

function diffParticipants(current) {
  const joined = [...current].filter(x => !knownParticipants.has(x));
  const left = [...knownParticipants].filter(x => !current.has(x));

  joined.forEach(name =>
    chrome.runtime.sendMessage({ type: "JOIN", name, time: Date.now() })
  );

  left.forEach(name =>
    chrome.runtime.sendMessage({ type: "LEAVE", name, time: Date.now() })
  );

  knownParticipants = current;
}

function observeParticipants() {
  const observer = new MutationObserver(() => {
    try {
      diffParticipants(extractParticipants());
    } catch (e) {
      console.warn("Attendance observer error:", e);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

observeParticipants();