// Constantes de tempo e configuração da aplicação
export const REQUEST_TIMEOUT_MS = 12000;
export const AUTO_REFRESH_MS = 5 * 60 * 1000;
export const LOGIN_MIN_LOADING_MS = 1000;
export const LOGIN_TRANSITION_MS = 320;
export const FILTER_TRANSITION_MS = 200;
export const SECTION_FADE_MS = 260;
export const PERFORMANCE_STORAGE_KEY = "performanceMode";
export const MODAL_ANIMATION_DELAY_MS = 60;

// Preferência do SO por menos animações (acessibilidade)
export const prefersReducedMotion =
  window.matchMedia != null && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Instância do GSAP carregada via CDN; null se não estiver disponível
export const gsapInstance = window.gsap || null;
