export const stackCategories = [
  {
    id: "frontend",
    title: "Front-end",
    description: "Experiência visual, responsividade e interações do usuário.",
    summary: "Interfaces sem framework, performance e acabamento visual.",
    technologies: [
      { name: "HTML", iconClass: "devicon-html5-plain colored" },
      { name: "CSS", iconClass: "devicon-css3-plain colored" },
      { name: "JavaScript", iconClass: "devicon-javascript-plain colored" }
    ]
  },
  {
    id: "backend",
    title: "Back-end",
    description: "Regras de negócio, API e integração de dados.",
    summary: "Node.js, Express e consumo de APIs com arquitetura enxuta.",
    technologies: [
      { name: "Node.js", iconClass: "devicon-nodejs-plain colored" },
      { name: "Express", iconClass: "devicon-express-original" },
      { name: "APIs", iconClass: "devicon-fastapi-plain colored" }
    ]
  }
];

function createStackFolderButton(category, onSelectCategory) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "stack-folder";
  button.setAttribute("data-stack-id", category.id);
  button.setAttribute("aria-label", `Abrir pasta ${category.title}`);

  const title = document.createElement("strong");
  title.className = "stack-folder-title";
  title.textContent = category.title;

  const meta = document.createElement("span");
  meta.className = "stack-folder-meta";
  meta.textContent = category.summary;

  const openHint = document.createElement("span");
  openHint.className = "stack-folder-open";
  openHint.textContent = "Abrir";

  button.appendChild(title);
  button.appendChild(meta);
  button.appendChild(openHint);

  button.addEventListener("click", () => onSelectCategory(category.id));
  return button;
}

export function renderStackFolders(container, onSelectCategory) {
  if (!container) {
    return;
  }

  container.innerHTML = "";
  stackCategories.forEach((category) => {
    container.appendChild(createStackFolderButton(category, onSelectCategory));
  });
}

export function renderStackModal(modalContent, categoryId, onClose) {
  const category = stackCategories.find((item) => item.id === categoryId);
  if (!category || !modalContent) {
    return false;
  }

  modalContent.innerHTML = "";
  modalContent.classList.add("stack-modal");

  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close";
  closeBtn.innerHTML = "&times;";
  closeBtn.type = "button";
  closeBtn.addEventListener("click", onClose);

  const header = document.createElement("header");
  header.className = "stack-modal-header";

  const label = document.createElement("span");
  label.className = "stack-modal-label";
  label.textContent = "Categoria";

  const title = document.createElement("h3");
  title.className = "stack-modal-title";
  title.textContent = category.title;

  const description = document.createElement("p");
  description.className = "stack-modal-description";
  description.textContent = category.description;

  header.appendChild(label);
  header.appendChild(title);
  header.appendChild(description);

  const techGrid = document.createElement("div");
  techGrid.className = "stack-tech-grid";

  category.technologies.forEach((tech, index) => {
    const item = document.createElement("article");
    item.className = "stack-tech-item";
    item.style.setProperty("--tech-delay", `${index * 70}ms`);

    const icon = document.createElement("span");
    icon.className = "stack-tech-icon";

    const iconElement = document.createElement("i");
    iconElement.className = tech.iconClass;
    iconElement.setAttribute("aria-hidden", "true");
    icon.appendChild(iconElement);

    const name = document.createElement("span");
    name.className = "stack-tech-name";
    name.textContent = tech.name;

    item.appendChild(icon);
    item.appendChild(name);
    techGrid.appendChild(item);
  });

  modalContent.appendChild(closeBtn);
  modalContent.appendChild(header);
  modalContent.appendChild(techGrid);
  return true;
}

export function setupFilterControls(filterGroup, filterButtons, onSelectFilter) {
  if (!filterGroup || !Array.isArray(filterButtons) || !filterButtons.length) {
    return;
  }

  // Track do estado anterior do indicador para cálculo de distância
  let indicatorState = { x: 0, width: 0, initialized: false };
  let isFirstRender = true;

  /**
   * Calcula duração natural baseada em distância percorrida
   * Usa uma velocidade perceptiva de ~600px/s para distâncias curtas
   * e desacelera gracefully para distâncias maiores
   */
  const calculateTransitionDuration = (distance) => {
    // Mín: 200ms (muito perto)
    // Máx: 480ms (muito longe)
    // Fórmula: base + factor proporcional à distância (efeito natural)
    const baseDuration = 200;
    const speedFactor = Math.min(distance * 0.35, 280); // curve suavizada
    return Math.min(480, baseDuration + speedFactor);
  };

  /**
   * Atualiza a posição e largura do indicador
   * @param {HTMLElement} selectedBtn - Botão selecionado
   * @param {boolean} animate - Se deve animar a transição
   */
  const updateActiveIndicator = (selectedBtn, animate = false) => {
    const activeBtn = selectedBtn || filterGroup.querySelector(".filter-btn.active") || filterButtons[0];
    if (!activeBtn) {
      filterGroup.style.setProperty("--filter-indicator-width", "0px");
      filterGroup.style.setProperty("--filter-indicator-opacity", "0");
      return;
    }

    // Calcular posição X (relativa ao container, sem scroll)
    const nextX = activeBtn.offsetLeft;
    // Calcular largura (sempre baseado na largura do botão)
    const nextWidth = Math.max(activeBtn.offsetWidth, 1);

    // Cálculo de distância para timing natural
    const prevX = indicatorState.x;
    const distance = Math.abs(nextX - prevX);

    // No primeiro render, não anima para evitar jump inicial
    // Depois, sempre anima suavemente
    let shouldAnimate = animate && indicatorState.initialized;
    const durationMs = shouldAnimate ? calculateTransitionDuration(distance) : 0;

    // Aplicar transição suavemente
    filterGroup.style.setProperty("--filter-indicator-duration", `${durationMs}ms`);
    filterGroup.style.setProperty("--filter-indicator-x", `${nextX}px`);
    filterGroup.style.setProperty("--filter-indicator-width", `${nextWidth}px`);
    filterGroup.style.setProperty("--filter-indicator-opacity", "1");

    // Atualizar estado
    indicatorState = { x: nextX, width: nextWidth, initialized: true };
    isFirstRender = false;
  };

  /**
   * Define o filtro ativo e anima o indicador
   */
  const setActiveFilter = (selectedBtn) => {
    filterButtons.forEach((btn) => {
      const isActive = btn === selectedBtn;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
      btn.setAttribute("tabindex", isActive ? "0" : "-1");
    });

    // Animar indicador se não for a primeira vez
    updateActiveIndicator(selectedBtn, !isFirstRender);
  };

  /**
   * Sincroniza indicador com a tab ativa (sem animação)
   * Usado em resize e scroll
   */
  const syncIndicatorWithoutMotion = () => {
    const activeBtn = filterGroup.querySelector(".filter-btn.active") || filterButtons[0];
    // Recalcular sem movimento para garantir alinhamento em resizes
    const nextX = activeBtn.offsetLeft;
    const nextWidth = Math.max(activeBtn.offsetWidth, 1);
    
    filterGroup.style.setProperty("--filter-indicator-duration", "0ms");
    filterGroup.style.setProperty("--filter-indicator-x", `${nextX}px`);
    filterGroup.style.setProperty("--filter-indicator-width", `${nextWidth}px`);
    filterGroup.style.setProperty("--filter-indicator-opacity", "1");
    
    indicatorState = { x: nextX, width: nextWidth, initialized: true };
  };

  // Inicializar indicador na primeira carga (sem delay, sem animação)
  syncIndicatorWithoutMotion();

  // Sincronizar em resize (importante para responsividade)
  window.addEventListener("resize", syncIndicatorWithoutMotion, { passive: true });

  // Esperar por Fonts API estar pronta antes de qualquer sincronização adicional
  if (document.fonts?.ready) {
    document.fonts.ready
      .then(() => {
        // Pequeno delay para garantir que o layout foi recalculado
        requestAnimationFrame(() => {
          syncIndicatorWithoutMotion();
        });
      })
      .catch(() => {
        // Ignorar erros da Fonts API
      });
  }

  // Gerenciador de cliques em botões
  filterGroup.addEventListener("click", (event) => {
    const filterBtn = event.target.closest(".filter-btn");
    if (!filterBtn) {
      return;
    }

    const nextType = filterBtn.getAttribute("data-type") || "all";
    setActiveFilter(filterBtn);
    onSelectFilter(nextType);
  });

  // Navegação por teclado (Arrow keys)
  filterGroup.addEventListener("keydown", (event) => {
    const currentIndex = filterButtons.indexOf(document.activeElement);
    if (currentIndex === -1) {
      return;
    }

    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }

    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (currentIndex + direction + filterButtons.length) % filterButtons.length;
    filterButtons[nextIndex].focus();
    filterButtons[nextIndex].click();
  });
}