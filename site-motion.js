document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const body = document.body;

  if (!body) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const unique = (items) => Array.from(new Set(items.filter(Boolean)));
  const reveals = new Set();

  const isFixedLike = (element) => {
    const position = window.getComputedStyle(element).position;
    return position === "fixed" || position === "sticky";
  };

  const isLargeEnough = (element, minWidth = 140, minHeight = 70) =>
    element.offsetWidth >= minWidth && element.offsetHeight >= minHeight;

  const currentPage = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();

  const markTransforms = (elements) => {
    unique(elements).forEach((element) => element.classList.add("motion-transform"));
  };

  const addReveal = (elements, options = {}) => {
    const { origin = "up", baseDelay = 0, stagger = 24 } = options;

    unique(elements).forEach((element, index) => {
      if (!element || element.closest("nav, aside")) {
        return;
      }

      markTransforms([element]);

      if (!element.dataset.reveal) {
        element.dataset.reveal = origin;
      }

      if (!element.style.getPropertyValue("--reveal-delay")) {
        element.style.setProperty("--reveal-delay", `${Math.min(baseDelay + index * stagger, 140)}ms`);
      }

      reveals.add(element);
    });
  };

  const shellElements = qsa("nav, aside, header").filter(isFixedLike);
  shellElements.forEach((element, index) => {
    element.classList.add("motion-shell");
    if (element.tagName === "ASIDE") {
      element.classList.add("motion-shell-side");
    }
    element.style.animationDelay = `${Math.min(index * 80, 160)}ms`;
  });

  const navLinks = unique([
    ...qsa("nav a[href]"),
    ...qsa("aside nav a[href]")
  ]);
  const footerLinks = qsa("footer a[href]");
  const motionLinks = unique([...navLinks, ...footerLinks]);

  motionLinks.forEach((link) => {
    const href = (link.getAttribute("href") || "").split("#")[0].toLowerCase();
    link.classList.add("motion-nav-link", "motion-transform");

    if (navLinks.includes(link) && href && href === currentPage) {
      link.classList.add("is-current");
    }
  });

  const buttonLike = unique([
    ...qsa("a.inline-flex"),
    ...qsa("a.flex.items-center.justify-center"),
    ...qsa("button")
  ]).filter((element) => !element.closest("aside nav"));

  buttonLike.forEach((element) => element.classList.add("motion-button", "motion-transform"));

  const contentRoots = unique([
    ...qsa("main"),
    ...qsa("body > header"),
    ...qsa("body > section")
  ]);

  const topLevelBlocks = unique([
    ...qsa("body > header"),
    ...qsa("body > section"),
    ...qsa("main > *")
  ]).filter((element) => !isFixedLike(element));

  addReveal(topLevelBlocks, { origin: "up", stagger: 36 });

  const surfaceCards = unique(
    contentRoots.flatMap((rootElement) => [
      ...qsa('[class*="glass-card"]', rootElement),
      ...qsa('[class*="glass-panel"]', rootElement),
      ...qsa('[class*="rounded"][class*="shadow"]', rootElement),
      ...qsa('[class*="rounded"][class*="border"][class*="bg-"]', rootElement)
    ])
  ).filter((element) => {
    if (
      !element ||
      isFixedLike(element) ||
      element.matches("a, button, img, nav, aside, header, footer, tbody, thead, tr, td, th")
    ) {
      return false;
    }

    return isLargeEnough(element);
  });

  surfaceCards.forEach((element) => element.classList.add("motion-card", "motion-transform"));
  addReveal(surfaceCards, { origin: "scale", stagger: 24 });

  const tableRows = qsa("tbody tr").filter((row) => row.closest("main"));
  tableRows.forEach((row) => row.classList.add("motion-row", "motion-transform"));
  addReveal(tableRows, { origin: "right", stagger: 18 });

  const grids = unique(contentRoots.flatMap((rootElement) => qsa(".grid", rootElement))).filter(
    (grid) => !grid.closest("nav, aside")
  );

  grids.forEach((grid) => {
    const children = Array.from(grid.children).filter(
      (child) => child instanceof HTMLElement && isLargeEnough(child, 100, 60)
    );

    children.forEach((child, index) => {
      markTransforms([child]);

      if (!child.dataset.reveal) {
        child.dataset.reveal =
          window.innerWidth >= 768
            ? index % 3 === 0
              ? "left"
              : index % 3 === 2
                ? "right"
                : "up"
            : "up";
      }

      if (!child.style.getPropertyValue("--reveal-delay")) {
        child.style.setProperty("--reveal-delay", `${Math.min(index * 24, 120)}ms`);
      }

      reveals.add(child);
    });
  });

  const mediaFrames = unique([
    ...qsa("body > header [class*='overflow-hidden']"),
    ...qsa("body > section:first-of-type [class*='overflow-hidden']"),
    ...qsa("main > section:first-child [class*='overflow-hidden']"),
    ...surfaceCards.filter((element) => element.querySelector("img"))
  ]).filter((element) => isLargeEnough(element, 220, 160));

  mediaFrames.forEach((element) => element.classList.add("motion-media"));

  const visuals = qsa("img").filter((image) => isLargeEnough(image, 120, 80));
  visuals.forEach((image) => image.classList.add("motion-visual"));

  const parallaxTargets = mediaFrames.slice(0, 12);
  parallaxTargets.forEach((element, index) => {
    element.classList.add("motion-transform");
    element.dataset.parallaxDepth = String(0.04 + (index % 4) * 0.015);
  });

  const revealItems = Array.from(reveals);
  revealItems.forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight * 1.05) {
      element.classList.add("is-visible");
    }
  });

  root.classList.add("motion-ready");

  if (!reducedMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries, activeObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          activeObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.03,
        rootMargin: "0px 0px 12% 0px"
      }
    );

    revealItems.forEach((element) => observer.observe(element));
  } else {
    revealItems.forEach((element) => element.classList.add("is-visible"));
  }

  const progressBar = document.createElement("div");
  progressBar.className = "scroll-progress";
  body.appendChild(progressBar);

  const updateScrollProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    progressBar.style.setProperty("--scroll-progress", progress.toFixed(4));
  };

  const updateParallax = () => {
    if (reducedMotion || parallaxTargets.length === 0) {
      return;
    }

    const viewportMid = window.innerHeight / 2;

    parallaxTargets.forEach((element) => {
      const rect = element.getBoundingClientRect();

      if (rect.bottom < -100 || rect.top > window.innerHeight + 100) {
        return;
      }

      const depth = Number(element.dataset.parallaxDepth || "0.05");
      const shift = (viewportMid - (rect.top + rect.height / 2)) * depth;
      const clamped = Math.max(Math.min(shift, 26), -26);
      element.style.setProperty("--parallax-y", `${clamped.toFixed(2)}px`);
    });
  };

  let frame = 0;

  const requestFrameUpdate = () => {
    if (frame) {
      return;
    }

    frame = window.requestAnimationFrame(() => {
      updateScrollProgress();
      updateParallax();
      frame = 0;
    });
  };

  requestFrameUpdate();
  window.addEventListener("scroll", requestFrameUpdate, { passive: true });
  window.addEventListener("resize", requestFrameUpdate, { passive: true });
});
