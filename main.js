(function () {
  "use strict";

  var MATRIX_PROJECT = {
    "1": "game-ui",
    "2": "gate19",
    "3": "javhd",
    "4": "corgday",
    "5": "shugarai",
    "6": "adbot",
  };

  var root = document.documentElement;
  var progressEl = document.getElementById("scrollProgress");
  var toastEl = document.getElementById("toast");
  var backTopEl = document.getElementById("backToTop");
  var modal = document.getElementById("siteModal");
  var modalTitle = document.getElementById("modalTitle");
  var modalBody = document.getElementById("modalBody");
  var modalLinkWrap = document.getElementById("modalLinkWrap");
  var modalLink = document.getElementById("modalLink");
  var modalClose = document.getElementById("modalClose");
  var modalCta = document.getElementById("modalCta");
  var modalDialog = modal ? modal.querySelector(".modal__dialog") : null;

  function lang() {
    return root.getAttribute("lang") === "ru" ? "ru" : "en";
  }

  function t(en, ru) {
    return lang() === "ru" ? ru : en;
  }

  function setLangBodyClass() {
    document.body.classList.remove("lang-en", "lang-ru");
    document.body.classList.add(lang() === "ru" ? "lang-ru" : "lang-en");
  }

  function applyI18n() {
    document.querySelectorAll(".i18n").forEach(function (el) {
      var en = el.getAttribute("data-en");
      var ru = el.getAttribute("data-ru");
      if (en == null || ru == null) return;
      el.textContent = lang() === "ru" ? ru : en;
    });
    setLangBodyClass();
    refreshMatrixChipLabels();
    refreshModalIfOpen();
  }

  function refreshMatrixChipLabels() {
    var l = lang();
    document.querySelectorAll(".matrix-chip").forEach(function (btn) {
      var te = btn.getAttribute("data-label-en");
      var tr = btn.getAttribute("data-label-ru");
      if (te != null && tr != null) btn.textContent = l === "ru" ? tr : te;
    });
  }

  function duplicateHeroLane() {
    var inner = document.querySelector(".hero-scroll-inner");
    if (!inner || inner.querySelector(".hero-lane-card--clone")) return;
    var orig = inner.querySelectorAll(".hero-lane-card:not(.hero-lane-card--clone)");
    orig.forEach(function (card) {
      var c = card.cloneNode(true);
      c.classList.add("hero-lane-card--clone");
      c.setAttribute("aria-hidden", "true");
      inner.appendChild(c);
    });
  }

  function renderMatrixChips() {
    var rootEl = document.getElementById("matrixChipsRoot");
    var rows = window.MATRIX_CHIPS;
    if (!rootEl || !rows || !rows.length) return;
    rootEl.innerHTML = "";
    rows.forEach(function (row) {
      var pid = MATRIX_PROJECT[row.p];
      if (!pid) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "matrix-chip";
      btn.setAttribute("data-matrix-cat", row.c);
      btn.setAttribute("data-project", pid);
      btn.setAttribute("data-label-en", row.en);
      btn.setAttribute("data-label-ru", row.ru);
      btn.textContent = lang() === "ru" ? row.ru : row.en;
      rootEl.appendChild(btn);
    });
    updateMatrixChipHighlight();
  }

  function updateMatrixChipHighlight() {
    var active = document.querySelector(".matrix-cat-btn--active");
    var cat = active ? active.getAttribute("data-matrix-cat") : "1";
    document.querySelectorAll(".matrix-chip").forEach(function (chip) {
      var on = chip.getAttribute("data-matrix-cat") === cat;
      chip.classList.toggle("matrix-chip--dim", !on);
      chip.classList.toggle("matrix-chip--hot", on);
    });
  }

  function bindMatrixUi() {
    document.querySelectorAll(".matrix-cat-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".matrix-cat-btn").forEach(function (b) {
          b.classList.remove("matrix-cat-btn--active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("matrix-cat-btn--active");
        btn.setAttribute("aria-pressed", "true");
        updateMatrixChipHighlight();
      });
    });
    var chipsRoot = document.getElementById("matrixChipsRoot");
    if (chipsRoot) {
      chipsRoot.addEventListener("click", function (e) {
        var chip = e.target.closest(".matrix-chip");
        if (!chip) return;
        var pid = chip.getAttribute("data-project");
        var card = document.querySelector('.work-card[data-project="' + pid + '"]');
        if (card) openProjectModal(card);
      });
    }
  }

  function updateHeroLaneParallax(wrap) {
    if (!wrap) return;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var rect = wrap.getBoundingClientRect();
    var mid = rect.left + rect.width / 2;
    wrap.querySelectorAll(".hero-lane-card").forEach(function (card) {
      if (reduced) {
        card.style.removeProperty("--hero-scale");
        card.style.removeProperty("--hero-ty");
        card.style.removeProperty("--hero-rx");
        card.style.removeProperty("--hero-ry");
        card.style.zIndex = "";
        return;
      }
      var r = card.getBoundingClientRect();
      if (r.width === 0) return;
      var c = r.left + r.width / 2;
      var dist = (c - mid) / (rect.width * 0.55);
      dist = Math.max(-1, Math.min(1, dist));
      var abs = Math.abs(dist);
      var sign = dist < 0 ? -1 : 1;
      card.style.setProperty("--hero-scale", String(1 - abs * 0.07));
      card.style.setProperty("--hero-ty", String(abs * 6) + "px");
      card.style.setProperty("--hero-rx", String(-sign * abs * 7) + "deg");
      card.style.setProperty("--hero-ry", String(sign * abs * 10) + "deg");
      card.style.zIndex = String(Math.round(20 - abs * 12));
    });
  }

  function initHeroCarouselFx() {
    var wrap = document.querySelector(".hero-scroll");
    var inner = document.querySelector(".hero-scroll-inner");
    if (!wrap || !inner) return;

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var pausedUntil = 0;
    var drag = false;
    var sx = 0;
    var sl0 = 0;
    var moved = false;
    var suppressClick = false;

    function pause(ms) {
      pausedUntil = Math.max(pausedUntil, Date.now() + (ms || 1400));
    }

    wrap.addEventListener("mouseenter", function () {
      pause(1400);
    });
    wrap.addEventListener("wheel", function () {
      pause(1400);
    }, { passive: true });
    wrap.addEventListener("touchstart", function () {
      pause(1400);
    }, { passive: true });

    wrap.addEventListener("mousedown", function (e) {
      if (e.button !== 0) return;
      drag = true;
      moved = false;
      sx = e.pageX;
      sl0 = wrap.scrollLeft;
    });
    window.addEventListener("mouseup", function () {
      if (drag && moved) suppressClick = true;
      drag = false;
    });
    wrap.addEventListener("mousemove", function (e) {
      if (!drag) return;
      var d = sx - e.pageX;
      if (Math.abs(d) > 4) moved = true;
      wrap.scrollLeft = sl0 + d;
    });

    wrap.addEventListener(
      "click",
      function (e) {
        if (suppressClick) {
          e.preventDefault();
          e.stopPropagation();
          suppressClick = false;
        }
      },
      true
    );

    function onScrollOrResize() {
      updateHeroLaneParallax(wrap);
    }
    wrap.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    onScrollOrResize();

    function tick() {
      requestAnimationFrame(tick);
      if (reduced || Date.now() < pausedUntil) return;
      var half = inner.scrollWidth / 2;
      if (half < 20) return;
      wrap.scrollLeft += 0.48;
      if (wrap.scrollLeft >= half - 0.5) wrap.scrollLeft -= half;
      updateHeroLaneParallax(wrap);
    }
    if (!reduced) requestAnimationFrame(tick);
  }

  function initExpAccordionExclusive() {
    var root = document.querySelector("#experience .accordion-stack");
    if (!root) return;
    root.querySelectorAll("details").forEach(function (d) {
      d.addEventListener("toggle", function () {
        if (!d.open) return;
        root.querySelectorAll("details").forEach(function (o) {
          if (o !== d) o.open = false;
        });
      });
    });
  }

  function initVisObserver() {
    if (!window.IntersectionObserver) {
      document.querySelectorAll(".vis").forEach(function (el) {
        el.classList.add("vis-in");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("vis-in");
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.06 }
    );
    document.querySelectorAll(".vis").forEach(function (el, i) {
      el.style.setProperty("--vis-delay", String((i % 8) * 35) + "ms");
      io.observe(el);
    });
  }

  function initFooterParallax3D() {
    var el = document.querySelector(".footer-parallax-target");
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    el.addEventListener("mousemove", function (e) {
      var r = el.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--fpx", x * 14 + "px");
      el.style.setProperty("--fpy", y * 10 + "px");
      el.style.setProperty("--frx", -y * 7 + "deg");
      el.style.setProperty("--fry", x * 9 + "deg");
    });
    el.addEventListener("mouseleave", function () {
      el.style.setProperty("--fpx", "0px");
      el.style.setProperty("--fpy", "0px");
      el.style.setProperty("--frx", "0deg");
      el.style.setProperty("--fry", "0deg");
    });
  }

  function initMatrixCatParallax3D() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.querySelectorAll(".matrix-cat-btn").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        btn.style.setProperty("--mpx", x * 10 + "px");
        btn.style.setProperty("--mpy", y * 8 + "px");
        btn.style.setProperty("--mrx", -y * 5 + "deg");
        btn.style.setProperty("--mry", x * 7 + "deg");
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.removeProperty("--mpx");
        btn.style.removeProperty("--mpy");
        btn.style.removeProperty("--mrx");
        btn.style.removeProperty("--mry");
      });
    });
  }

  function syncSkillDataFromJSON() {
    var B = window.ODCV_SKILL_BODIES;
    if (!B) return;
    Object.keys(B).forEach(function (k) {
      var card = document.querySelector('.skill-card[data-skill="' + k + '"]');
      if (!card) return;
      var p = B[k];
      card.setAttribute("data-title-en", p.title_en);
      card.setAttribute("data-title-ru", p.title_ru);
      card.setAttribute("data-body-en", p.body_en);
      card.setAttribute("data-body-ru", p.body_ru);
    });
  }

  function injectUiverseLights() {
    var selectors = [".skill-card", ".work-card.work-card--interactive"];
    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (card) {
        if (card.querySelector(".uiverse-card__lights")) return;
        card.classList.add("uiverse-card", "vaib-card");
        var lights = document.createElement("div");
        lights.className = "uiverse-card__lights";
        lights.setAttribute("aria-hidden", "true");
        for (var i = 1; i <= 5; i++) {
          var span = document.createElement("span");
          span.className = "uiverse-card__light uiverse-card__light--" + i;
          lights.appendChild(span);
        }
        var inner = document.createElement("div");
        inner.className = "uiverse-card__inner";
        while (card.firstChild) {
          inner.appendChild(card.firstChild);
        }
        card.appendChild(lights);
        card.appendChild(inner);
      });
    });
  }

  function initVaibParallax() {
    document.querySelectorAll(".vaib-card").forEach(function (card) {
      var pending = null;
      card.style.setProperty("--vaib-rx", "0deg");
      card.style.setProperty("--vaib-ry", "0deg");
      card.addEventListener(
        "mousemove",
        function (e) {
          if (pending) cancelAnimationFrame(pending);
          pending = requestAnimationFrame(function () {
            pending = null;
            var r = card.getBoundingClientRect();
            if (r.width <= 0 || r.height <= 0) return;
            var x = (e.clientX - r.left) / r.width - 0.5;
            var y = (e.clientY - r.top) / r.height - 0.5;
            card.style.setProperty("--vaib-ry", x * 15 + "deg");
            card.style.setProperty("--vaib-rx", -y * 11 + "deg");
          });
        },
        { passive: true }
      );
      card.addEventListener(
        "mouseleave",
        function () {
          card.style.setProperty("--vaib-ry", "0deg");
          card.style.setProperty("--vaib-rx", "0deg");
        },
        { passive: true }
      );
    });
  }

  function showToast() {
    if (!toastEl) return;
    toastEl.textContent = t("Section link copied", "Ссылка на секцию скопирована");
    toastEl.hidden = false;
    toastEl.setAttribute("role", "status");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toastEl.hidden = true;
    }, 2600);
  }

  function copyAnchor(hash) {
    var url = location.origin + location.pathname + location.search + "#" + hash;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(showToast).catch(function () {
        fallbackCopy(url);
      });
    } else {
      fallbackCopy(url);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      showToast();
    } catch (e) {
      /* ignore */
    }
    document.body.removeChild(ta);
  }

  function updateScrollProgress() {
    if (!progressEl) return;
    var doc = document.documentElement;
    var scrollTop = window.scrollY || doc.scrollTop;
    var max = doc.scrollHeight - doc.clientHeight;
    var pct = max <= 0 ? 0 : Math.round((scrollTop / max) * 100);
    progressEl.style.width = pct + "%";
    progressEl.setAttribute("aria-valuenow", String(pct));
    if (backTopEl) {
      backTopEl.hidden = scrollTop < 560;
    }
  }

  function openModal() {
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    if (modalCta) modalCta.hidden = false;
    if (modalDialog && typeof modalDialog.focus === "function") modalDialog.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    modalBody.innerHTML = "";
    modalLinkWrap.hidden = true;
    modalLink.href = "#";
    modalLink.textContent = "";
    if (modalCta) modalCta.hidden = true;
    modal.removeAttribute("data-open-type");
    modal.removeAttribute("data-open-ref");
  }

  function skillCardForRef(ref) {
    return document.querySelector('.skill-card[data-skill="' + ref + '"]');
  }

  function openSkillModal(ref) {
    var B = window.ODCV_SKILL_BODIES && window.ODCV_SKILL_BODIES[ref];
    var card = skillCardForRef(ref);
    var l = lang();
    var title;
    var body;
    if (B) {
      title = l === "ru" ? B.title_ru : B.title_en;
      body = l === "ru" ? B.body_ru : B.body_en;
    } else if (card) {
      title = l === "ru" ? card.getAttribute("data-title-ru") : card.getAttribute("data-title-en");
      body = l === "ru" ? card.getAttribute("data-body-ru") : card.getAttribute("data-body-en");
    } else {
      return;
    }
    modalTitle.textContent = title || "";
    modalBody.innerHTML = "";
    var p = document.createElement("p");
    p.className = "modal__text";
    p.textContent = body || "";
    modalBody.appendChild(p);
    modalLinkWrap.hidden = true;
    modal.setAttribute("data-open-type", "skill");
    modal.setAttribute("data-open-ref", ref);
    openModal();
  }

  function projectParagraph(card, l, bi, pi) {
    var b = card.getAttribute(l === "ru" ? "data-" + bi + "-ru" : "data-" + bi + "-en");
    if (b) return b;
    return card.getAttribute(l === "ru" ? "data-" + pi + "-ru" : "data-" + pi + "-en");
  }

  function openProjectModal(card) {
    if (!card) return;
    var l = lang();
    var title = l === "ru" ? card.getAttribute("data-title-ru") : card.getAttribute("data-title-en");
    var p1 = projectParagraph(card, l, "b1", "p1");
    var p2 = projectParagraph(card, l, "b2", "p2");
    var p3 = projectParagraph(card, l, "b3", "p3");
    var link = card.getAttribute("data-link-url");
    var linkLabel = card.getAttribute("data-link-label");

    modalTitle.textContent = title || "";
    modalBody.innerHTML = "";
    [p1, p2, p3].forEach(function (text) {
      if (!text) return;
      var p = document.createElement("p");
      p.className = "modal__text";
      p.textContent = text;
      modalBody.appendChild(p);
    });

    if (link && link.trim() && linkLabel && linkLabel.trim()) {
      modalLink.href = link;
      modalLink.textContent = linkLabel;
      modalLinkWrap.hidden = false;
    } else {
      modalLinkWrap.hidden = true;
    }
    var pid = card.getAttribute("data-project");
    if (pid) {
      modal.setAttribute("data-open-type", "project");
      modal.setAttribute("data-open-ref", pid);
    }
    openModal();
  }

  function refreshModalIfOpen() {
    if (!modal || modal.hidden) return;
    var type = modal.getAttribute("data-open-type");
    var ref = modal.getAttribute("data-open-ref");
    if (!type || !ref) return;
    if (type === "skill") {
      openSkillModal(ref);
    } else if (type === "project") {
      var c = document.querySelector('.work-card[data-project="' + ref + '"]');
      if (c) openProjectModal(c);
    }
  }

  function bindUi() {
    document.querySelectorAll(".hero-lane-card__icon-link").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    });

    document.querySelectorAll(".hero-lane-card").forEach(function (card) {
      card.addEventListener("click", function () {
        var ref = card.getAttribute("data-skill-ref");
        if (ref) openSkillModal(ref);
      });
      card.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        var ref = card.getAttribute("data-skill-ref");
        if (ref) openSkillModal(ref);
      });
    });

    document.querySelectorAll(".skill-card[data-skill]").forEach(function (card) {
      card.addEventListener("click", function () {
        openSkillModal(card.getAttribute("data-skill"));
      });
    });

    document.querySelectorAll(".work-card[data-project]").forEach(function (card) {
      card.addEventListener("click", function () {
        openProjectModal(card);
      });
    });

    document.querySelectorAll(".section__copy-link").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var hash = btn.getAttribute("data-anchor");
        if (hash) copyAnchor(hash);
      });
    });

    if (modalClose) modalClose.addEventListener("click", closeModal);
    if (modal) {
      modal.addEventListener("click", function (e) {
        if (e.target === modal) closeModal();
      });
    }

    document.querySelectorAll(".skill-card__icon-link").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal && !modal.hidden) closeModal();
    });

    if (backTopEl) {
      backTopEl.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    document.querySelectorAll(".lang-toggle button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var lng = btn.getAttribute("data-set-lang");
        if (!lng) return;
        root.setAttribute("lang", lng);
        try {
          localStorage.setItem("odcv-lang", lng);
        } catch (e) {
          /* ignore */
        }
        document.querySelectorAll(".lang-toggle button").forEach(function (b) {
          b.setAttribute("aria-pressed", b.getAttribute("data-set-lang") === lng ? "true" : "false");
        });
        applyI18n();
      });
    });

    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    window.addEventListener("resize", updateScrollProgress);

    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      a.addEventListener("click", function (e) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function init() {
    syncSkillDataFromJSON();
    duplicateHeroLane();
    renderMatrixChips();
    bindMatrixUi();
    injectUiverseLights();
    initVaibParallax();
    bindUi();
    initHeroCarouselFx();
    initExpAccordionExclusive();
    initVisObserver();
    initFooterParallax3D();
    initMatrixCatParallax3D();
    try {
      var saved = localStorage.getItem("odcv-lang");
      if (saved === "ru" || saved === "en") {
        root.setAttribute("lang", saved);
        document.querySelectorAll(".lang-toggle button").forEach(function (b) {
          b.setAttribute("aria-pressed", b.getAttribute("data-set-lang") === saved ? "true" : "false");
        });
      }
    } catch (e) {
      /* ignore */
    }
    applyI18n();
    updateScrollProgress();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
