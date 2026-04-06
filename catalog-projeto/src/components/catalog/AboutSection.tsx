interface Technology {
  label: string;
  iconClass: string;
}

interface TechnologyGroup {
  id: string;
  title: string;
  items: Technology[];
}

interface SocialLink {
  id: string;
  label: string;
  href: string;
  badgeSrc: string;
}

const technologyGroups: TechnologyGroup[] = [
  {
    id: "frontend",
    title: "Front-end",
    items: [
      { label: "HTML", iconClass: "devicon-html5-plain colored" },
      { label: "CSS", iconClass: "devicon-css3-plain colored" },
      { label: "JavaScript", iconClass: "devicon-javascript-plain colored" },
      { label: "TypeScript", iconClass: "devicon-typescript-plain colored" },
    ],
  },
  {
    id: "backend",
    title: "Back-end",
    items: [
      { label: "Node.js", iconClass: "devicon-nodejs-plain colored" },
      { label: "Express", iconClass: "devicon-express-original" },
      { label: "FastAPI", iconClass: "devicon-fastapi-plain colored" },
    ],
  },
  {
    id: "tools",
    title: "Frameworks / Ferramentas",
    items: [
      { label: "React", iconClass: "devicon-react-original colored" },
      { label: "Vite", iconClass: "devicon-vitejs-plain colored" },
      { label: "Jest", iconClass: "devicon-jest-plain colored" },
      { label: "Git", iconClass: "devicon-git-plain colored" },
    ],
  },
];

const socialLinks: SocialLink[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/vin%C3%ADcius-william-/",
    badgeSrc: "https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white",
  },
  {
    id: "github",
    label: "GitHub",
    href: "https://github.com/chicowilliam",
    badgeSrc: "https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white",
  },
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/williamvx__/",
    badgeSrc: "https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white",
  },
  {
    id: "discord",
    label: "Discord",
    href: "https://discord.gg/Kz9ZEfnh",
    badgeSrc: "https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white",
  },
];

export function AboutSection() {
  return (
    <section className="about-section">
      <div className="section-headline about-headline section-block">
        <div>
          <h2 className="section-title">Sobre mim</h2>
        </div>
      </div>

      <article className="about-summary-card section-block">
        <p className="about-summary-text">
          Olá, sou Vinicius William e este projeto marca um passo importante na minha trajetória
          como desenvolvedor. Nele, busquei aplicar na prática fundamentos modernos de engenharia de
          software, combinando organização de código, componentização, responsividade e preocupações
          com segurança para construir uma experiência mais próxima de um produto real.
        </p>
        <p className="about-summary-text">
          A aplicação foi desenvolvida com React e TypeScript no front-end, com uma proposta visual
          inspirada em plataformas de streaming. Ela pode funcionar de forma standalone com Vite e
          dados locais, o que a torna adequada para apresentação em portfólio, mas também está
          preparada para integração com API em cenários mais completos.
        </p>
        <p className="about-summary-text">
          O foco da interface foi transmitir consistência visual, fluidez de navegação e sensação de
          produto finalizado, com organização por categorias, interações dinâmicas e decisões de UI
          pensadas para simular padrões encontrados em aplicações reais do mercado.
        </p>
      </article>

      <div className="section-headline about-section-headline section-block">
        <div>
          <h3 className="section-title">Tecnologias</h3>
        </div>
      </div>

      <div className="tech-groups section-block" aria-label="Tecnologias organizadas por categoria">
        {technologyGroups.map((group) => (
          <div key={group.id} className="tech-group-row">
            <h4 className="tech-group-title">{group.title}</h4>
            <div className="tech-badge-row" role="list" aria-label={group.title}>
              {group.items.map((tech, index) => (
                <span
                  key={`${group.id}-${tech.iconClass}-${index}`}
                  className="tech-badge"
                  role="listitem"
                  aria-label={tech.label}
                  title={tech.label}
                >
                  <i className={tech.iconClass} aria-hidden="true" />
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="section-headline social-headline section-block">
        <div>
          <h3 className="section-title">Redes sociais</h3>
        </div>
      </div>

      <div className="social-badges section-block" aria-label="Links para redes sociais">
        {socialLinks.map((social) => (
          <a
            key={social.id}
            className="social-badge-link"
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir ${social.label} em nova aba`}
          >
            <img src={social.badgeSrc} alt={`Badge ${social.label}`} loading="lazy" />
          </a>
        ))}
        <a
          className="social-badge-link social-text-link"
          href="mailto:viniciuswilliam91@gmail.com"
          aria-label="Enviar e-mail para Vinicius William"
        >
          viniciuswilliam91@gmail.com
        </a>
      </div>
    </section>
  );
}
