(function () {
  "use strict";

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
  var modalDialog = modal ? modal.querySelector(".modal__dialog") : null;

  function lang() {
    return root.getAttribute("lang") === "ru" ? "ru" : "en";
  }

  function t(en, ru) {
    return lang() === "ru" ? ru : en;
  }

  function applyI18n() {
    document.querySelectorAll(".i18n").forEach(function (el) {
      var en = el.getAttribute("data-en");
      var ru = el.getAttribute("data-ru");
      if (en == null || ru == null) return;
      el.textContent = lang() === "ru" ? ru : en;
    });
    document.body.classList.toggle("is-lang-ru", lang() === "ru");
    document.body.classList.toggle("is-lang-en", lang() === "en");
    refreshModalIfOpen();
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
    modal.removeAttribute("data-open-type");
    modal.removeAttribute("data-open-ref");
  }

  function skillCardForRef(ref) {
    return document.querySelector('.skill-card[data-skill="' + ref + '"]');
  }

  function openSkillModal(ref) {
    var card = skillCardForRef(ref);
    if (!card) return;
    var l = lang();
    var title = l === "ru" ? card.getAttribute("data-title-ru") : card.getAttribute("data-title-en");
    var body = l === "ru" ? card.getAttribute("data-body-ru") : card.getAttribute("data-body-en");
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

  function openProjectModal(card) {
    if (!card) return;
    var l = lang();
    var title = l === "ru" ? card.getAttribute("data-title-ru") : card.getAttribute("data-title-en");
    var p1 = l === "ru" ? card.getAttribute("data-p1-ru") : card.getAttribute("data-p1-en");
    var p2 = l === "ru" ? card.getAttribute("data-p2-ru") : card.getAttribute("data-p2-en");
    var p3 = l === "ru" ? card.getAttribute("data-p3-ru") : card.getAttribute("data-p3-en");
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
    document.querySelectorAll(".skill-strip__icon-link").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    });

    document.querySelectorAll(".skill-strip").forEach(function (strip) {
      strip.addEventListener("click", function () {
        var ref = strip.getAttribute("data-skill-ref");
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
    injectUiverseLights();
    initVaibParallax();
    bindUi();
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
