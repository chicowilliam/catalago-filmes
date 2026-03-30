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
 * Wipe horizontal entre abas — estilo Star Wars.
 *
 * Saída e entrada acontecem SIMULTANEAMENTE:
 *   conteúdo antigo desliza para fora enquanto o novo entra pelo lado oposto.
 *
 * Sequência:
 *   1. Captura seções ocultas antes do swap (referência de "o que vai entrar").
 *   2. Swap de DOM instantâneo (state + toggle de visibilidade).
 *   3. Posiciona novo conteúdo fora da tela e re-exibe antigo no lugar.
 *   4. GSAP Timeline: saída e entrada em paralelo (offset 0).
 *
 * @param {Element[]} hiding  - seções atualmente visíveis que devem sair
 * @param {() => void} onSwap - callback que troca o estado e o DOM
 * @param {{ direction?: number }} options - 1 = esq→dir (avançar), -1 = dir→esq (voltar)
 */
export function animateTabSwitch(hiding, onSwap, options = {}) {
  const validHiding = hiding.filter(Boolean);
  const direction = options.direction === -1 ? -1 : 1;
  const vw = Math.max(window.innerWidth, 480);
  const fromX = direction === 1 ? vw : -vw;   // novo conteúdo começa aqui
  const toX   = direction === 1 ? -vw : vw;   // conteúdo antigo termina aqui
  const DURATION = 0.42;

  // Sem GSAP ou preferência por menos movimento: troca instantânea
  if (!canUseAdvancedMotion()) {
    validHiding.forEach((el) => el.classList.add("is-hidden"));
    onSwap?.();
    return;
  }

  // Bloqueia scroll horizontal durante o wipe para evitar barra de rolagem
  const htmlEl = document.documentElement;
  const lockScroll  = () => htmlEl.style.setProperty("overflow-x", "hidden");
  const unlockScroll = () => htmlEl.style.removeProperty("overflow-x");

  // Caso sem conteúdo saindo: só anima a entrada
  if (!validHiding.length) {
    onSwap?.();
    const entering = Array.from(
      document.querySelectorAll(".section-block:not(.is-hidden), .hero-panel:not(.is-hidden)")
    );
    if (entering.length) {
      lockScroll();
      gsapInstance.fromTo(
        entering,
        { x: fromX },
        {
          x: 0,
          duration: DURATION,
          ease: "expo.out",
          stagger: 0,
          clearProps: "transform",
          overwrite: "auto",
          onComplete: unlockScroll,
        }
      );
    }
    return;
  }

  // 1. Memoriza o que estava oculto ANTES do swap
  const wasHidden = new Set(
    Array.from(document.querySelectorAll(".section-block.is-hidden, .hero-panel.is-hidden"))
  );

  // 2. Swap de DOM: altera state + toggle de seções (tudo instantâneo)
  onSwap?.();

  // 3a. Identifica o que ficou visível e que estava oculto antes = "entrando"
  const entering = Array.from(
    document.querySelectorAll(".section-block:not(.is-hidden), .hero-panel:not(.is-hidden)")
  ).filter((el) => wasHidden.has(el));

  // 3b. Posiciona novo conteúdo fora da tela (sem animação ainda)
  if (entering.length) {
    gsapInstance.set(entering, { x: fromX });
  }

  // 3c. Re-exibe conteúdo antigo para animar a saída
  //     (onSwap adicionou is-hidden neles; precisamos que apareçam durante o slide)
  gsapInstance.killTweensOf(validHiding);
  validHiding.forEach((el) => {
    el.classList.remove("is-hidden");
    gsapInstance.set(el, { x: 0 });
  });

  lockScroll();

  // 4. Timeline com saída e entrada em paralelo (offset 0 = simultâneas)
  const tl = gsapInstance.timeline({ onComplete: unlockScroll });

  tl.to(
    validHiding,
    {
      x: toX,
      duration: DURATION,
      ease: "power3.in",
      overwrite: true,
      onComplete: () => {
        validHiding.forEach((el) => {
          el.classList.add("is-hidden");
          gsapInstance.set(el, { clearProps: "all" });
        });
      },
    },
    0
  );

  if (entering.length) {
    tl.to(
      entering,
      {
        x: 0,
        duration: DURATION + 0.04,
        ease: "expo.out",
        stagger: 0,
        clearProps: "transform",
        overwrite: "auto",
      },
      0
    );
  }
}
