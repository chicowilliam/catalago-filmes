import { MODAL_ANIMATION_DELAY_MS } from "./config.js";
import { modal, modalContent } from "./dom.js";
import { ratingManager, showToast } from "./utils.js";
import { animateTechItemsReveal, setupMotionHoverBindings } from "./motion.js";
import { renderStackModal } from "./portfolio-sections.js";

// ---------------------------------------------------------------------------
// Fechar modal
// ---------------------------------------------------------------------------

export function closeModal() {
  modal.classList.remove("show");
}

// ---------------------------------------------------------------------------
// Modal de catálogo (filme/série) — trailer + avaliação
// ---------------------------------------------------------------------------

function buildCatalogModalContent(item) {
  modalContent.innerHTML = "";
  modalContent.classList.remove("stack-modal");

  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close";
  closeBtn.innerHTML = "&times;";
  closeBtn.type = "button";
  closeBtn.addEventListener("click", closeModal);

  const title = document.createElement("h3");
  title.textContent = item.title;

  const synopsis = document.createElement("p");
  synopsis.textContent = item.synopsis;

  const ratingDiv = document.createElement("div");
  ratingDiv.className = "rating-container";

  const ratingLabel = document.createElement("p");
  ratingLabel.className = "rating-label";
  ratingLabel.textContent = "Sua avaliação:";

  const starsContainer = document.createElement("div");
  starsContainer.className = "stars-container";

  const currentRating = ratingManager.getRating(item.id);
  for (let i = 1; i <= 5; i += 1) {
    const star = document.createElement("button");
    star.className = "star";
    star.type = "button";
    if (i <= currentRating) star.classList.add("filled");
    star.textContent = "\u2B50";
    star.addEventListener("click", () => {
      ratingManager.setRating(item.id, i);
      document.querySelectorAll(".star").forEach((s, index) => {
        s.classList.toggle("filled", index < i);
      });
      showToast(`Você avaliou ${i}/5`, "success");
    });
    starsContainer.appendChild(star);
  }

  ratingDiv.appendChild(ratingLabel);
  ratingDiv.appendChild(starsContainer);
  modalContent.appendChild(closeBtn);

  if (item.trailerId) {
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${item.trailerId}`;
    iframe.allowFullscreen = true;
    iframe.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    );
    modalContent.appendChild(iframe);
  } else {
    const noTrailer = document.createElement("div");
    noTrailer.className = "modal-no-trailer";
    noTrailer.textContent = "Trailer não disponível para este título.";
    modalContent.appendChild(noTrailer);
  }

  modalContent.appendChild(title);
  modalContent.appendChild(synopsis);
  modalContent.appendChild(ratingDiv);
}

export function openModal(item) {
  buildCatalogModalContent(item);
  modal.classList.add("show");
}

// ---------------------------------------------------------------------------
// Modal da stack de tecnologias
// ---------------------------------------------------------------------------

export function openStackModal(categoryId) {
  const rendered = renderStackModal(modalContent, categoryId, closeModal);
  if (!rendered) return;

  modal.classList.add("show");
  window.setTimeout(() => {
    animateTechItemsReveal();
    setupMotionHoverBindings();
  }, MODAL_ANIMATION_DELAY_MS);
}
