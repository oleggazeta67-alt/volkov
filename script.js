(function () {
  "use strict";

  var header = document.getElementById("site-header");
  var reducesMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* Header state ------------------------------------------------ */

  if (header) {
    var setHeader = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    setHeader();
    window.addEventListener("scroll", setHeader, { passive: true });
  }

  /* Mobile menu ------------------------------------------------ */

  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("mobile-menu");
  var closeBtn = menu ? menu.querySelector(".mm-close") : null;

  function openMenu() {
    if (!menu || !toggle) return;
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
    if (closeBtn) closeBtn.focus();
  }

  function closeMenu(returnFocus) {
    if (!menu || !toggle) return;
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
    if (returnFocus) toggle.focus();
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      if (menu.classList.contains("is-open")) {
        closeMenu(true);
      } else {
        openMenu();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        closeMenu(true);
      });
    }

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        closeMenu(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (!menu.classList.contains("is-open")) return;

      if (event.key === "Escape") {
        closeMenu(true);
        return;
      }

      if (event.key === "Tab") {
        var items = menu.querySelectorAll("a, button");
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    window.matchMedia("(min-width: 901px)").addEventListener("change", function (event) {
      if (event.matches) closeMenu(false);
    });
  }

  /* Scroll reveals --------------------------------------------- */

  var revealItems = document.querySelectorAll(".reveal");

  if (revealItems.length) {
    if (!("IntersectionObserver" in window) || reducesMotion.matches) {
      revealItems.forEach(function (item) {
        item.classList.add("is-in");
      });
    } else {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
      );

      revealItems.forEach(function (item) {
        observer.observe(item);
      });
    }
  }

  /* Cursor preview --------------------------------------------- */

  var preview = document.querySelector(".project-preview");
  var previewImg = preview ? preview.querySelector("img") : null;
  var worksList = document.getElementById("works-list");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  if (preview && previewImg && worksList && finePointer.matches && !reducesMotion.matches) {
    var targetX = 0;
    var targetY = 0;
    var currentX = 0;
    var currentY = 0;
    var started = false;
    var frame = null;

    var renderPreview = function () {
      currentX += (targetX - currentX) * 0.16;
      currentY += (targetY - currentY) * 0.16;
      preview.style.transform =
        "translate3d(" + currentX + "px," + currentY + "px,0) translate(-50%,-50%) scale(1)";

      if (Math.abs(targetX - currentX) > 0.2 || Math.abs(targetY - currentY) > 0.2) {
        frame = window.requestAnimationFrame(renderPreview);
      } else {
        frame = null;
      }
    };

    var schedulePreview = function () {
      if (frame === null) frame = window.requestAnimationFrame(renderPreview);
    };

    worksList.addEventListener("pointerover", function (event) {
      var work = event.target.closest(".work");
      if (!work) return;

      var src = work.getAttribute("data-preview");
      if (!src) return;

      if (previewImg.getAttribute("src") !== src) {
        previewImg.setAttribute("src", src);
      }

      targetX = event.clientX;
      targetY = event.clientY;

      if (!started) {
        currentX = targetX;
        currentY = targetY;
        started = true;
      }

      preview.classList.add("is-visible");
      schedulePreview();
    });

    worksList.addEventListener("pointermove", function (event) {
      if (!preview.classList.contains("is-visible")) return;
      targetX = event.clientX;
      targetY = event.clientY;
      schedulePreview();
    });

    worksList.addEventListener("pointerout", function (event) {
      var work = event.target.closest(".work");
      if (!work) return;
      var next = event.relatedTarget;
      if (next && work.contains(next)) return;
      preview.classList.remove("is-visible");
    });

    window.addEventListener("scroll", function () {
      preview.classList.remove("is-visible");
    }, { passive: true });

    window.addEventListener("blur", function () {
      preview.classList.remove("is-visible");
    });
  }
})();
