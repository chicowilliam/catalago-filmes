import { useLanguage } from "@/i18n/LanguageContext";

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
  const { text } = useLanguage();

  return (
    <section className="about-section">
      <div className="section-headline about-headline section-block">
        <div>
          <h2 className="section-title">{text.aboutMe}</h2>
        </div>
      </div>

      <article className="about-summary-card section-block">
        {text.aboutParagraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 24)} className="about-summary-text">{paragraph}</p>
        ))}
      </article>

      <div className="section-headline about-section-headline section-block">
        <div>
          <h3 className="section-title">{text.technologies}</h3>
        </div>
      </div>

      <div className="tech-groups section-block" aria-label={text.technologiesByCategory}>
        {technologyGroups.map((group) => (
          <div key={group.id} className="tech-group-row">
            <h4 className="tech-group-title">{text.techGroupTitles[group.id as keyof typeof text.techGroupTitles] ?? group.title}</h4>
            <div className="tech-badge-row" role="list" aria-label={text.techGroupTitles[group.id as keyof typeof text.techGroupTitles] ?? group.title}>
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
          <h3 className="section-title">{text.socialNetworks}</h3>
        </div>
      </div>

      <div className="social-badges section-block" aria-label={text.socialLinksLabel}>
        {socialLinks.map((social) => (
          <a
            key={social.id}
            className="social-badge-link"
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={text.openSocialInNewTab(social.label)}
          >
            <img src={social.badgeSrc} alt={`Badge ${social.label}`} loading="lazy" />
          </a>
        ))}
        <a
          className="social-badge-link social-text-link"
          href="mailto:viniciuswilliam91@gmail.com"
          aria-label={text.sendEmail}
        >
          viniciuswilliam91@gmail.com
        </a>
      </div>
    </section>
  );
}
