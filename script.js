
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Mobile navigation
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
      menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation"
      );
    });

    $$("#mainNav a").forEach(link =>
      link.addEventListener("click", closeMenu)
    );

    document.addEventListener("click", event => {
      if (
        !mainNav.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        closeMenu();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) closeMenu();
    });
  }

  // Scroll reveal animations
  const revealItems = $$(".reveal");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -25px 0px"
    });

    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add("is-visible"));
  }

  // Scroll progress and back-to-top button
  const progress = $("#scrollProgress");
  const backToTop = $("#backToTop");
  let scrollTicking = false;

  const updateScrollUI = () => {
    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;

    const percent = maxScroll > 0
      ? (window.scrollY / maxScroll) * 100
      : 0;

    if (progress) {
      progress.style.width =
        `${Math.min(100, Math.max(0, percent))}%`;
    }

    if (backToTop) {
      backToTop.classList.toggle("visible", window.scrollY > 420);
    }

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
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Automatic copyright year
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  // Expand/collapse free PPT downloads
  const freeFilesToggle = $("#freeFilesToggle");
  const freePptList = $("#freePptList");

  if (freeFilesToggle && freePptList) {
    freeFilesToggle.addEventListener("click", () => {
      const isExpanded =
        freeFilesToggle.getAttribute("aria-expanded") === "true";

      freeFilesToggle.setAttribute(
        "aria-expanded",
        String(!isExpanded)
      );

      freePptList.hidden = isExpanded;

      freeFilesToggle.innerHTML = isExpanded
        ? 'View free PPTs <span class="toggle-arrow">↓</span>'
        : 'Hide free PPTs <span class="toggle-arrow">↓</span>';
    });
  }

  // Animated video marquee
  const videoGrid = $("#videoGrid");
  const videoMarquee = $("#videoMarquee");
  const videoTrackTop = $("#videoTrackTop");
  const videoTrackBottom = $("#videoTrackBottom");

  if (videoGrid && videoMarquee && videoTrackTop && videoTrackBottom) {
    const originalCards = $$(".video-card", videoGrid);

    // Split the original video cards between the two rows.
    originalCards.forEach((card, index) => {
      const destination =
        index % 2 === 0 ? videoTrackTop : videoTrackBottom;

      destination.appendChild(card);
    });

    // Duplicate each row for seamless looping.
    [videoTrackTop, videoTrackBottom].forEach(track => {
      const originals = [...track.children];

      originals.forEach(card => {
        const clone = card.cloneNode(true);

        clone.classList.add("video-card-clone");
        clone.setAttribute("aria-hidden", "true");

        clone.querySelectorAll(
          "a, button, input, select, textarea, [tabindex]"
        ).forEach(element => {
          element.setAttribute("tabindex", "-1");
        });

        clone.querySelectorAll("a").forEach(link => {
          link.setAttribute("aria-hidden", "true");
        });

        track.appendChild(clone);
      });
    });

    // Pause both rows while the pointer is over the video section.
    videoMarquee.addEventListener("mouseenter", () => {
      videoMarquee.classList.add("is-paused");
    });

    videoMarquee.addEventListener("mouseleave", () => {
      videoMarquee.classList.remove("is-paused");
    });

    // Also support keyboard focus.
    videoMarquee.addEventListener("focusin", () => {
      videoMarquee.classList.add("is-paused");
    });

    videoMarquee.addEventListener("focusout", event => {
      if (!videoMarquee.contains(event.relatedTarget)) {
        videoMarquee.classList.remove("is-paused");
      }
    });
  }

  // Video search and filters
  const videoCards = $$(".video-card:not(.video-card-clone)");
  const videoFilters = $$(".video-filter");
  const videoSearch = $("#videoSearch");
  const videoEmpty = $("#videoEmpty");

  let activeVideoFilter = "all";

  const applyVideoFilters = () => {
    const query = videoSearch
      ? videoSearch.value.trim().toLowerCase()
      : "";

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

      if (visible) visibleCount++;
    });

    const searching =
      Boolean(query) || activeVideoFilter !== "all";

    if (videoMarquee) {
      videoMarquee.classList.toggle("is-searching", searching);
    }

    if (videoGrid) {
      videoGrid.classList.toggle("is-searching", searching);
    }

    // Show the original cards in a normal grid while filtering.
    if (videoGrid && videoTrackTop && videoTrackBottom) {
      if (searching) {
        videoCards.forEach(card => videoGrid.appendChild(card));
      } else {
        videoCards.forEach((card, index) => {
          const track =
            index % 2 === 0 ? videoTrackTop : videoTrackBottom;

          const firstClone = track.querySelector(".video-card-clone");

          track.insertBefore(card, firstClone);
        });
      }
    }

    // Keep duplicated cards in sync with search/filter results.
    $$(".video-card-clone").forEach(card => {
      const matchesCategory =
        activeVideoFilter === "all" ||
        card.dataset.category === activeVideoFilter;

      const matchesSearch =
        !query ||
        (card.dataset.title || "").toLowerCase().includes(query);

      card.classList.toggle(
        "clone-hidden",
        !(matchesCategory && matchesSearch)
      );
    });

    if (videoEmpty) {
      videoEmpty.hidden = visibleCount > 0;
    }
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

  if (videoSearch) {
    videoSearch.addEventListener("input", applyVideoFilters);
  }

  // Custom content request form
  const customRequestForm = $("#customRequestForm");

  if (customRequestForm) {
    customRequestForm.addEventListener("submit", async event => {
      event.preventDefault();

      if (!customRequestForm.reportValidity()) return;

      const submitButton = customRequestForm.querySelector(
        'button[type="submit"]'
      );

      const status = $("#requestFormStatus");

      const originalButtonText = submitButton
        ? submitButton.innerHTML
        : "";

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
              "Thank you! Your request has been submitted. " +
              "WMForge will review it and contact you about pricing and delivery.";
          }
        } else {
          let message =
            "We couldn't submit your request. Please try again in a moment.";

          try {
            const result = await response.json();

            if (
              result &&
              Array.isArray(result.errors) &&
              result.errors.length
            ) {
              message = result.errors
                .map(error => error.message)
                .join(" ");
            }
          } catch (_) {
            // Keep the default error message.
          }

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
