const defaultWidth = 120;
const defaultHeight = 50;
const defaultSlant = 70;
const defaultRound = 10;
const defaultColor = "green";

function drawAllTrapezoids() {
  const trapezoids = document.querySelectorAll(".custom-trapezoid");

  trapezoids.forEach((navItem) => {
    const width = navItem.getAttribute("data-width") || defaultWidth;
    const height = navItem.getAttribute("data-height") || defaultHeight;
    const slant = navItem.getAttribute("data-slant") || defaultSlant;
    const round = navItem.getAttribute("data-round") || defaultRound;
    const color = navItem.getAttribute("data-color") || defaultColor;
    // const stroke = navItem.getAttribute("data-stroke") || color;
    // const borderColor = navItem.getAttribute("data-border-color");
    // const borderWidth = navItem.getAttribute("data-border-width") || 3;

    navItem.style.width = `${width}px`;
    navItem.style.height = `${height}px`;

    const tLeft = (100 - slant) / 2;
    const tRight = 100 - tLeft;
    const points = `${tLeft},10 ${tRight},10 95,90 5,90`;

    // const borderPolygon = borderColor ? `<polygon points="${points}" fill="none" stroke="${borderColor}" stroke-width="${borderWidth}" style="stroke-linejoin: round;" />` : "";

    const holder = navItem.querySelector(".shape-holder");
    if (holder) {
      holder.innerHTML = `
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="w-full h-full overflow-visible">
          <polygon points="${points}" fill="${color}" stroke="${color}" stroke-width="${round}" style="stroke-linejoin: round;" />
        </svg>
      `;
    }
  });
}

document.addEventListener("DOMContentLoaded", drawAllTrapezoids);
