/**
 * Centraliza todas as referências a elementos do DOM.
 * Importar daqui evita fazer document.getElementById() espalhado pelo código.
 */
export const moviesGrid = document.getElementById("moviesGrid");
export const seriesGrid = document.getElementById("seriesGrid");
export const favoritesGrid = document.getElementById("favoritesGrid");
export const moviesSection = document.getElementById("moviesSection");
export const seriesSection = document.getElementById("seriesSection");
export const favoritesSection = document.getElementById("favoritesSection");
export const aboutSection = document.getElementById("aboutSection");
export const stackSection = document.getElementById("stackSection");
export const heroPanel = document.querySelector(".hero-panel");
export const featuredCard = document.getElementById("featuredCard");
export const searchInput = document.getElementById("searchInput");
export const searchMeta = document.getElementById("searchMeta");
export const searchBox = document.querySelector(".search-box");
export const loader = document.getElementById("loader");
export const modal = document.getElementById("modal");
export const modalContent = document.getElementById("modalContent");
export const stackFoldersContainer = document.getElementById("stackFolders");
export const countAll = document.getElementById("countAll");
export const countMovies = document.getElementById("countMovies");
export const countSeries = document.getElementById("countSeries");
export const countFavorites = document.getElementById("countFavorites");
export const loginForm = document.getElementById("loginForm");
export const loginScreen = document.getElementById("loginScreen");
export const loginError = document.getElementById("loginError");
export const loginButton = loginForm ? loginForm.querySelector(".login-btn") : null;
export const themeToggle = document.getElementById("themeToggle");
export const htmlElement = document.documentElement;
