/* ============================================================
   Darihome — interactions
   Scroll reveal · sticky header · drawers · gallery · qty ·
   accordions · filters · cart · zoom
   ============================================================ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    const items = $$(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    items.forEach((el) => io.observe(el));
  }

  /* ---------- Sticky header state ---------- */
  function initHeader() {
    const header = $(".site-header");
    if (!header) return;
    const solidAt = header.dataset.solidAt ? parseInt(header.dataset.solidAt, 10) : 40;
    const update = () => header.classList.toggle("is-solid", window.scrollY > solidAt);
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ---------- Hero parallax ---------- */
  function initParallax() {
    if (reduceMotion) return;
    const layer = $("[data-parallax]");
    if (!layer) return;
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        layer.style.transform = `translate3d(0, ${Math.min(y * 0.14, 120)}px, 0)`;
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Mobile nav drawer ---------- */
  function initDrawer() {
    const openBtn = $("[data-open-menu]");
    const drawer = $("[data-drawer='menu']");
    const scrim = $("[data-scrim]");
    if (!drawer) return;
    const closeEls = $$("[data-close-menu]");
    const open = () => { drawer.classList.add("is-open"); scrim.classList.add("is-open"); document.body.style.overflow = "hidden"; };
    const close = () => { drawer.classList.remove("is-open"); scrim.classList.remove("is-open"); document.body.style.overflow = ""; };
    on(openBtn, "click", open);
    closeEls.forEach((el) => on(el, "click", close));
    on(scrim, "click", close);
    on(document, "keydown", (e) => { if (e.key === "Escape") close(); });
    // Close drawer when a nav link is tapped
    $$("[data-drawer='menu'] a").forEach((a) => on(a, "click", close));
  }

  /* ---------- Filters drawer (shop, mobile) ---------- */
  function initFilters() {
    const openBtn = $("[data-open-filters]");
    const drawer = $("[data-drawer='filters']");
    const scrim = $("[data-filters-scrim]");
    if (!drawer) return;
    const open = () => { drawer.classList.add("is-open"); scrim.classList.add("is-open"); document.body.style.overflow = "hidden"; };
    const close = () => { drawer.classList.remove("is-open"); scrim.classList.remove("is-open"); document.body.style.overflow = ""; };
    on(openBtn, "click", open);
    $$("[data-close-filters]").forEach((el) => on(el, "click", close));
    on(scrim, "click", close);
  }

  /* ---------- Active category chips ---------- */
  function initChips() {
    $$("[data-chip-group]").forEach((group) => {
      $$("button, a", group).forEach((chip) => {
        on(chip, "click", (e) => {
          if (chip.tagName === "A" && chip.getAttribute("href") && chip.getAttribute("href") !== "#") return;
          e.preventDefault();
          $$("[aria-pressed]", group).forEach((c) => c.setAttribute("aria-pressed", "false"));
          chip.setAttribute("aria-pressed", "true");
        });
      });
    });
  }

  /* ---------- Quantity stepper ---------- */
  function initQty() {
    $$("[data-qty]").forEach((wrap) => {
      const input = $("input", wrap);
      const dec = $("[data-qty-dec]", wrap);
      const inc = $("[data-qty-inc]", wrap);
      const clamp = (v) => Math.max(1, Math.min(99, v || 1));
      on(dec, "click", () => { input.value = clamp(parseInt(input.value, 10) - 1); });
      on(inc, "click", () => { input.value = clamp(parseInt(input.value, 10) + 1); });
      on(input, "change", () => { input.value = clamp(parseInt(input.value, 10)); });
    });
  }

  /* ---------- Finish (variant) selector ---------- */
  function initVariants() {
    $$("[data-variant-group]").forEach((group) => {
      $$("button", group).forEach((btn) => {
        on(btn, "click", () => {
          $$("button", group).forEach((b) => b.setAttribute("aria-pressed", "false"));
          btn.setAttribute("aria-pressed", "true");
        });
      });
    });
  }

  /* ---------- Product gallery ---------- */
  function initGallery() {
    const main = $("[data-gallery-main]");
    if (!main) return;
    const img = $("img", main);
    $$("[data-thumb]").forEach((thumb) => {
      on(thumb, "click", () => {
        $$("[data-thumb]").forEach((t) => t.classList.remove("is-active"));
        thumb.classList.add("is-active");
        const src = thumb.getAttribute("data-src") || $("img", thumb).src;
        img.src = src;
      });
    });
    // Click-to-zoom
    on(main, "click", () => main.classList.toggle("zoomed"));
    on(main, "mousemove", (e) => {
      if (!main.classList.contains("zoomed")) return;
      const r = main.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      img.style.transformOrigin = `${x}% ${y}%`;
    });
    on(main, "mouseleave", () => main.classList.remove("zoomed"));
  }

  /* ---------- Accordions ---------- */
  function initAccordions() {
    $$(".accordion").forEach((acc) => {
      const btn = $("[data-accordion-toggle]", acc);
      on(btn, "click", () => {
        const open = acc.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", String(open));
      });
    });
  }

  /* ---------- Add to cart ---------- */
  let cartCount = 0;
  function initCart() {
    const badge = $("[data-cart-badge]");
    $$("[data-add-cart]").forEach((btn) => {
      on(btn, "click", (e) => {
        e.preventDefault();
        const qtyInput = btn.closest("[data-buy]") ? $("[data-qty] input", btn.closest("[data-buy]")) : null;
        cartCount += qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
        if (badge) {
          badge.textContent = cartCount;
          badge.classList.remove("hidden");
          badge.classList.add("pop");
          setTimeout(() => badge.classList.remove("pop"), 300);
        }
        // Confirmation text swap
        const label = btn.querySelector("[data-add-label]");
        if (label && btn.dataset.addedText) {
          const original = label.textContent;
          label.textContent = btn.dataset.addedText;
          btn.classList.add("is-added");
          setTimeout(() => {
            const key = label.getAttribute("data-i18n");
            const dict = window.DariI18n;
            label.textContent = original;
            btn.classList.remove("is-added");
          }, 1600);
        }
      });
    });
  }

  /* ---------- Newsletter / prevent empty submits ---------- */
  function initForms() {
    $$("form[data-newsletter]").forEach((form) => {
      on(form, "submit", (e) => {
        e.preventDefault();
        const input = $("input", form);
        const note = $("[data-form-note]", form);
        if (input && input.value.trim()) {
          form.reset();
          if (note) { note.classList.add("text-primary"); }
        }
      });
    });
  }

  /* ---------- Price range: keep two thumbs sane ---------- */
  function initRange() {
    const min = $("[data-range-min]");
    const max = $("[data-range-max]");
    const out = $("[data-range-out]");
    if (!min || !max) return;
    const render = () => {
      let lo = parseInt(min.value, 10), hi = parseInt(max.value, 10);
      if (lo > hi) { [lo, hi] = [hi, lo]; }
      if (out) out.textContent = `${lo} — ${hi} DT`;
    };
    on(min, "input", render); on(max, "input", render);
    render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    initReveal();
    initHeader();
    initParallax();
    initDrawer();
    initFilters();
    initChips();
    initQty();
    initVariants();
    initGallery();
    initAccordions();
    initCart();
    initForms();
    initRange();
  });
})();
