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
 * Wipe de tela inteira — estilo Star Wars.
 *
 * Abordagem: CSS transition inline + setTimeout explícito.
 * Não usa Web Animations API, @keyframes, nem troca de classes mid-animation.
 *
 * Por que essa abordagem é infalhível:
 *  1. `void el.offsetHeight` força reflow antes de cada passo.
 *  2. `transition: none` + reflow + novo valor = posição instantânea garantida.
 *  3. `transition: Xms` + novo valor = transição garantida SEM distorção de easing.
 *  4. setTimeout(onSwap, ENTER_MS) dispara exatamente quando a cobertura termina.
 *
 * Timeline:
 *  0ms          cortina é posicionada fora da tela (sem transição)
 *  0ms→260ms    transição de entrada: cobre a tela
 *  260ms        onSwap() — DOM troca enquanto a cortina tapa tudo
 *  260ms→560ms  transição de saída: revela o novo conteúdo
 *
 * @param {Element[]} _hiding  - não usado; swap via onSwap no pico
 * @param {() => void} onSwap  - troca de state + DOM
 * @param {{ direction?: number }} options - 1 = avança, -1 = volta
 */
export function animateTabSwitch(_hiding, onSwap, options = {}) {
  // Avalia em tempo de execução (não em import-time) para pegar preferência atual
  const isReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  if (isReducedMotion) {
    onSwap?.();
    return;
  }

  const curtain = document.getElementById('pageWipe');
  if (!curtain) {
    onSwap?.();
    return;
  }

  // Cancela qualquer animação anterior na cortina
  curtain.getAnimations().forEach((a) => a.cancel());

  const ENTER_MS = 260;
  const EXIT_MS  = 300;

  const direction = options.direction === -1 ? -1 : 1;
  const startX    = direction === 1 ? '110%' : '-110%';
  const endX      = direction === 1 ? '-110%' : '110%';

  document.body.classList.add('page-wipe-active');

  // PASSO 1: posiciona a cortina fora da tela instantaneamente (sem transição)
  curtain.style.transition = 'none';
  curtain.style.transform  = `translateX(${startX})`;
  void curtain.offsetHeight;   // força reflow — garante que o passo 1 é aplicado

  // PASSO 2: desliza a cortina para cobrir toda a tela
  curtain.style.transition = `transform ${ENTER_MS}ms cubic-bezier(0.76, 0, 0.24, 1)`;
  curtain.style.transform  = 'translateX(0%)';

  // PASSO 3: após a cobertura completa, troca o DOM e inicia a saída
  setTimeout(() => {
    onSwap?.(); // troca invisivel ao usuário

    // PASSO 4: desliza a cortina para fora revelando o novo conteúdo
    void curtain.offsetHeight;  // safety reflow
    curtain.style.transition = `transform ${EXIT_MS}ms cubic-bezier(0.24, 0, 0.76, 1)`;
    curtain.style.transform  = `translateX(${endX})`;

    // PASSO 5: limpeza — reseta para off-screen padrão
    setTimeout(() => {
      curtain.style.transition = 'none';
      curtain.style.transform  = 'translateX(110%)';
      document.body.classList.remove('page-wipe-active');
    }, EXIT_MS + 60);

  }, ENTER_MS);
}
