gsap.registerPlugin(ScrollTrigger);

const canvas = document.querySelector(".sequence-canvas");
const context = canvas.getContext("2d");
const header = document.querySelector(".site-header");
const main = document.querySelector("main");

const frameFiles = [
  "0000.webp",
  "0008.webp",
  "0016.webp",
  "0024.webp",
  "0032.webp",
  "0040.webp",
  "0048.webp",
  "0056.webp",
  "0064.webp",
  "0072.webp",
  "0080.webp",
  "0088.webp",
  "0096.webp",
  "0104.webp",
  "0112.webp",
  "0120.webp",
  "0128.webp",
  "0136.webp",
];

const sequenceState = { frame: 0 };
const frameBreakpoints = {
  firstEnd: frameFiles.indexOf("0096.webp"),
  finalEnd: frameFiles.length - 1
};
const blendRange = {
  start: frameFiles.indexOf("0128.webp"),
  end: frameFiles.indexOf("0136.webp")
};
const scrollSegments = {
  firstEnd: 0.45,
  hold96End: 0.62,
  to136End: 0.82,
  hold136End: 1
};

const images = frameFiles.map((file) => {
  const image = new Image();
  image.src = encodeURI(`resources/takeout-hero/${file}`);
  return image;
});

const baseSize = { width: 0, height: 0 };
const canvasSize = { width: 0, height: 0 };

const renderFrame = () => {
  const frame = sequenceState.frame;
  const frameIndex = Math.floor(frame);
  const image = images[frameIndex];
  if (!image || !image.complete) {
    return;
  }

  if (!baseSize.width || !baseSize.height) {
    return;
  }

  const { width, height } = canvas;
  context.clearRect(0, 0, width, height);

  const scale = Math.min(
    canvasSize.width / baseSize.width,
    canvasSize.height / baseSize.height
  );
  const drawWidth = baseSize.width * scale;
  const drawHeight = baseSize.height * scale;
  const x = (canvasSize.width - drawWidth) / 2;
  const y = (canvasSize.height - drawHeight) / 2;

  const inBlendRange = frame >= blendRange.start && frame <= blendRange.end;
  if (inBlendRange) {
    const nextImage = images[blendRange.end];
    if (!nextImage || !nextImage.complete) {
      return;
    }

    const blend = gsap.utils.clamp(0, 1, frame - blendRange.start);
    context.globalAlpha = 1 - blend;
    context.drawImage(images[blendRange.start], x, y, drawWidth, drawHeight);
    context.globalAlpha = blend;
    context.drawImage(nextImage, x, y, drawWidth, drawHeight);
    context.globalAlpha = 1;
    return;
  }

  context.drawImage(image, x, y, drawWidth, drawHeight);
};

const mapProgressToFrame = (progress) => {
  const clamped = gsap.utils.clamp(0, 1, progress);
  const { firstEnd } = frameBreakpoints;
  const { firstEnd: firstSegmentEnd, hold96End, to136End, hold136End } =
    scrollSegments;
  const frame136 = blendRange.end;

  if (clamped <= firstSegmentEnd) {
    const local = firstSegmentEnd === 0 ? 0 : clamped / firstSegmentEnd;
    return local * firstEnd;
  }

  if (clamped <= hold96End) {
    return firstEnd;
  }

  if (clamped <= to136End) {
    const range = to136End - hold96End;
    const local = range <= 0 ? 1 : (clamped - hold96End) / range;
    return firstEnd + local * (frame136 - firstEnd);
  }

  if (clamped <= hold136End) {
    return frame136;
  }

  return frame136;
};

const resizeCanvas = () => {
  const wrapper = canvas.parentElement;
  const bounds = wrapper.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvasSize.width = Math.max(1, Math.floor(bounds.width));
  canvasSize.height = Math.max(1, Math.floor(bounds.height));
  canvas.width = Math.max(1, Math.floor(canvasSize.width * ratio));
  canvas.height = Math.max(1, Math.floor(canvasSize.height * ratio));
  canvas.style.width = `${canvasSize.width}px`;
  canvas.style.height = `${canvasSize.height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  renderFrame();
};

images[0].addEventListener("load", () => {
  baseSize.width = images[0].naturalWidth;
  baseSize.height = images[0].naturalHeight;
  resizeCanvas();
  ScrollTrigger.refresh();
});

window.addEventListener("resize", resizeCanvas);

const getHeroStartOffset = () => {
  const mainPaddingTop = main
    ? parseFloat(window.getComputedStyle(main).paddingTop) || 0
    : 0;
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  return Math.round(Math.max(mainPaddingTop, headerHeight, 0));
};

gsap.to(sequenceState, {
  frame: 1,
  ease: "none",
  scrollTrigger: {
    trigger: ".hero",
    start: () => `top top+=${getHeroStartOffset()}`,
    end: "+=220%",
    scrub: 0.5,
    pin: true,
    anticipatePin: 1,
    immediateRender: true,
    onLeave: () => {
      sequenceState.frame = frameBreakpoints.finalEnd;
      renderFrame();
    }
  },
  onUpdate: () => {
    sequenceState.frame = mapProgressToFrame(sequenceState.frame);
    renderFrame();
  }
});

ScrollTrigger.addEventListener("refresh", renderFrame);
window.addEventListener("load", renderFrame);

const sections = document.querySelectorAll("main section");
const navLinks = document.querySelectorAll(".site-nav a");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      const id = entry.target.getAttribute("id");
      navLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${id}`;
        link.classList.toggle("active", isActive);
      });
    });
  },
  {
    rootMargin: "-40% 0px -40% 0px",
    threshold: 0
  }
);

sections.forEach((section) => observer.observe(section));
