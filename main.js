/* ============================================================
   PORTFOLIO — Interaction Layer
   Vanilla JS · No dependencies
   ============================================================ */

(function () {
  "use strict";

  /* ----------------------------------------------------------
     0. HELPERS
     ---------------------------------------------------------- */

  /** Debounce: delays execution until `wait` ms after last call. */
  function debounce(fn, wait) {
    let timer;
    return function () {
      const ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  /** True when the user hasn't asked for reduced motion. */
  const motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Clamp a number between min and max. */
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  /* ----------------------------------------------------------
     1. MOBILE MENU TOGGLE
     ---------------------------------------------------------- */
  (function initMobileMenu() {
    const toggle = document.querySelector(".navbar__toggle");
    const menu   = document.getElementById("mobile-menu");
    if (!toggle || !menu) return;

    toggle.addEventListener("click", function () {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isOpen));
      menu.hidden = isOpen;                 // toggle visibility
      toggle.classList.toggle("is-active"); // hook for CSS bar animation
    });

    // Close menu when a mobile link is tapped
    menu.querySelectorAll(".navbar__mobile-link").forEach(function (link) {
      link.addEventListener("click", function () {
        toggle.setAttribute("aria-expanded", "false");
        menu.hidden = true;
        toggle.classList.remove("is-active");
      });
    });
  })();

  /* ----------------------------------------------------------
     2. SMOOTH SCROLLING (for all anchor links)
     ---------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: motionOK ? "smooth" : "auto", block: "start" });
    });
  });

  /* ----------------------------------------------------------
     3. ACTIVE NAV LINK ON SCROLL
     ---------------------------------------------------------- */
  (function initActiveNav() {
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".navbar__link");
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("id");
            navLinks.forEach(function (link) {
              link.classList.toggle(
                "is-active",
                link.getAttribute("href") === "#" + id
              );
            });
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );

    sections.forEach(function (sec) { observer.observe(sec); });
  })();

  /* ----------------------------------------------------------
     4. NAVBAR SCROLL INTENSITY
     Changes backdrop opacity/shadow when user scrolls down.
     ---------------------------------------------------------- */
  (function initNavbarScroll() {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    function update() {
      const scrollY = window.scrollY;
      const progress = clamp(scrollY / 300, 0, 1);

      // Darken glass & add shadow as user scrolls
      navbar.style.setProperty("--nav-scroll", progress);
      navbar.classList.toggle("navbar--scrolled", scrollY > 50);
    }

    window.addEventListener("scroll", debounce(update, 8), { passive: true });
    update(); // initial
  })();

  /* ----------------------------------------------------------
     5. SECTION REVEAL (fade-up on enter)
     Uses IntersectionObserver to add `.is-visible` class.
     ---------------------------------------------------------- */
  (function initReveal() {
    if (!motionOK) {
      // Show everything immediately if reduced-motion
      document.querySelectorAll(".animate-wrapper").forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target); // once only
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll(".animate-wrapper").forEach(function (el) {
      observer.observe(el);
    });
  })();

  /* ----------------------------------------------------------
     6. PARALLAX BACKGROUND BLOBS
     Subtle translation based on scroll position.
     ---------------------------------------------------------- */
  (function initParallax() {
    if (!motionOK) return;

    const blobs = document.querySelectorAll(".hero__blob");
    const bgGradients = document.querySelectorAll(".bg-layers__gradient");
    if (!blobs.length && !bgGradients.length) return;

    // Different speed factors for each blob
    const speeds = [0.03, -0.02, 0.015];

    function update() {
      const scrollY = window.scrollY;

      blobs.forEach(function (blob, i) {
        const speed = speeds[i] || 0.02;
        blob.style.transform =
          "translate3d(0," + (scrollY * speed) + "px,0)";
      });

      bgGradients.forEach(function (grad, i) {
        const speed = i === 0 ? 0.018 : -0.012;
        grad.style.transform =
          "translate3d(0," + (scrollY * speed) + "px,0)";
      });
    }

    window.addEventListener("scroll", function () {
      requestAnimationFrame(update);
    }, { passive: true });
  })();

  /* ----------------------------------------------------------
     7. TYPING EFFECT FOR HERO TAGLINE
     ---------------------------------------------------------- */
  (function initTyping() {
    if (!motionOK) return;

    const el = document.querySelector(".hero__tagline");
    if (!el) return;

    const fullText = el.textContent.trim();
    el.textContent = "";
    el.classList.add("typing-active");   // shows blinking cursor via CSS

    let charIndex = 0;
    const speed = 42; // ms per character

    function type() {
      if (charIndex < fullText.length) {
        el.textContent += fullText.charAt(charIndex);
        charIndex++;
        setTimeout(type, speed);
      } else {
        // Keep cursor blinking for a moment, then remove
        setTimeout(function () {
          el.classList.remove("typing-active");
          el.classList.add("typing-done");
        }, 2200);
      }
    }

    // Start typing once the hero section is visible
    const observer = new IntersectionObserver(
      function (entries, obs) {
        if (entries[0].isIntersecting) {
          setTimeout(type, 600); // slight delay after page load
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el.closest(".hero") || el);
  })();

  /* ----------------------------------------------------------
     8. BUTTON RIPPLE EFFECT
     ---------------------------------------------------------- */
  (function initRipple() {
    if (!motionOK) return;

    const buttons = document.querySelectorAll(
      ".hero__btn, .contact__submit"
    );

    buttons.forEach(function (btn) {
      // Ensure the button can contain the ripple
      btn.style.position = "relative";
      btn.style.overflow  = "hidden";

      btn.addEventListener("click", function (e) {
        const rect   = btn.getBoundingClientRect();
        const ripple = document.createElement("span");
        const size   = Math.max(rect.width, rect.height) * 2;

        ripple.className = "ripple";
        ripple.style.width  = size + "px";
        ripple.style.height = size + "px";
        ripple.style.left   = (e.clientX - rect.left - size / 2) + "px";
        ripple.style.top    = (e.clientY - rect.top  - size / 2) + "px";

        btn.appendChild(ripple);

        ripple.addEventListener("animationend", function () {
          ripple.remove();
        });
      });
    });
  })();

  /* ----------------------------------------------------------
     9. CARD 3D TILT EFFECT
     Very subtle perspective rotate on mouse move.
     ---------------------------------------------------------- */
  (function initTilt() {
    if (!motionOK) return;

    const cards = document.querySelectorAll(".project-card");
    const MAX_DEG = 4; // keep it subtle

    cards.forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width  - 0.5; // -0.5 … 0.5
        const y = (e.clientY - rect.top)  / rect.height - 0.5;

        card.style.transform =
          "perspective(800px) rotateY(" + (x * MAX_DEG) + "deg) rotateX(" + (-y * MAX_DEG) + "deg) translateY(-6px)";
      });

      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
        card.style.transition = "transform 0.4s cubic-bezier(0.22,1,0.36,1)";
        // Reset transition after settle
        setTimeout(function () { card.style.transition = ""; }, 400);
      });
    });
  })();

  /* ----------------------------------------------------------
     10. MAGNETIC HOVER FOR SMALL BUTTONS / LINKS
     Pulls the element slightly toward the cursor.
     ---------------------------------------------------------- */
  (function initMagnetic() {
    if (!motionOK) return;

    const targets = document.querySelectorAll(
      ".project-card__link, .footer__social-link, .navbar__link"
    );
    const STRENGTH = 0.3; // fraction of offset applied

    targets.forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        const rect = el.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width  / 2);
        const dy = e.clientY - (rect.top  + rect.height / 2);

        el.style.transform =
          "translate(" + (dx * STRENGTH) + "px," + (dy * STRENGTH) + "px)";
      });

      el.addEventListener("mouseleave", function () {
        el.style.transform = "translate(0,0)";
      });
    });
  })();

  /* ----------------------------------------------------------
     11. LAZY LOAD PROJECT IMAGES
     Uses IntersectionObserver on <img> with data-src.
     Falls back to native loading="lazy" for images without
     data-src (the HTML already has loading="lazy").
     ---------------------------------------------------------- */
  (function initLazyImages() {
    const images = document.querySelectorAll(".project-card__image[data-src]");
    if (!images.length) return;

    const observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute("data-src");
            obs.unobserve(img);
          }
        });
      },
      { rootMargin: "200px" }
    );

    images.forEach(function (img) { observer.observe(img); });
  })();

})();
