import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Technology {
  name: string;
  iconClass: string;
}

interface StackCategory {
  id: string;
  title: string;
  description: string;
  summary: string;
  technologies: Technology[];
}

const stackCategories: StackCategory[] = [
  {
    id: "frontend",
    title: "Front-end",
    description: "Experiência visual, responsividade e interações do usuário.",
    summary: "React, TypeScript, Vite e CSS sem dependências pesadas.",
    technologies: [
      { name: "HTML", iconClass: "devicon-html5-plain colored" },
      { name: "CSS", iconClass: "devicon-css3-plain colored" },
      { name: "JavaScript", iconClass: "devicon-javascript-plain colored" },
      { name: "React", iconClass: "devicon-react-original colored" },
      { name: "TypeScript", iconClass: "devicon-typescript-plain colored" },
    ],
  },
  {
    id: "backend",
    title: "Back-end",
    description: "Regras de negócio, API REST e integração de dados externos.",
    summary: "Node.js, Express e consumo de APIs com arquitetura enxuta.",
    technologies: [
      { name: "Node.js", iconClass: "devicon-nodejs-plain colored" },
      { name: "Express", iconClass: "devicon-express-original" },
      { name: "APIs", iconClass: "devicon-fastapi-plain colored" },
    ],
  },
  {
    id: "tools",
    title: "Ferramentas",
    description: "Ambiente de desenvolvimento, testes e controle de versão.",
    summary: "Git, Jest, Vite e VS Code no dia a dia.",
    technologies: [
      { name: "Git", iconClass: "devicon-git-plain colored" },
      { name: "Vite", iconClass: "devicon-vitejs-plain colored" },
      { name: "Jest", iconClass: "devicon-jest-plain colored" },
    ],
  },
];

export function AboutSection() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = stackCategories.find((c) => c.id === selectedId) ?? null;

  function toggle(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  return (
    <section className="about-section">
      <header className="about-header">
        <h2 className="about-title">Sobre este projeto</h2>
        <p className="about-description">
          Catálogo de filmes e séries inspirado em serviços de streaming.
          Desenvolvido como portfólio full-stack com Node.js, Express e React + TypeScript.
          Clique em uma categoria abaixo para ver as tecnologias usadas.
        </p>
      </header>

      <div className="stack-grid">
        {stackCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`stack-folder${selectedId === cat.id ? " is-open" : ""}`}
            onClick={() => toggle(cat.id)}
            aria-expanded={selectedId === cat.id}
            aria-label={`${selectedId === cat.id ? "Fechar" : "Abrir"} categoria ${cat.title}`}
          >
            <strong className="stack-folder-title">{cat.title}</strong>
            <span className="stack-folder-meta">{cat.summary}</span>
            <span className="stack-folder-open" aria-hidden="true">
              {selectedId === cat.id ? "▲ Fechar" : "▼ Abrir"}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            key={selected.id}
            className="stack-detail"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <h3 className="stack-detail-title">{selected.title}</h3>
            <p className="stack-detail-description">{selected.description}</p>
            <div className="stack-tech-grid">
              {selected.technologies.map((tech, i) => (
                <motion.article
                  key={tech.name}
                  className="stack-tech-item"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.2 }}
                >
                  <span className="stack-tech-icon">
                    <i className={tech.iconClass} aria-hidden="true" />
                  </span>
                  <span className="stack-tech-name">{tech.name}</span>
                </motion.article>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
