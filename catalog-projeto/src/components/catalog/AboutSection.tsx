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
      <div className="section-headline about-headline section-block">
        <div>
          <h2 className="section-title">Sobre o projeto</h2>
          <span className="section-subtitle">
            Catalogo full stack inspirado em streaming, com foco em UX, integracao com API e
            arquitetura limpa.
          </span>
        </div>
      </div>

      <div className="about-layout">
        <article className="about-copy-block">
          <span className="about-kicker">Portfolio case</span>
          <h3 className="about-spotlight">
            Interface com linguagem de streaming, arquitetura leve e foco em sensacao de produto
            final.
          </h3>
          <p className="about-copy-text">
            Este projeto combina uma experiencia visual inspirada em streaming com frontend em React
            + TypeScript. No modo standalone, roda apenas com Vite e dados locais para portfolio,
            mantendo navegacao fluida, filtros, favoritos e interacoes cinematograficas.
          </p>
          <div className="about-signal-row" aria-label="Caracteristicas do projeto">
            <span className="about-signal">UX focada em catalogo</span>
            <span className="about-signal">Vite standalone</span>
            <span className="about-signal">Sessoes e favoritos</span>
          </div>
        </article>

        <div className="about-facts" aria-label="Destaques do projeto">
          <article className="about-fact-card">
            <span className="about-point-label">Front-end</span>
            <p>React, TypeScript, Vite, animacoes com Motion e interface inspirada em streaming.</p>
          </article>
          <article className="about-fact-card">
            <span className="about-point-label">Back-end</span>
            <p>Opcional: API Express pode ser ligada separadamente para cenarios full stack.</p>
          </article>
          <article className="about-fact-card">
            <span className="about-point-label">Experiencia</span>
            <p>Busca, favoritos, trailers, modal, destaque dinamico e layout pensado para portfolio.</p>
          </article>
        </div>
      </div>

      <div className="section-headline stack-headline section-block">
        <div>
          <h3 className="section-title">Tecnologias utilizadas</h3>
          <span className="section-subtitle">
            Disponiveis na aba Sobre para manter a home limpa e cinematografica.
          </span>
        </div>
        <span className="stack-tip">Toque para abrir cada pasta</span>
      </div>

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
