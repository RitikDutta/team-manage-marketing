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
  const safePlay = (media) => {
    if (!media) {
      return;
    }

    const playAttempt = media.play();

    if (playAttempt && typeof playAttempt.catch === "function") {
      playAttempt.catch(() => {});
    }
  };

  const setMediaTime = (media, nextTime) => {
    if (!media || !Number.isFinite(nextTime)) {
      return;
    }

    const applyTime = () => {
      try {
        media.currentTime = nextTime;
      } catch (error) {
        return;
      }
    };

    if (media.readyState >= 1) {
      applyTime();
      return;
    }

    media.addEventListener("loadedmetadata", applyTime, { once: true });
  };

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
  ]).filter((element) => !element.closest("aside nav") && !element.matches("[data-no-motion-button]"));

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
    ...surfaceCards.filter((element) => element.querySelector("img, video"))
  ]).filter((element) => isLargeEnough(element, 220, 160));

  mediaFrames.forEach((element) => element.classList.add("motion-media"));

  const visuals = qsa("img, video").filter(
    (media) => isLargeEnough(media, 120, 80) && !media.matches("[data-no-motion-visual]")
  );
  visuals.forEach((media) => media.classList.add("motion-visual"));

  const parallaxTargets = mediaFrames.slice(0, 12);
  parallaxTargets.forEach((element, index) => {
    element.classList.add("motion-transform");
    element.dataset.parallaxDepth = String(0.04 + (index % 4) * 0.015);
  });

  const heroVideoPreview = document.querySelector("[data-hero-video-preview]");
  const heroVideoTrigger = document.querySelector("[data-hero-video-trigger]");
  const heroVideoInline = document.querySelector("[data-hero-video-inline]");
  const heroVideoOverlay = document.querySelector("[data-hero-video-overlay]");
  const heroVideoShell = document.querySelector("[data-hero-video-shell]");
  const heroVideoExpanded = document.querySelector("[data-hero-video-expanded]");
  const heroVideoCloseButtons = qsa("[data-hero-video-close]");
  const heroVideoPrimaryClose = document.querySelector(".hero-video-close");

  let heroVideoIsOpen = false;
  let heroVideoCleanupTimer = 0;
  let heroVideoLastFocus = null;

  const clearHeroVideoTimer = () => {
    if (!heroVideoCleanupTimer) {
      return;
    }

    window.clearTimeout(heroVideoCleanupTimer);
    heroVideoCleanupTimer = 0;
  };

  const getHeroVideoPreviewRect = () => {
    if (!heroVideoPreview) {
      return null;
    }

    const rect = heroVideoPreview.getBoundingClientRect();
    const radius = Number.parseFloat(window.getComputedStyle(heroVideoPreview).borderTopLeftRadius) || 32;

    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      radius
    };
  };

  const getHeroVideoTargetRect = () => {
    const gutter = window.innerWidth < 768 ? 12 : 28;
    const maxWidth = Math.min(window.innerWidth - gutter * 2, 1480);
    const maxHeight = Math.min(window.innerHeight - gutter * 2, window.innerHeight * 0.9);
    const aspectRatio = 16 / 9;

    let width = maxWidth;
    let height = width / aspectRatio;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return {
      top: Math.round((window.innerHeight - height) / 2),
      left: Math.round((window.innerWidth - width) / 2),
      width: Math.round(width),
      height: Math.round(height),
      radius: window.innerWidth < 768 ? 22 : 28
    };
  };

  const applyHeroVideoRect = (rect) => {
    if (!heroVideoShell || !rect) {
      return;
    }

    heroVideoShell.style.top = `${rect.top}px`;
    heroVideoShell.style.left = `${rect.left}px`;
    heroVideoShell.style.width = `${rect.width}px`;
    heroVideoShell.style.height = `${rect.height}px`;
    heroVideoShell.style.borderRadius = `${rect.radius}px`;
  };

  const cleanupHeroVideo = () => {
    if (!heroVideoOverlay || !heroVideoShell || !heroVideoPreview) {
      return;
    }

    clearHeroVideoTimer();
    heroVideoOverlay.hidden = true;
    heroVideoOverlay.setAttribute("aria-hidden", "true");
    heroVideoOverlay.classList.remove("is-mounted");
    body.classList.remove("hero-video-lock");
    heroVideoPreview.classList.remove("is-active");
    heroVideoShell.removeAttribute("style");

    if (heroVideoLastFocus && typeof heroVideoLastFocus.focus === "function") {
      heroVideoLastFocus.focus({ preventScroll: true });
    }
  };

  const openHeroVideo = () => {
    if (
      heroVideoIsOpen ||
      !heroVideoPreview ||
      !heroVideoOverlay ||
      !heroVideoShell ||
      !heroVideoInline ||
      !heroVideoExpanded
    ) {
      return;
    }

    const startRect = getHeroVideoPreviewRect();
    const targetRect = getHeroVideoTargetRect();

    if (!startRect || !targetRect) {
      return;
    }

    heroVideoIsOpen = true;
    clearHeroVideoTimer();
    heroVideoLastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    heroVideoExpanded.pause();
    setMediaTime(heroVideoExpanded, 0);

    heroVideoOverlay.hidden = false;
    heroVideoOverlay.setAttribute("aria-hidden", "false");
    heroVideoOverlay.classList.add("is-mounted");
    body.classList.add("hero-video-lock");
    heroVideoPreview.classList.add("is-active");
    applyHeroVideoRect(startRect);

    heroVideoInline.pause();
    heroVideoExpanded.muted = false;
    heroVideoExpanded.volume = 1;

    window.requestAnimationFrame(() => {
      heroVideoOverlay.classList.add("is-open");

      if (reducedMotion) {
        applyHeroVideoRect(targetRect);
      } else {
        window.requestAnimationFrame(() => applyHeroVideoRect(targetRect));
      }
    });

    safePlay(heroVideoExpanded);
    window.setTimeout(() => {
      if (heroVideoIsOpen) {
        heroVideoPrimaryClose?.focus({ preventScroll: true });
      }
    }, reducedMotion ? 0 : 180);
  };

  const closeHeroVideo = () => {
    if (
      !heroVideoIsOpen ||
      !heroVideoPreview ||
      !heroVideoOverlay ||
      !heroVideoShell ||
      !heroVideoInline ||
      !heroVideoExpanded
    ) {
      return;
    }

    const endRect = getHeroVideoPreviewRect();

    heroVideoIsOpen = false;
    clearHeroVideoTimer();
    heroVideoOverlay.classList.remove("is-open");
    heroVideoExpanded.pause();
    heroVideoExpanded.muted = true;
    heroVideoInline.muted = true;
    safePlay(heroVideoInline);

    if (endRect) {
      applyHeroVideoRect(endRect);
    }

    heroVideoCleanupTimer = window.setTimeout(cleanupHeroVideo, reducedMotion ? 0 : 820);
  };

  if (heroVideoInline) {
    heroVideoInline.defaultMuted = true;
    heroVideoInline.muted = true;
    safePlay(heroVideoInline);
  }

  if (heroVideoExpanded) {
    heroVideoExpanded.muted = true;
  }

  if (heroVideoTrigger) {
    heroVideoTrigger.addEventListener("click", openHeroVideo);
  }

  heroVideoCloseButtons.forEach((button) => button.addEventListener("click", closeHeroVideo));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && heroVideoIsOpen) {
      closeHeroVideo();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (!heroVideoInline) {
      return;
    }

    if (document.hidden) {
      heroVideoInline.pause();
      return;
    }

    if (!heroVideoIsOpen) {
      heroVideoInline.muted = true;
      safePlay(heroVideoInline);
    }
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
  window.addEventListener("resize", () => {
    if (heroVideoIsOpen) {
      applyHeroVideoRect(getHeroVideoTargetRect());
    }
  });
});
