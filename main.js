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
    return root.lang === "ru" ? "ru" : "en";
  }

  function t(en, ru) {
    return lang() === "ru" ? ru : en;
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
    openModal();
  }

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
      if (lng) {
        root.lang = lng;
        try {
          localStorage.setItem("odcv-lang", lng);
        } catch (e) {
          /* ignore */
        }
        document.querySelectorAll(".lang-toggle button").forEach(function (b) {
          b.setAttribute("aria-pressed", b.getAttribute("data-set-lang") === lng ? "true" : "false");
        });
      }
    });
  });

  try {
    var saved = localStorage.getItem("odcv-lang");
    if (saved === "ru" || saved === "en") {
      root.lang = saved;
      document.querySelectorAll(".lang-toggle button").forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-set-lang") === saved ? "true" : "false");
      });
    }
  } catch (e) {
    /* ignore */
  }

  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  window.addEventListener("resize", updateScrollProgress);
  updateScrollProgress();

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    var id = a.getAttribute("href").slice(1);
    if (!id || id === "modal") return;
    var target = document.getElementById(id);
    if (!target) return;
    a.addEventListener("click", function (e) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
})();
