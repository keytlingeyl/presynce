// =====================================================
// TABLE OF CONTENTS SCROLL-SPY
// Highlights the sidebar link of the section currently being read.
// Markup contract: <a data-toc-link href="#section-id"> links, and matching
// elements with those ids in the page. Used by privacyPolicy / termsOfService.
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
  const links = Array.from(document.querySelectorAll("[data-toc-link]"));
  if (links.length === 0) return;

  const entries = links.map((link) => ({ link, section: document.getElementById(link.getAttribute("href").slice(1)) })).filter((entry) => entry.section);

  if (entries.length === 0) return;

  const ACTIVE_CLASSES = ["border-brand-board", "bg-brand-chalk", "font-bold", "text-brand-board"];
  const IDLE_CLASSES = ["border-transparent", "text-slate-600"];
  const TRIGGER_OFFSET = 110; // px from the top of the viewport (below the sticky nav)

  let activeId = null;

  function setActive(id) {
    if (id === activeId) return;
    activeId = id;

    entries.forEach(({ link, section }) => {
      const isActive = section.id === id;
      link.classList.remove(...(isActive ? IDLE_CLASSES : ACTIVE_CLASSES));
      link.classList.add(...(isActive ? ACTIVE_CLASSES : IDLE_CLASSES));
      if (isActive) {
        link.setAttribute("aria-current", "location");
        keepLinkVisible(link);
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  // Scrolls only the sidebar (not the page) so the active link is never hidden
  function keepLinkVisible(link) {
    const container = link.closest("[data-toc-container]");
    if (!container || container.scrollHeight <= container.clientHeight) return;

    const linkTop = link.offsetTop;
    const linkBottom = linkTop + link.offsetHeight;

    if (linkTop < container.scrollTop) {
      container.scrollTop = linkTop - 8;
    } else if (linkBottom > container.scrollTop + container.clientHeight) {
      container.scrollTop = linkBottom - container.clientHeight + 8;
    }
  }

  function update() {
    let currentId = entries[0].section.id;

    for (const { section } of entries) {
      if (section.getBoundingClientRect().top <= TRIGGER_OFFSET) {
        currentId = section.id;
      }
    }

    // At the very bottom of the page, short last sections never reach the trigger line
    const reachedBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (reachedBottom) currentId = entries[entries.length - 1].section.id;

    setActive(currentId);
  }

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    },
    { passive: true },
  );
  window.addEventListener("resize", update);

  // Instant feedback on click, before the smooth scroll finishes
  entries.forEach(({ link, section }) => {
    link.addEventListener("click", () => setActive(section.id));
  });

  update();
});
