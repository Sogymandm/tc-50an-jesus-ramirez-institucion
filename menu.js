// menu.js — manejo mejorado del header, scroll suave y overlay del video
document.addEventListener("DOMContentLoaded", () => {
  /* ---------------------------
     HEADER — comportamiento en scroll
     --------------------------- */
  const header = document.getElementById("header");
  let lastScroll = window.scrollY || 0;
  let ticking = false;

  function handleHeaderScroll() {
    const current = window.scrollY || 0;

    // Si el usuario baja y supera 80px, contraemos el header.
    // Si sube (o está arriba), lo dejamos en estado normal.
    if (current > lastScroll && current > 80) {
      header?.classList.add("small");
    } else if (current < lastScroll - 10 || current < 40) {
      header?.classList.remove("small");
    }

    lastScroll = current <= 0 ? 0 : current;
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(handleHeaderScroll);
      ticking = true;
    }
  }, { passive: true });

  /* ---------------------------
     SCROLL SUAVE — enlaces del menú
     --------------------------- */
  document.querySelectorAll("nav.menu a").forEach(link => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      // scroll suave
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      // accesibilidad: mover foco sin provocar salto
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });

      // actualizar hash sin provocar salto adicional
      try { history.pushState(null, "", href); } catch (err) { /* ignore */ }
    });
  });

  /* ---------------------------
     VIDEO OVERLAY — funciona con <video> local o <iframe> (YouTube)
     - Requisitos en HTML:
       • overlay element con id="overlay"
       • botón con id="verVideo"
       • elemento de video con id="youtubeVideo" (puede ser <video> o <iframe>)
     --------------------------- */
  const overlay = document.getElementById("overlay");
  const btnVer = document.getElementById("verVideo");
  const videoEl = document.getElementById("youtubeVideo");

  if (overlay && btnVer && videoEl) {
    // Guardar src original si es iframe, para poder restaurarlo y controlar autoplay.
    const isIframe = videoEl.tagName.toLowerCase() === "iframe";
    const isVideo = videoEl.tagName.toLowerCase() === "video";
    const originalIframeSrc = isIframe ? videoEl.getAttribute("src") || "" : "";

    const showOverlay = () => {
      overlay.classList.remove("hidden");
      overlay.style.opacity = "1";
      overlay.setAttribute("aria-hidden", "false");
      // si hay video local y está reproduciéndose, pausarlo
      if (isVideo && !videoEl.paused) {
        try { videoEl.pause(); } catch (e) { /* ignore */ }
      }
    };

    const hideOverlay = () => {
      overlay.style.opacity = "0";
      // esperar la transición antes de marcar hidden
      setTimeout(() => {
        overlay.classList.add("hidden");
        overlay.setAttribute("aria-hidden", "true");
      }, 350);
    };

    const playMedia = () => {
      if (isVideo) {
        // para <video> local, usar play() (puede requerir interacción del usuario por política del navegador)
        try {
          // cargar si está 'preload=none'
          if (videoEl.readyState === 0) videoEl.load();
          const playPromise = videoEl.play();
          if (playPromise && typeof playPromise.then === "function") {
            playPromise.catch(() => {
              /* autoplay bloqueado: el usuario ya hizo clic, así que no debería pasar, pero toleramos errores */
            });
          }
        } catch (err) { /* ignore */ }
      } else if (isIframe) {
        // para iframe (YouTube), añadir autoplay=1 sin duplicar parámetros
        let src = videoEl.getAttribute("src") || "";
        if (!/autoplay=1/.test(src)) {
          const sep = src.includes("?") ? "&" : "?";
          // añadimos rel=0 para evitar sugerencias (opcional)
          src = src + sep + "autoplay=1&rel=0";
          videoEl.setAttribute("src", src);
        }
      }
    };

    // Click en el botón "Ver video"
    btnVer.addEventListener("click", (e) => {
      e.preventDefault();
      hideOverlay();
      // dar tiempo para que overlay desaparezca y luego reproducir
      setTimeout(() => playMedia(), 300);
      // mover foco al elemento video (si soporta focus)
      setTimeout(() => { try { videoEl.focus(); } catch (e) {} }, 600);
    });

    // Cerrar overlay con Escape (admite pausar el video local y remover autoplay del iframe)
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !overlay.classList.contains("hidden")) {
        // si es <video>, pausarlo
        if (isVideo) {
          try { videoEl.pause(); } catch (err) { /* ignore */ }
        } else if (isIframe) {
          // para iframe, restaurar src sin autoplay para detener reproducción
          try {
            if (originalIframeSrc) videoEl.setAttribute("src", originalIframeSrc);
          } catch (err) { /* ignore */ }
        }
        showOverlay();
      }
    });

    // Soportar Enter y Space en el overlay para reproducir (accesibilidad)
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        btnVer.click();
      }
    });

    // Iniciar con overlay visible (por defecto)
    showOverlay();
  } // end if overlay && btnVer && videoEl

  /* ---------------------------
     INTERSECTION OBSERVER para animar secciones al entrar en viewport
     --------------------------- */
  const sections = document.querySelectorAll(".seccion");
  if (sections.length) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    sections.forEach(s => io.observe(s));
  }
});
