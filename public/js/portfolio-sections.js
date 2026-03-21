export const stackCategories = [
  {
    id: "frontend",
    title: "Front-end",
    emoji: "📱",
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
    emoji: "🛠",
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

  const emoji = document.createElement("span");
  emoji.className = "stack-folder-emoji";
  emoji.textContent = category.emoji;

  const title = document.createElement("strong");
  title.className = "stack-folder-title";
  title.textContent = category.title;

  const meta = document.createElement("span");
  meta.className = "stack-folder-meta";
  meta.textContent = category.summary;

  const openHint = document.createElement("span");
  openHint.className = "stack-folder-open";
  openHint.textContent = "Abrir";

  button.appendChild(emoji);
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
  title.textContent = `${category.emoji} ${category.title}`;

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

  const setActiveFilter = (selectedBtn) => {
    filterButtons.forEach((btn) => {
      const isActive = btn === selectedBtn;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
      btn.setAttribute("tabindex", isActive ? "0" : "-1");
    });
  };

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