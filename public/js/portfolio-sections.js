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

  const indicator =
    filterGroup.querySelector(".filter-indicator") ||
    (() => {
      const node = document.createElement("div");
      node.className = "filter-indicator";
      node.setAttribute("aria-hidden", "true");
      filterGroup.appendChild(node);
      return node;
    })();

  let previousX = 0;
  let initialized = false;
  let previousActiveIndex = Math.max(
    0,
    filterButtons.findIndex((btn) => btn.classList.contains("active"))
  );
  let syncRafId = null;

  const calculateTransitionDuration = (distance) => {
    return Math.max(460, Math.min(580, 460 + distance * 0.32));
  };

  const updateActiveIndicator = (selectedBtn, animate = false) => {
    const activeBtn = selectedBtn || filterGroup.querySelector(".filter-btn.active") || filterButtons[0];
    if (!activeBtn) {
      indicator.style.opacity = "0";
      indicator.style.width = "0px";
      return;
    }

    const nextX = Math.max(activeBtn.offsetLeft, 0);
    const nextWidth = Math.max(activeBtn.offsetWidth, 1);
    const distance = Math.abs(nextX - previousX);
    const shouldAnimate = animate && initialized;
    const durationMs = shouldAnimate ? calculateTransitionDuration(distance) : 0;

    indicator.style.transitionDuration = `${durationMs}ms, ${durationMs}ms, 260ms`;
    indicator.style.transform = `translate3d(${nextX}px, 0, 0)`;
    indicator.style.width = `${nextWidth}px`;
    indicator.style.opacity = "1";

    previousX = nextX;
    initialized = true;
  };

  const animateIndicatorAcrossTabs = (fromIndex, toIndex) => {
    const safeFrom = Math.min(Math.max(fromIndex, 0), filterButtons.length - 1);
    const safeTo = Math.min(Math.max(toIndex, 0), filterButtons.length - 1);

    if (safeFrom === safeTo || typeof indicator.animate !== "function") {
      updateActiveIndicator(filterButtons[safeTo], true);
      previousActiveIndex = safeTo;
      return;
    }

    const direction = safeFrom < safeTo ? 1 : -1;
    const steps = [safeFrom];
    for (let idx = safeFrom + direction; direction > 0 ? idx <= safeTo : idx >= safeTo; idx += direction) {
      steps.push(idx);
    }

    const keyframes = steps.map((stepIndex, frameIndex) => {
      const btn = filterButtons[stepIndex];
      const x = Math.max(btn.offsetLeft, 0);
      const width = Math.max(btn.offsetWidth, 1);

      return {
        transform: `translate3d(${x}px, 0, 0)`,
        width: `${width}px`,
        opacity: 1,
        offset: steps.length > 1 ? frameIndex / (steps.length - 1) : 1,
      };
    });

    const durationMs = Math.max(500, Math.min(900, (steps.length - 1) * 180 + 180));
    if (typeof indicator.getAnimations === "function") {
      indicator.getAnimations().forEach((animation) => animation.cancel());
    }

    const animation = indicator.animate(keyframes, {
      duration: durationMs,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      fill: "forwards",
    });

    animation.onfinish = () => {
      const finalBtn = filterButtons[safeTo];
      const finalX = Math.max(finalBtn.offsetLeft, 0);
      const finalWidth = Math.max(finalBtn.offsetWidth, 1);

      indicator.style.transform = `translate3d(${finalX}px, 0, 0)`;
      indicator.style.width = `${finalWidth}px`;
      indicator.style.opacity = "1";

      previousX = finalX;
      initialized = true;
      previousActiveIndex = safeTo;
    };

    animation.oncancel = () => {
      const fallbackBtn = filterButtons[safeTo];
      updateActiveIndicator(fallbackBtn, false);
      previousActiveIndex = safeTo;
    };
  };

  const setActiveFilter = (selectedBtn) => {
    const selectedIndex = Math.max(0, filterButtons.indexOf(selectedBtn));

    filterButtons.forEach((btn) => {
      const isActive = btn === selectedBtn;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
      btn.setAttribute("tabindex", isActive ? "0" : "-1");
    });

    animateIndicatorAcrossTabs(previousActiveIndex, selectedIndex);

    // Garante que a aba ativa permaneça visível sem quebrar a animação do indicador.
    selectedBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  };

  const syncIndicatorWithoutMotion = () => {
    const activeBtn = filterGroup.querySelector(".filter-btn.active") || filterButtons[0];
    if (typeof indicator.getAnimations === "function") {
      indicator.getAnimations().forEach((animation) => animation.cancel());
    }
    updateActiveIndicator(activeBtn, false);
    previousActiveIndex = Math.max(0, filterButtons.indexOf(activeBtn));
  };

  syncIndicatorWithoutMotion();

  const queueSync = () => {
    if (syncRafId !== null) {
      cancelAnimationFrame(syncRafId);
    }
    syncRafId = requestAnimationFrame(() => {
      syncRafId = null;
      syncIndicatorWithoutMotion();
    });
  };

  window.addEventListener("resize", queueSync, { passive: true });
  // Não sincroniza no scroll para evitar snap no meio da transição.

  if (document.fonts?.ready) {
    document.fonts.ready
      .then(() => {
        queueSync();
      })
      .catch(() => {});
  }

  filterGroup.addEventListener("click", (event) => {
    const filterBtn = event.target.closest(".filter-btn");
    if (!filterBtn) {
      return;
    }

    const nextType = filterBtn.getAttribute("data-type") || "all";
    setActiveFilter(filterBtn);
    onSelectFilter(nextType);
  });

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