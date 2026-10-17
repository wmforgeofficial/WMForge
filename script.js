
(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const menuToggle = $("#menuToggle");
  const mainNav = $("#mainNav");

  if (menuToggle && mainNav) {
    const closeMenu = () => {
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
    };

    menuToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    });

    $$("#mainNav a").forEach(link => link.addEventListener("click", closeMenu));

    document.addEventListener("click", event => {
      if (!mainNav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) closeMenu();
    });
  }

  const revealItems = $$(".reveal");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -25px 0px" });

    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add("is-visible"));
  }

  const progress = $("#scrollProgress");
  const backToTop = $("#backToTop");
  let scrollTicking = false;

  const updateScrollUI = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const percent = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;

    if (progress) progress.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    if (backToTop) backToTop.classList.toggle("visible", window.scrollY > 420);

    scrollTicking = false;
  };

  window.addEventListener("scroll", () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateScrollUI);
      scrollTicking = true;
    }
  }, { passive: true });

  updateScrollUI();

  if (backToTop) {
    backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  // Expand/collapse the free PPT download list
  const freeFilesToggle = $("#freeFilesToggle");
  const freePptList = $("#freePptList");

  if (freeFilesToggle && freePptList) {
    freeFilesToggle.addEventListener("click", () => {
      const isExpanded = freeFilesToggle.getAttribute("aria-expanded") === "true";

      freeFilesToggle.setAttribute("aria-expanded", String(!isExpanded));
      freePptList.hidden = isExpanded;

      freeFilesToggle.innerHTML = isExpanded
        ? 'View free PPTs <span class="toggle-arrow">↓</span>'
        : 'Hide free PPTs <span class="toggle-arrow">↓</span>';
    });
  }

  // Video library filters and search
  const videoCards = $$(".video-card");
  const videoFilters = $$(".video-filter");
  const videoSearch = $("#videoSearch");
  const videoEmpty = $("#videoEmpty");
  let activeVideoFilter = "all";

  const applyVideoFilters = () => {
    const query = videoSearch ? videoSearch.value.trim().toLowerCase() : "";
    let visibleCount = 0;

    videoCards.forEach(card => {
      const matchesCategory =
        activeVideoFilter === "all" ||
        card.dataset.category === activeVideoFilter;

      const matchesSearch =
        !query ||
        (card.dataset.title || "").toLowerCase().includes(query);

      const visible = matchesCategory && matchesSearch;
      card.hidden = !visible;

      if (visible) visibleCount += 1;
    });

    if (videoEmpty) videoEmpty.hidden = visibleCount > 0;
  };

  videoFilters.forEach(button => {
    button.addEventListener("click", () => {
      activeVideoFilter = button.dataset.videoFilter || "all";

      videoFilters.forEach(filter => {
        const active = filter === button;
        filter.classList.toggle("active", active);
        filter.setAttribute("aria-pressed", String(active));
      });

      applyVideoFilters();
    });
  });

  if (videoSearch) videoSearch.addEventListener("input", applyVideoFilters);

  // Submit custom paid-content requests through Formspree
  const customRequestForm = $("#customRequestForm");

  if (customRequestForm) {
    customRequestForm.addEventListener("submit", async event => {
      event.preventDefault();
      if (!customRequestForm.reportValidity()) return;

      const submitButton = customRequestForm.querySelector('button[type="submit"]');
      const status = $("#requestFormStatus");
      const originalButtonText = submitButton ? submitButton.innerHTML : "";

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending request…";
      }

      if (status) {
        status.hidden = false;
        status.textContent = "Sending your request…";
      }

      try {
        const response = await fetch(customRequestForm.action, {
          method: "POST",
          body: new FormData(customRequestForm),
          headers: { Accept: "application/json" }
        });

        if (response.ok) {
          customRequestForm.reset();

          if (status) {
            status.textContent =
              "Thank you! Your request has been submitted. WMForge will review it and contact you about pricing and delivery.";
          }
        } else {
          let message = "We couldn't submit your request. Please try again in a moment.";

          try {
            const result = await response.json();

            if (result && Array.isArray(result.errors) && result.errors.length) {
              message = result.errors.map(error => error.message).join(" ");
            }
          } catch (_) {}

          if (status) status.textContent = message;
        }
      } catch (error) {
        if (status) {
          status.textContent =
            "Unable to connect right now. Please check your internet connection and try again.";
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML = originalButtonText;
        }
      }
    });
  }
})();
