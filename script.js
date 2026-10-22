
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

  const revealItems = $$(".reveal");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -25px 0px" }
    );

    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add("is-visible"));
  }

  const progress = $("#scrollProgress");
  const backToTop = $("#backToTop");
  const siteHeader = document.querySelector(".site-header");

  let scrollTicking = false;
  let lastScrollY = window.scrollY;

  const updateScrollUI = () => {
    const currentScrollY = window.scrollY;
    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;
    const percent =
      maxScroll > 0 ? (currentScrollY / maxScroll) * 100 : 0;

    if (progress) {
      progress.style.width =
        `${Math.min(100, Math.max(0, percent))}%`;
    }

    if (backToTop) {
      backToTop.classList.toggle("visible", currentScrollY > 420);
    }

    if (siteHeader) {
      if (currentScrollY <= 70 || currentScrollY < lastScrollY) {
        siteHeader.classList.remove("site-header--hidden");
      } else if (currentScrollY > lastScrollY) {
        siteHeader.classList.add("site-header--hidden");
      }
    }

    lastScrollY = currentScrollY;
    scrollTicking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!scrollTicking) {
        window.requestAnimationFrame(updateScrollUI);
        scrollTicking = true;
      }
    },
    { passive: true }
  );

  updateScrollUI();

  if (backToTop) {
    backToTop.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  }

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  // Expand/collapse the free PPT download list
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

  // Video library and optional YouTube automatic sync
  const videoGrid = $("#videoGrid");
  const videoFilters = $$(".video-filter");
  const videoSearch = $("#videoSearch");
  const videoEmpty = $("#videoEmpty");

  let videoCards = $$(".video-card", videoGrid || document);
  let activeVideoFilter = "all";

  // Add your restricted YouTube Data API key to enable automatic syncing.
  const YOUTUBE_API_KEY = "AIzaSyBTPM8jvQYJIANu6CvRuC3-KF0c3uBqzwo";
  const YOUTUBE_HANDLE = "wmforgeofficial";

  const escapeHtml = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));

  const loadYouTubeVideos = async () => {
    if (
      !videoGrid ||
      !YOUTUBE_API_KEY ||
      YOUTUBE_API_KEY === "ADD_YOUTUBE_DATA_API_KEY_HERE"
    ) {
      return;
    }

    try {
      const channelUrl = new URL(
        "https://www.googleapis.com/youtube/v3/channels"
      );

      channelUrl.search = new URLSearchParams({
        part: "contentDetails",
        forHandle: YOUTUBE_HANDLE,
        key: YOUTUBE_API_KEY
      }).toString();

      const channelResponse = await fetch(channelUrl.toString());

      if (!channelResponse.ok) {
        throw new Error("Unable to retrieve YouTube channel.");
      }

      const channelData = await channelResponse.json();

      const uploadsPlaylistId =
        channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

      if (!uploadsPlaylistId) {
        throw new Error("YouTube uploads playlist was not found.");
      }

      const playlistUrl = new URL(
        "https://www.googleapis.com/youtube/v3/playlistItems"
      );

      playlistUrl.search = new URLSearchParams({
        part: "snippet,contentDetails",
        playlistId: uploadsPlaylistId,
        maxResults: "50",
        key: YOUTUBE_API_KEY
      }).toString();

      const videosResponse = await fetch(playlistUrl.toString());

      if (!videosResponse.ok) {
        throw new Error("Unable to retrieve YouTube uploads.");
      }

      const videosData = await videosResponse.json();

      const videos = (videosData.items || []).filter(item =>
        item.snippet?.title &&
        item.snippet.title !== "Private video" &&
        item.contentDetails?.videoId
      );

      if (!videos.length) return;

      const generatedCards = videos.map((item, index) => {
        const snippet = item.snippet;
        const videoId = item.contentDetails.videoId;
        const title = snippet.title || "WMForge SAP WM video";
        const thumbnails = snippet.thumbnails || {};

        // Use the highest-quality thumbnail YouTube provides.
        const thumbnail =
          thumbnails.maxres?.url ||
          thumbnails.standard?.url ||
          thumbnails.high?.url ||
          thumbnails.medium?.url ||
          thumbnails.default?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        const videoUrl =
          `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;

        const titleForAttribute = escapeHtml(title);
        const card = document.createElement("article");

        card.className = "video-card";
        card.dataset.category = "all";
        card.dataset.title = title.toLowerCase();

        card.innerHTML = `
          <a class="video-thumb"
             href="${videoUrl}"
             target="_blank"
             rel="noopener noreferrer"
             aria-label="Watch ${titleForAttribute}"
             style="background-image:linear-gradient(0deg,rgba(2,10,20,.45),rgba(2,10,20,.04)),url('${thumbnail.replace(/'/g, "%27")}');background-size:cover;background-position:center;">
            <span class="video-number" aria-label="Video ${index + 1}">
              ${String(index + 1).padStart(2, "0")}
            </span>
            <span class="thumb-play" aria-hidden="true">▶</span>
          </a>
          <div class="video-card-body">
            <h3>${titleForAttribute}</h3>
            <a class="watch-link"
               href="${videoUrl}"
               target="_blank"
               rel="noopener noreferrer">
              <span class="youtube-mark">▶</span>
              Watch video
              <span class="watch-arrow">↗</span>
            </a>
          </div>`;

        return card;
      });

      // Replace the existing video cards only after a successful response.
      videoGrid.querySelectorAll(".video-marquee-row").forEach(row =>
        row.remove()
      );

      videoGrid.replaceChildren(...generatedCards);
      videoCards = generatedCards;

      const allFilterCount =
        $('.video-filter[data-video-filter="all"] span');

      if (allFilterCount) {
        allFilterCount.textContent = String(generatedCards.length);
      }
    } catch (error) {
      // Keep the existing video cards if YouTube loading fails.
      console.warn(
        "WMForge YouTube auto-sync is unavailable; showing the saved video cards.",
        error
      );
    }
  };

  const initializeVideoMarquee = () => {
    if (
      !videoGrid ||
      videoCards.length === 0 ||
      videoGrid.querySelector(".video-marquee-row")
    ) {
      return;
    }

    const midpoint = Math.ceil(videoCards.length / 2);
    const rows = [
      videoCards.slice(0, midpoint),
      videoCards.slice(midpoint)
    ];

    rows.forEach((cards, rowIndex) => {
      if (!cards.length) return;

      const row = document.createElement("div");
      row.className =
        `video-marquee-row video-marquee-row-${rowIndex + 1}`;

      row.setAttribute(
        "aria-label",
        `Videos ${
          rowIndex === 0 ? 1 : midpoint + 1
        } to ${
          rowIndex === 0 ? midpoint : videoCards.length
        }`
      );

      const track = document.createElement("div");
      track.className = "video-marquee-track";

      [false, true].forEach(isCloneGroup => {
        const group = document.createElement("div");
        group.className = "video-marquee-group";

        if (isCloneGroup) {
          group.setAttribute("aria-hidden", "true");
        }

        cards.forEach(card => {
          if (!isCloneGroup) {
            card.classList.remove("reveal", "is-visible");
            group.appendChild(card);
          } else {
            const clone = card.cloneNode(true);

            clone.classList.remove("reveal", "is-visible");
            clone.classList.add("video-card-clone");
            clone.removeAttribute("id");
            clone.setAttribute("aria-hidden", "true");

            clone.querySelectorAll(
              "a, button, input, select, textarea, [tabindex]"
            ).forEach(element => {
              element.setAttribute("tabindex", "-1");
            });

            group.appendChild(clone);
          }
        });

        track.appendChild(group);
      });

      row.appendChild(track);
      videoGrid.appendChild(row);
    });
  };

  const applyVideoFilters = () => {
    const query = videoSearch
      ? videoSearch.value.trim().toLowerCase()
      : "";

    let visibleCount = 0;
    const isFiltered =
      activeVideoFilter !== "all" || query.length > 0;

    if (videoGrid) {
      videoGrid.classList.toggle("video-grid--filtered", isFiltered);
    }

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

    if (videoGrid) {
      videoGrid.querySelectorAll(".video-card-clone").forEach(card => {
        card.hidden = isFiltered;
      });
    }

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

  // Load videos before building the marquee to prevent duplicate rows.
  (async () => {
    await loadYouTubeVideos();
    initializeVideoMarquee();
    applyVideoFilters();
  })();

  // Submit custom paid-content requests through Formspree
  const customRequestForm = $("#customRequestForm");

  if (customRequestForm) {
    customRequestForm.addEventListener("submit", async event => {
      event.preventDefault();

      if (!customRequestForm.reportValidity()) return;

      const submitButton =
        customRequestForm.querySelector('button[type="submit"]');

      const status = $("#requestFormStatus");
      const originalButtonText =
        submitButton ? submitButton.innerHTML : "";

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
