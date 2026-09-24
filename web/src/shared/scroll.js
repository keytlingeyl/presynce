document.addEventListener("DOMContentLoaded", () => {
  const section = document.querySelector(".step-scroll");
  const cards = document.querySelectorAll(".step-card");

  if (!section || !cards.length) return;

  let ticking = false;

  function updateSteps() {
    const rect = section.getBoundingClientRect();

    // Total amount of scrolling available inside the section
    const scrollDistance = section.offsetHeight - window.innerHeight;

    if (scrollDistance <= 0) return;

    // 0 → 1
    const progress = Math.max(0, Math.min(1, -rect.top / scrollDistance));

    // Number of transitions
    const totalSteps = cards.length - 1;

    // Current position between cards
    // Example:
    // 0   = Step 01
    // 0.5 = halfway between Step 01 and 02
    // 1   = Step 02
    const position = progress * totalSteps;

    cards.forEach((card, index) => {
      const distance = index - position;

      /*
       * CARD POSITIONS
       *
       * distance =  0  → centered
       * distance =  1  → waiting on the right
       * distance = -1  → already moved left
       */

      // const CARD_DISTANCE = 1000;
      const CARD_DISTANCE = window.innerWidth;

      let x;
      let scale = 1;
      let opacity = 1;

      if (distance <= -1) {
        /*
         * CARD HAS ALREADY PASSED
         * Move it completely off-screen to the left.
         */

        x = -CARD_DISTANCE;

        scale = 0.94;
        opacity = 1;
      } else if (distance >= 1) {
        /*
         * CARD HAS NOT ARRIVED YET
         * Keep it completely off-screen to the right.
         */

        x = CARD_DISTANCE;

        scale = 0.94;
        opacity = 1;
      } else {
        /*
         * CARD IS CURRENTLY TRANSITIONING
         *
         * distance:
         *
         *  1  → right
         *  0  → center
         * -1  → left
         */

        x = distance * CARD_DISTANCE;

        // Slight scale-down while moving
        scale = 1 - Math.abs(distance) * 0.04;

        // Keep cards visible during movement
        opacity = 1;
      }

      card.style.transform = `
        translate(-50%, -50%)
        translateX(${x}px)
        scale(${scale})
      `;

      card.style.opacity = opacity;

      /*
       * Z-INDEX
       *
       * The card closest to the center
       * should appear above the others.
       */

      card.style.zIndex = String(cards.length - Math.round(Math.abs(distance)));
    });

    ticking = false;
  }

  function requestUpdate() {
    if (!ticking) {
      requestAnimationFrame(updateSteps);
      ticking = true;
    }
  }

  window.addEventListener("scroll", requestUpdate, {
    passive: true,
  });

  window.addEventListener("resize", requestUpdate);

  // Initial position
  updateSteps();
});
