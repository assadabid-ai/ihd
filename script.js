/* ===================================================================
   Presentation navigation controller — offline, dependency-free.
   Prev/next buttons, keyboard arrows, progress bar, slide counter,
   per-slide "Slide X of Y" badges, fullscreen toggle, image lightbox.
   =================================================================== */
(function () {
  "use strict";

  var slides   = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var total    = slides.length;
  var current  = 0;

  var prevBtn  = document.getElementById("prevBtn");
  var nextBtn  = document.getElementById("nextBtn");
  var counter  = document.getElementById("counter");
  var progress = document.getElementById("progress");

  /* ---------- Lightbox ---------- */
  var lightbox    = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");
  var lightboxCap = document.getElementById("lightbox-caption");
  var lightboxX   = document.getElementById("lightbox-close");

  function lightboxOpen() { return lightbox.classList.contains("open"); }

  function openLightbox(img) {
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt || "";
    var fig = img.closest("figure");
    var cap = fig ? fig.querySelector("figcaption") : null;
    lightboxCap.innerHTML = cap ? cap.innerHTML : "";
    lightboxCap.style.display = cap ? "block" : "none";
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImg.src = "";
  }

  // Any figure image opens the lightbox.
  document.querySelectorAll(".figure img").forEach(function (img) {
    img.addEventListener("click", function (e) {
      e.stopPropagation();
      openLightbox(img);
    });
  });

  // Click anywhere on the overlay closes it; the image itself does not.
  lightbox.addEventListener("click", closeLightbox);
  lightboxImg.addEventListener("click", function (e) { e.stopPropagation(); });
  lightboxX.addEventListener("click", function (e) { e.stopPropagation(); closeLightbox(); });

  /* ---------- Per-slide chrome ---------- */
  // Institutional logo bar, injected into every content slide
  // (title and closing slides carry their own larger logo strip).
  var LOGOS = [
    ["logos/seecs-logo.png", "NUST SEECS"],
    ["logos/dll-logo.png", "Deep Learning Lab"],
    ["logos/Logo-Hochschule-RheinMain.svg.png", "Hochschule RheinMain"]
  ];
  slides.forEach(function (slide) {
    if (slide.classList.contains("title-slide")) return;
    var bar = document.createElement("div");
    bar.className = "brandbar";
    LOGOS.forEach(function (l) {
      var img = document.createElement("img");
      img.src = l[0];
      img.alt = l[1];
      bar.appendChild(img);
    });
    slide.appendChild(bar);
  });

  function render() {
    slides.forEach(function (s, i) {
      s.classList.toggle("active", i === current);
    });
    counter.textContent = (current + 1) + " / " + total;
    progress.style.width = ((current + 1) / total * 100) + "%";
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;
    if (location.hash !== "#" + (current + 1)) {
      history.replaceState(null, "", "#" + (current + 1));
    }
  }

  function go(n) {
    current = Math.max(0, Math.min(total - 1, n));
    render();
  }
  function next() { if (current < total - 1) go(current + 1); }
  function prev() { if (current > 0) go(current - 1); }

  nextBtn.addEventListener("click", next);
  prevBtn.addEventListener("click", prev);

  document.addEventListener("keydown", function (e) {
    // Escape always closes the lightbox first.
    if (e.key === "Escape" && lightboxOpen()) {
      closeLightbox(); e.preventDefault(); return;
    }
    // While the lightbox is open, suppress slide navigation.
    if (lightboxOpen()) return;

    switch (e.key) {
      case "ArrowRight":
      case "PageDown":
      case " ":
              next(); e.preventDefault(); break;
      case "ArrowLeft":
      case "PageUp":
              prev(); e.preventDefault(); break;
      case "Home": go(0); e.preventDefault(); break;
      case "End":  go(total - 1); e.preventDefault(); break;
      case "f": case "F":
        if (document.fullscreenElement) { document.exitFullscreen(); }
        else { document.documentElement.requestFullscreen(); }
        break;
    }
  });

  // Touch / swipe support (disabled while the lightbox is open).
  var x0 = null;
  document.addEventListener("touchstart", function (e) {
    if (lightboxOpen()) { x0 = null; return; }
    x0 = e.touches[0].clientX;
  }, { passive: true });
  document.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 55) { dx < 0 ? next() : prev(); }
    x0 = null;
  }, { passive: true });

  // Deep-link via hash (#5 -> slide 5).
  var start = parseInt((location.hash || "").replace("#", ""), 10);
  if (!isNaN(start) && start >= 1 && start <= total) current = start - 1;

  render();

  /* ---------- Auto-hide the keyboard hint ---------- */
  // The hint shares the bottom-left corner with the footer citation, so it
  // fades out shortly after load and reappears briefly on pointer/key activity.
  var hint = document.getElementById("hint");
  if (hint) {
    var hintTimer;
    function armHint() {
      clearTimeout(hintTimer);
      hint.classList.remove("faded");
      hintTimer = setTimeout(function () { hint.classList.add("faded"); }, 4000);
    }
    armHint();
    ["mousemove", "keydown", "touchstart"].forEach(function (ev) {
      document.addEventListener(ev, armHint, { passive: true });
    });
  }
})();
