import { prefersReducedMotion, gsapInstance } from "./config.js";
import { state } from "./state.js";
import { featuredCard, aboutSection, stackSection, modalContent } from "./dom.js";

// ---------------------------------------------------------------------------
// Guard — verifica se animações avançadas podem rodar
// ---------------------------------------------------------------------------

export function canUseAdvancedMotion() {
  return Boolean(gsapInstance) && !prefersReducedMotion;
}

// ---------------------------------------------------------------------------
// Animações de entrada — Hero
// ---------------------------------------------------------------------------

export function animateHeroReveal() {
  if (!featuredCard || !canUseAdvancedMotion()) return;

  gsapInstance.killTweensOf(featuredCard);
  gsapInstance.fromTo(
    featuredCard,
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.75, ease: "expo.out", clearProps: "transform" }
  );
  // Animação do conteúdo delegada ao CSS via classe .is-active
}

// ---------------------------------------------------------------------------
// Animações de entrada — Seção Sobre
// ---------------------------------------------------------------------------

export function animateAboutReveal() {
  if (!canUseAdvancedMotion()) return;

  const aboutTargets = [
    ...aboutSection.querySelectorAll(
      ".about-kicker, .about-spotlight, .about-copy-text, .about-signal, .about-fact-card"
    ),
    ...stackSection.querySelectorAll(".stack-folder"),
  ];

  if (!aboutTargets.length) return;

  gsapInstance.killTweensOf(aboutTargets);
  gsapInstance.set(aboutTargets, { opacity: 0, y: 16, scale: 0.99 });
  gsapInstance.to(aboutTargets, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.65,
    ease: "power3.out",
    stagger: 0.06,
    clearProps: "transform,opacity",
  });
}

// ---------------------------------------------------------------------------
// Animações de entrada — Pastas da Stack
// ---------------------------------------------------------------------------

export function animateStackFoldersReveal() {
  if (!canUseAdvancedMotion()) return;

  const folders = Array.from(document.querySelectorAll(".stack-folder"));
  if (!folders.length) return;

  gsapInstance.killTweensOf(folders);
  gsapInstance.fromTo(
    folders,
    { opacity: 0, scale: 0.96, y: 18 },
    {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.65,
      stagger: 0.075,
      ease: "expo.out",
      clearProps: "transform,opacity",
    }
  );
}

// ---------------------------------------------------------------------------
// Animações de entrada — Itens de tecnologia no modal
// ---------------------------------------------------------------------------

export function animateTechItemsReveal() {
  if (!canUseAdvancedMotion()) return;

  const techItems = Array.from(modalContent.querySelectorAll(".stack-tech-item"));
  if (!techItems.length) return;

  gsapInstance.killTweensOf(techItems);
  gsapInstance.fromTo(
    techItems,
    { opacity: 0, y: 14, scale: 0.97 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.52,
      stagger: 0.048,
      ease: "power3.out",
      clearProps: "transform,opacity",
    }
  );
}

// ---------------------------------------------------------------------------
// Hover magnético — Pastas e cards de tecnologia
// ---------------------------------------------------------------------------

export function setupMotionHoverBindings() {
  if (!canUseAdvancedMotion()) return;

  const bindHover = (element, options = {}) => {
    if (!element || element.dataset.motionBound === "true") return;

    const {
      y = -3,
      scale = 1.01,
      durationIn = 0.2,
      durationOut = 0.24,
      easeIn = "power2.out",
      easeOut = "power2.out",
      iconSelector = null,
    } = options;

    const icon = iconSelector ? element.querySelector(iconSelector) : null;
    let iconRaf = null;
    let iconX = 0;
    let iconY = 0;

    const flushIcon = () => {
      if (icon) {
        gsapInstance.set(icon, { x: iconX, y: iconY });
      }
      iconRaf = null;
    };

    element.dataset.motionBound = "true";

    element.addEventListener("pointerenter", () => {
      gsapInstance.to(element, {
        y,
        scale,
        duration: durationIn,
        ease: easeIn,
        overwrite: "auto",
      });
    });

    element.addEventListener("pointermove", (event) => {
      if (!icon) return;
      const rect = element.getBoundingClientRect();
      iconX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      iconY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      if (!iconRaf) {
        iconRaf = window.requestAnimationFrame(flushIcon);
      }
    });

    element.addEventListener("pointerleave", () => {
      gsapInstance.to(element, { y: 0, scale: 1, duration: durationOut, ease: easeOut, overwrite: "auto" });
      if (icon) {
        if (iconRaf) {
          window.cancelAnimationFrame(iconRaf);
          iconRaf = null;
        }
        iconX = 0;
        iconY = 0;
        gsapInstance.to(icon, { x: 0, y: 0, duration: 0.2, ease: "power2.out", overwrite: "auto" });
      }
    });
  };

  document.querySelectorAll(".stack-folder").forEach((folder) => {
    bindHover(folder, { y: -3, scale: 1.008 });
  });

  document.querySelectorAll(".stack-tech-item").forEach((item) => {
    bindHover(item, { y: -3, scale: 1.01, iconSelector: ".stack-tech-icon" });
  });
}

// ---------------------------------------------------------------------------
// Reset do paralaxe do hero
// ---------------------------------------------------------------------------

export function resetHeroParallaxState() {
  state.heroParallax.x = 0;
  state.heroParallax.y = 0;
  if (featuredCard) {
    featuredCard.style.setProperty("--parallax-x", "0px");
    featuredCard.style.setProperty("--parallax-y", "0px");
  }
}

// ---------------------------------------------------------------------------
// Barra de progresso de scroll
// ---------------------------------------------------------------------------

function updateScrollProgress() {
  const root = document.documentElement;
  const scrollTop = root.scrollTop || document.body.scrollTop;
  const scrollHeight = root.scrollHeight - root.clientHeight;
  const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
  root.style.setProperty("--scroll-progress", progress.toFixed(4));
}

export function setupScrollProgress() {
  if (prefersReducedMotion || state.scrollProgressReady) return;
  state.scrollProgressReady = true;

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      updateScrollProgress();
      ticking = false;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  updateScrollProgress();
}

// ---------------------------------------------------------------------------
// Reveal por IntersectionObserver (elementos entram quando ficam visíveis)
// ---------------------------------------------------------------------------

export function setupRevealAnimations() {
  const supportsViewTimeline =
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("animation-timeline: view()");

  if (supportsViewTimeline) {
    if (state.revealObserver) state.revealObserver.disconnect();
    state.revealObserver = null;
    document.querySelectorAll(".reveal").forEach((el) => {
      el.classList.remove("reveal");
      el.classList.remove("reveal-visible");
      el.style.removeProperty("--reveal-delay");
    });
    return;
  }

  if (prefersReducedMotion) {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("reveal-visible"));
    return;
  }

  if (state.revealObserver) state.revealObserver.disconnect();

  const revealTargets = Array.from(
    document.querySelectorAll(".hero-copy, .featured-card, .section-block, .footer")
  );

  revealTargets.forEach((el, index) => {
    el.classList.add("reveal");
    el.style.setProperty("--reveal-delay", `${Math.min(index * 28, 240)}ms`);
  });

  state.revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("reveal-visible");
        observer.unobserve(entry.target);
      });
    },
    { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.14 }
  );

  revealTargets.forEach((el) => state.revealObserver.observe(el));
}

// ---------------------------------------------------------------------------
// Paralaxe do hero com mouse
// ---------------------------------------------------------------------------

export function setupHeroParallax() {
  if (prefersReducedMotion || !featuredCard || featuredCard.dataset.parallaxBound === "true") {
    return;
  }

  featuredCard.dataset.parallaxBound = "true";
  const maxMove = 4;
  const easing = 0.16;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  const animate = () => {
    currentX += (targetX - currentX) * easing;
    currentY += (targetY - currentY) * easing;

    state.heroParallax.x = currentX;
    state.heroParallax.y = currentY;
    featuredCard.style.setProperty("--parallax-x", `${currentX.toFixed(2)}px`);
    featuredCard.style.setProperty("--parallax-y", `${currentY.toFixed(2)}px`);

    if (Math.abs(targetX - currentX) > 0.04 || Math.abs(targetY - currentY) > 0.04) {
      state.heroParallaxRaf = window.requestAnimationFrame(animate);
      return;
    }

    state.heroParallaxRaf = null;
  };

  const onMove = (event) => {
    const rect = featuredCard.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    targetX = ((event.clientX - rect.left) / rect.width - 0.5) * maxMove;
    targetY = ((event.clientY - rect.top) / rect.height - 0.5) * maxMove;
    if (!state.heroParallaxRaf) {
      state.heroParallaxRaf = window.requestAnimationFrame(animate);
    }
  };

  const onLeave = () => {
    targetX = 0;
    targetY = 0;
    if (!state.heroParallaxRaf) {
      state.heroParallaxRaf = window.requestAnimationFrame(animate);
    }
  };

  featuredCard.addEventListener("pointermove", onMove);
  featuredCard.addEventListener("pointerleave", onLeave);
}

// ---------------------------------------------------------------------------
// Setup completo de todos os efeitos de motion
// ---------------------------------------------------------------------------

export function setupMotionEnhancements() {
  setupScrollProgress();
  setupRevealAnimations();
  setupHeroParallax();
}

// ---------------------------------------------------------------------------
// Transição entre abas (Início / Filmes / Séries / Favoritos / Sobre)
// ---------------------------------------------------------------------------

/**
 * Wipe de tela inteira entre abas — estilo Star Wars.
 *
 * Implementação 100% CSS + setTimeout, sem dependência de GSAP.
 *
 * Fase 1 (260ms): classe .wipe-in → cortina varre e cobre toda a tela.
 * Pico:           onSwap() troca o conteúdo enquanto a cortina tapa tudo.
 * Fase 2 (300ms): classe .wipe-out → cortina sai revelando o novo conteúdo.
 *
 * Direção controlada por custom properties CSS injetadas antes da animação:
 *   --wipe-start: ponto de partida da cortina (ex: 110% ou -110%)
 *   --wipe-end:   ponto de chegada da cortina ao sair
 *
 * @param {Element[]} _hiding  - não usado; swap ocorre via onSwap no pico
 * @param {() => void} onSwap  - callback que atualiza state + visibilidade
 * @param {{ direction?: number }} options - 1 = avança (esq→dir), -1 = volta
 */
export function animateTabSwitch(_hiding, onSwap, options = {}) {
  const COVER_MS  = 260;
  const REVEAL_MS = 300;

  if (prefersReducedMotion) {
    onSwap?.();
    return;
  }

  const curtain = document.getElementById('pageWipe');
  if (!curtain) {
    onSwap?.();
    return;
  }

  const direction = options.direction === -1 ? -1 : 1;
  curtain.style.setProperty('--wipe-start', direction === 1 ? '110%'  : '-110%');
  curtain.style.setProperty('--wipe-end',   direction === 1 ? '-110%' : '110%');

  // Cancela qualquer wipe anterior ainda em andamento
  curtain.classList.remove('wipe-in', 'wipe-out');
  void curtain.offsetWidth; // força reflow — garante que a animação reinicia

  document.body.classList.add('page-wipe-active');
  curtain.classList.add('wipe-in');

  // Fase 2: após a cortina cobrir tudo, troca o conteúdo e inicia a saída
  setTimeout(() => {
    onSwap?.();

    curtain.classList.remove('wipe-in');
    void curtain.offsetWidth;
    curtain.classList.add('wipe-out');

    const cleanup = () => {
      curtain.classList.remove('wipe-out');
      document.body.classList.remove('page-wipe-active');
    };

    curtain.addEventListener('animationend', cleanup, { once: true });
    // Fallback de segurança caso animationend não dispare
    setTimeout(cleanup, REVEAL_MS + 80);
  }, COVER_MS);
}
