// ===========================================
// Presynce Page Transition Engine
// Laptop Close Navigation Animation
// Window Viewport Crop Edition
// ===========================================

document.addEventListener("DOMContentLoaded", () => {
  const activeTab = document.querySelector(".nav-active");
  const main = document.querySelector("main");

  if (!activeTab || !main) return;

  const links = document.querySelectorAll("nav a[href]");

  links.forEach((link) => {
    const href = link.getAttribute("href");

    if (!href || href === "" || href.startsWith("#") || href.startsWith("javascript:")) {
      return;
    }

    const current = window.location.pathname.split("/").pop();

    const target = href.split("/").pop();

    if (current === target) return;

    link.addEventListener("click", async (e) => {
      e.preventDefault();
      await document.fonts.ready;
      const clickedTrapezoid = link.closest(".custom-trapezoid");
      const overlayColor = clickedTrapezoid?.dataset.color || "#002915";

      playCloseAnimation(overlayColor, () => {
        window.location.href = href;
      });
    });
  });

  function playCloseAnimation(overlayColor, onFinished) {
    document.body.style.pointerEvents = "none";

    document.body.style.backgroundColor = overlayColor;

    // ===========================================
    // Overlay
    // ===========================================

    const overlay = document.createElement("div");

    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      width: "100vw",
      height: "100vh",
      zIndex: "3000", // i love you 3000 na lang di kaya tatlong bilyon eh
      isolation: "isolate", // guarantees overlay is its own top-level stacking context
      pointerEvents: "none",
      overflow: "hidden",
      perspective: "1800px",
      background: "transparent",
    });

    document.body.appendChild(overlay);

    // ===========================================
    // Rotating wrapper
    // ===========================================

    const wrapper = document.createElement("div");

    Object.assign(wrapper.style, {
      position: "absolute",

      inset: "0",

      width: "100%",

      height: "100%",

      transformStyle: "preserve-3d",

      transformOrigin: "center bottom",

      transition: "transform 1000ms cubic-bezier(.65,.05,.36,1)",

      filter: "drop-shadow(0 10px 20px rgba(0,0,0,.25))",
    });

    overlay.appendChild(wrapper);

    // ===========================================
    // Clone active nav tab
    // ===========================================

    const tabRect = activeTab.getBoundingClientRect();

    const tabClone = activeTab.cloneNode(true);

    Object.assign(tabClone.style, {
      position: "absolute",

      left: tabRect.left + "px",

      top: tabRect.top + "px",

      width: tabRect.width + "px",

      height: tabRect.height + "px",

      margin: "0",

      zIndex: "100",
    });

    wrapper.appendChild(tabClone);

    // ===========================================
    // Main viewport camera
    // ===========================================

    const navHeight = document.querySelector("nav")?.getBoundingClientRect().height || 0;

    const cameraTop = navHeight;

    const cameraHeight = window.innerHeight - navHeight;

    const camera = document.createElement("div");

    Object.assign(camera.style, {
      position: "absolute",

      left: "0",

      top: cameraTop + "px",

      width: "100vw",

      height: cameraHeight + "px",

      overflow: "hidden",

      zIndex: "101",
    });

    wrapper.appendChild(camera);

    // ===========================================
    // Clone main content
    // ===========================================

    const mainClone = main.cloneNode(true);

    const mainRect = main.getBoundingClientRect();

    Object.assign(mainClone.style, {
      position: "absolute",

      left: mainRect.left + "px",

      top: `${-window.scrollY}px`,

      width: mainRect.width + "px",

      height: main.scrollHeight + "px",

      margin: "0",
    });

    camera.appendChild(mainClone);

    // ===========================================
    // Hide original
    // ===========================================

    activeTab.style.visibility = "hidden";

    main.style.visibility = "hidden";

    // ===========================================
    // Animate close
    // ===========================================

    requestAnimationFrame(() => {
      wrapper.style.transform = "rotateX(-88deg)";
    });

    // ===========================================
    // Finish
    // ===========================================

    wrapper.addEventListener(
      "transitionend",
      () => {
        // overlay.remove();

        // activeTab.style.visibility = "";

        // main.style.visibility = "";

        // document.body.style.pointerEvents = "";
        // if (e.propertyName !== "transform") return;

        onFinished();
      },
      {
        once: true,
      },
    );
  }
});
