import type { CatalogType } from "@/types/catalog";

export type Locale = "pt-BR" | "en";

export interface TranslationDictionary {
  localeName: string;
  documentTitle: string;
  documentDescription: string;
  languageSwitcherLabel: string;
  languagePortuguese: string;
  languageEnglish: string;
  checkingSession: string;
  guestUsername: string;
  appBrandKicker: string;
  appBrandTitle: string;
  logout: string;
  loginScreenAria: string;
  loginTitle: string;
  loginSubtitle: string;
  username: string;
  password: string;
  login: string;
  guestAccess: string;
  guestHelper: string;
  searchPlaceholder: string;
  searchCatalog: string;
  openSearch: string;
  clearSearch: string;
  closeSearch: string;
  browse: string;
  navigation: string;
  filtersCatalog: string;
  closeMenu: string;
  current: string;
  filterLabels: Record<CatalogType, string>;
  loadingCatalog: string;
  retry: string;
  noTitlesForFilter: string;
  featuredCatalogLabel: string;
  featuredTitle: string;
  movieLabel: string;
  seriesLabel: string;
  viewDetails: string;
  searchResultsFound: (count: number, search: string) => string;
  searchResultsEmpty: (search: string) => string;
  sectionMovies: string;
  sectionSeries: string;
  sectionFavorites: string;
  catalogPagination: string;
  previousPage: string;
  nextPage: string;
  aboutMe: string;
  aboutParagraphs: string[];
  technologies: string;
  techGroupTitles: Record<"frontend" | "backend" | "tools", string>;
  technologiesByCategory: string;
  socialNetworks: string;
  socialLinksLabel: string;
  openSocialInNewTab: (label: string) => string;
  sendEmail: string;
  footerCredit: string;
  closeNotification: string;
  activateDarkMode: string;
  activateLightMode: string;
  darkMode: string;
  lightMode: string;
  errorBoundaryMessage: string;
  reload: string;
  openDetailsOf: (title: string) => string;
  ratingSummary: (rating: number) => string;
  viewDetailsOf: (title: string) => string;
  noImage: string;
  removeFromFavorites: string;
  addToFavorites: string;
  closeModal: string;
  modalDetailsOf: (title: string) => string;
  tmdbLabel: string;
  trailerOf: (title: string) => string;
  trailerLoading: string;
  trailerUnavailable: string;
  trailerUnavailableCopy: string;
  openOnYouTube: string;
  yourRating: string;
  ratingGroup: string;
  starLabel: (star: number) => string;
  favoriteRemoved: (title: string) => string;
  favoriteAdded: (title: string) => string;
  ratedItem: (title: string, stars: number) => string;
  validateServerSession: string;
  validateLocalSession: string;
  loginUnexpectedError: string;
  tmdbNotConfigured: string;
  apiFailure: (status: number, message: string) => string;
  catalogQueryError: string;
  catalogLoadError: string;
}

export const translations: Record<Locale, TranslationDictionary> = {
  "pt-BR": {
    localeName: "Portugues",
    documentTitle: "CineLog — Catalogo de Filmes e Series",
    documentDescription: "Catalogo de filmes e series inspirado em streaming com experiencia bilingüe em portugues e ingles.",
    languageSwitcherLabel: "Alternar idioma",
    languagePortuguese: "PT",
    languageEnglish: "EN",
    checkingSession: "Validando sessao...",
    guestUsername: "Visitante",
    appBrandKicker: "Streaming Portfolio",
    appBrandTitle: "Catalogo X",
    logout: "Sair",
    loginScreenAria: "Tela de login",
    loginTitle: "Bem-vindo de volta",
    loginSubtitle: "Entre para continuar sua experiencia no catalogo.",
    username: "Usuario",
    password: "Senha",
    login: "Entrar",
    guestAccess: "Acessar como visitante",
    guestHelper: "No modo visitante, seus favoritos ficam salvos neste navegador.",
    searchPlaceholder: "Buscar filmes e series",
    searchCatalog: "Buscar no catalogo",
    openSearch: "Abrir busca",
    clearSearch: "Limpar busca",
    closeSearch: "Fechar busca",
    browse: "Navegar",
    navigation: "Navegacao",
    filtersCatalog: "Filtros do catalogo",
    closeMenu: "Fechar menu",
    current: "Atual",
    filterLabels: {
      all: "Inicio",
      movie: "Filmes",
      series: "Series",
      favorites: "Favoritos",
      about: "Sobre",
    },
    loadingCatalog: "Carregando catalogo",
    retry: "Tentar novamente",
    noTitlesForFilter: "Nenhum titulo encontrado para este filtro.",
    featuredCatalogLabel: "Sugestoes do catalogo",
    featuredTitle: "Sugestoes especialmente para voce",
    movieLabel: "Filme",
    seriesLabel: "Serie",
    viewDetails: "Ver detalhes",
    searchResultsFound: (count, search) => `Foram encontrados ${count} ${count === 1 ? "titulo" : "titulos"} com o nome de \"${search}\".`,
    searchResultsEmpty: (search) => `Nao existe titulo com o nome \"${search}\", lamento.`,
    sectionMovies: "Filmes",
    sectionSeries: "Series",
    sectionFavorites: "Favoritos",
    catalogPagination: "Paginacao do catalogo",
    previousPage: "Pagina anterior",
    nextPage: "Proxima pagina",
    aboutMe: "Sobre mim",
    aboutParagraphs: [
      "Ola, sou Vinicius William e este projeto marca um passo importante na minha trajetoria como desenvolvedor. Nele, busquei aplicar na pratica fundamentos modernos de engenharia de software, combinando organizacao de codigo, componentizacao, responsividade e preocupacoes com seguranca para construir uma experiencia mais proxima de um produto real.",
      "A aplicacao foi desenvolvida com React e TypeScript no front-end, com uma proposta visual inspirada em plataformas de streaming. Ela pode funcionar de forma standalone com Vite e dados locais, o que a torna adequada para apresentacao em portfolio, mas tambem esta preparada para integracao com API em cenarios mais completos.",
      "O foco da interface foi transmitir consistencia visual, fluidez de navegacao e sensacao de produto finalizado, com organizacao por categorias, interacoes dinamicas e decisoes de UI pensadas para simular padroes encontrados em aplicacoes reais do mercado.",
    ],
    technologies: "Tecnologias",
    techGroupTitles: {
      frontend: "Front-end",
      backend: "Back-end",
      tools: "Frameworks / Ferramentas",
    },
    technologiesByCategory: "Tecnologias organizadas por categoria",
    socialNetworks: "Redes sociais",
    socialLinksLabel: "Links para redes sociais",
    openSocialInNewTab: (label) => `Abrir ${label} em nova aba`,
    sendEmail: "Enviar e-mail para Vinicius William",
    footerCredit: "Projeto desenvolvido por Vinicius William",
    closeNotification: "Fechar notificacao",
    activateDarkMode: "Ativar modo escuro",
    activateLightMode: "Ativar modo claro",
    darkMode: "Modo escuro",
    lightMode: "Modo claro",
    errorBoundaryMessage: "Algo deu errado. Tente recarregar a pagina.",
    reload: "Recarregar",
    openDetailsOf: (title) => `Abrir detalhes de ${title}`,
    ratingSummary: (rating) => `Avaliacao: ${rating} de 5 estrelas`,
    viewDetailsOf: (title) => `Ver detalhes de ${title}`,
    noImage: "Sem imagem",
    removeFromFavorites: "Remover dos favoritos",
    addToFavorites: "Adicionar aos favoritos",
    closeModal: "Fechar modal",
    modalDetailsOf: (title) => `Detalhes de ${title}`,
    tmdbLabel: "TMDB",
    trailerOf: (title) => `Trailer de ${title}`,
    trailerLoading: "Carregando trailer...",
    trailerUnavailable: "Trailer indisponivel no momento",
    trailerUnavailableCopy: "Voce pode tentar novamente ou abrir no YouTube.",
    openOnYouTube: "Abrir no YouTube",
    yourRating: "Sua nota:",
    ratingGroup: "Avaliacao de 1 a 5 estrelas",
    starLabel: (star) => `${star} estrela${star > 1 ? "s" : ""}`,
    favoriteRemoved: (title) => `${title} removido dos favoritos`,
    favoriteAdded: (title) => `${title} adicionado aos favoritos`,
    ratedItem: (title, stars) => `Voce avaliou ${title} com ${stars} estrela${stars > 1 ? "s" : ""}.`,
    validateServerSession: "Nao foi possivel validar sua sessao no servidor.",
    validateLocalSession: "Nao foi possivel validar sua sessao local.",
    loginUnexpectedError: "Erro inesperado ao fazer login.",
    tmdbNotConfigured: "TMDB nao configurada no backend. Verifique TMDB_API_KEY ou TMDB_BEARER_TOKEN no .env.",
    apiFailure: (status, message) => `Falha da API (${status}). ${message}`,
    catalogQueryError: "Erro ao consultar catalogo.",
    catalogLoadError: "Nao foi possivel carregar o catalogo agora.",
  },
  en: {
    localeName: "English",
    documentTitle: "CineLog — Movies and Series Catalog",
    documentDescription: "Streaming-inspired movies and series catalog with a bilingual experience in Portuguese and English.",
    languageSwitcherLabel: "Switch language",
    languagePortuguese: "PT",
    languageEnglish: "EN",
    checkingSession: "Validating session...",
    guestUsername: "Guest",
    appBrandKicker: "Streaming Portfolio",
    appBrandTitle: "Catalogo X",
    logout: "Sign out",
    loginScreenAria: "Login screen",
    loginTitle: "Welcome back",
    loginSubtitle: "Sign in to continue your catalog experience.",
    username: "Username",
    password: "Password",
    login: "Sign in",
    guestAccess: "Continue as guest",
    guestHelper: "In guest mode, your favorites stay saved in this browser.",
    searchPlaceholder: "Search movies and series",
    searchCatalog: "Search catalog",
    openSearch: "Open search",
    clearSearch: "Clear search",
    closeSearch: "Close search",
    browse: "Browse",
    navigation: "Navigation",
    filtersCatalog: "Catalog filters",
    closeMenu: "Close menu",
    current: "Current",
    filterLabels: {
      all: "Home",
      movie: "Movies",
      series: "Series",
      favorites: "Favorites",
      about: "About",
    },
    loadingCatalog: "Loading catalog",
    retry: "Try again",
    noTitlesForFilter: "No titles found for this filter.",
    featuredCatalogLabel: "Catalog suggestions",
    featuredTitle: "Suggestions picked for you",
    movieLabel: "Movie",
    seriesLabel: "Series",
    viewDetails: "View details",
    searchResultsFound: (count, search) => `${count} ${count === 1 ? "title was" : "titles were"} found for \"${search}\".`,
    searchResultsEmpty: (search) => `No titles were found for \"${search}\".`,
    sectionMovies: "Movies",
    sectionSeries: "Series",
    sectionFavorites: "Favorites",
    catalogPagination: "Catalog pagination",
    previousPage: "Previous page",
    nextPage: "Next page",
    aboutMe: "About me",
    aboutParagraphs: [
      "Hello, I am Vinicius William and this project marks an important step in my journey as a developer. Here I aimed to put modern software engineering fundamentals into practice, combining code organization, componentization, responsiveness, and security concerns to build an experience closer to a real product.",
      "The application was built with React and TypeScript on the front end, with a visual direction inspired by streaming platforms. It can run standalone with Vite and local data, which makes it suitable for portfolio presentation, but it is also prepared for API integration in more complete scenarios.",
      "The interface focus was to convey visual consistency, fluid navigation, and a finished-product feel, with category-based organization, dynamic interactions, and UI decisions designed to simulate patterns found in real market applications.",
    ],
    technologies: "Technologies",
    techGroupTitles: {
      frontend: "Front-end",
      backend: "Back-end",
      tools: "Frameworks / Tools",
    },
    technologiesByCategory: "Technologies organized by category",
    socialNetworks: "Social links",
    socialLinksLabel: "Links to social profiles",
    openSocialInNewTab: (label) => `Open ${label} in a new tab`,
    sendEmail: "Send email to Vinicius William",
    footerCredit: "Project developed by Vinicius William",
    closeNotification: "Close notification",
    activateDarkMode: "Enable dark mode",
    activateLightMode: "Enable light mode",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    errorBoundaryMessage: "Something went wrong. Try reloading the page.",
    reload: "Reload",
    openDetailsOf: (title) => `Open details for ${title}`,
    ratingSummary: (rating) => `Rating: ${rating} out of 5 stars`,
    viewDetailsOf: (title) => `View details for ${title}`,
    noImage: "No image",
    removeFromFavorites: "Remove from favorites",
    addToFavorites: "Add to favorites",
    closeModal: "Close modal",
    modalDetailsOf: (title) => `${title} details`,
    tmdbLabel: "TMDB",
    trailerOf: (title) => `${title} trailer`,
    trailerLoading: "Loading trailer...",
    trailerUnavailable: "Trailer unavailable right now",
    trailerUnavailableCopy: "You can try again or open it on YouTube.",
    openOnYouTube: "Open on YouTube",
    yourRating: "Your rating:",
    ratingGroup: "Rating from 1 to 5 stars",
    starLabel: (star) => `${star} star${star > 1 ? "s" : ""}`,
    favoriteRemoved: (title) => `${title} removed from favorites`,
    favoriteAdded: (title) => `${title} added to favorites`,
    ratedItem: (title, stars) => `You rated ${title} with ${stars} star${stars > 1 ? "s" : ""}.`,
    validateServerSession: "Could not validate your session on the server.",
    validateLocalSession: "Could not validate your local session.",
    loginUnexpectedError: "Unexpected error while signing in.",
    tmdbNotConfigured: "TMDB is not configured on the backend. Check TMDB_API_KEY or TMDB_BEARER_TOKEN in .env.",
    apiFailure: (status, message) => `API failure (${status}). ${message}`,
    catalogQueryError: "Error while querying the catalog.",
    catalogLoadError: "The catalog could not be loaded right now.",
  },
};