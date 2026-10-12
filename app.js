import {
  ApiError,
  enrichCountries,
  getCountries,
  getCountryDetails,
  getCountryMetadata,
  getEuropeanCountries,
  getPopulationData,
  searchCountries,
} from "./api.js";
import {
  getFriendlyErrorMessage,
  renderCountryDetails,
  renderCountryList,
  renderDashboard,
  showDetailsError,
  showLoading,
  showResultsFeedback,
} from "./ui.js";

const elements = {
  searchForm: document.querySelector("#search-form"),
  searchInput: document.querySelector("#search-input"),
  searchButton: document.querySelector("#search-button"),
  clearButton: document.querySelector("#clear-button"),
  retryButton: document.querySelector("#retry-button"),
  countryGrid: document.querySelector("#country-grid"),
  resultsFeedback: document.querySelector("#results-feedback"),
  resultCount: document.querySelector("#result-count"),
  dashboardStatus: document.querySelector("#dashboard-status"),
  globalCount: document.querySelector("#global-country-count"),
  globalNote: document.querySelector("#global-country-note"),
  europeCount: document.querySelector("#europe-country-count"),
  europeNote: document.querySelector("#europe-country-note"),
  explorerSection: document.querySelector(".explorer-section"),
  detailsPanel: document.querySelector("#details-panel"),
  detailsContent: document.querySelector("#details-content"),
  detailsRetryButton: document.querySelector("#details-retry-button"),
  backButton: document.querySelector("#back-button"),
};

let initialCountries = [];
let countryMetadata = [];
let populationData = [];
let isDashboardLoading = false;
let isSearching = false;
let isLoadingDetails = false;
let selectedCountryCode = "";
let retryResultsAction = null;

function setSearchEnabled(enabled) {
  elements.searchInput.disabled = !enabled;
  elements.searchButton.disabled = !enabled;
  elements.clearButton.disabled = !enabled;
}

function setResultCount(countries) {
  const count = countries.length;
  elements.resultCount.textContent = `${count} ${count === 1 ? "country" : "countries"}`;
}

function showCountries(countries, message = "") {
  renderCountryList(elements.countryGrid, countries);
  setResultCount(countries);
  showResultsFeedback(elements.resultsFeedback, message, message ? "success" : "");
  elements.retryButton.hidden = true;
  retryResultsAction = null;
}

function showResultsError(error, action, retryAction) {
  showResultsFeedback(elements.resultsFeedback, getFriendlyErrorMessage(error, action), "error");
  elements.retryButton.hidden = false;
  retryResultsAction = retryAction;
}

async function loadDashboardData() {
  if (isDashboardLoading) {
    return;
  }
  isDashboardLoading = true;
  setSearchEnabled(false);
  elements.dashboardStatus.textContent = "Loading country data…";
  elements.globalCount.textContent = "Loading…";
  elements.europeCount.textContent = "Loading…";
  elements.retryButton.hidden = true;
  showLoading(elements.countryGrid, "Loading countries from public APIs…");

  try {
    // The country lists and their enrichment data are requested concurrently.
    const [countries, europeanCountries, metadata, population] = await Promise.all([
      getCountries(),
      getEuropeanCountries(),
      getCountryMetadata(),
      getPopulationData(),
    ]);
    if (!Array.isArray(countries) || !Array.isArray(europeanCountries)) {
      throw new Error("The API returned an unexpected country list.");
    }

    countryMetadata = metadata;
    populationData = population;
    initialCountries = enrichCountries(countries, metadata, population);
    const enrichedEurope = enrichCountries(europeanCountries, metadata, population);
    renderDashboard(initialCountries, enrichedEurope, elements);
    showCountries(initialCountries, "Showing the full country list.");
  } catch (error) {
    elements.dashboardStatus.textContent = "The dashboard data could not be loaded.";
    elements.globalCount.textContent = "Unavailable";
    elements.europeCount.textContent = "Unavailable";
    showResultsError(error, "dashboard", loadDashboardData);
  } finally {
    isDashboardLoading = false;
    setSearchEnabled(true);
  }
}

async function runSearch(searchTerm) {
  if (isSearching || isDashboardLoading) {
    return;
  }

  isSearching = true;
  setSearchEnabled(false);
  elements.retryButton.hidden = true;
  showResultsFeedback(elements.resultsFeedback, "");
  showLoading(elements.countryGrid, `Searching the API for “${searchTerm}”…`);

  try {
    // The query goes to the API as q=; the old list is not searched locally.
    const matches = await searchCountries(searchTerm);
    const countries = enrichCountries(matches, countryMetadata, populationData);
    if (countries.length === 0) {
      showCountries([], "No countries matched that name. Try another spelling.");
    } else {
      showCountries(countries, `Search results for “${searchTerm}”.`);
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      showCountries([], "No countries matched that name. Check the spelling and try again.");
    } else {
      showResultsError(error, "search", () => runSearch(searchTerm));
    }
  } finally {
    isSearching = false;
    setSearchEnabled(true);
  }
}

async function handleSearch(event) {
  event.preventDefault();
  if (isSearching || isDashboardLoading) {
    return;
  }

  const searchTerm = elements.searchInput.value.trim();
  if (!searchTerm) {
    showResultsFeedback(elements.resultsFeedback, "Enter a country name before searching.", "error");
    elements.searchInput.focus();
    return;
  }
  await runSearch(searchTerm);
}

function clearSearch() {
  if (isSearching || isDashboardLoading) {
    return;
  }
  elements.searchInput.value = "";
  showCountries(initialCountries, "Showing the full country list.");
}

async function openCountryDetails(countryCode) {
  if (!countryCode || isLoadingDetails) {
    return;
  }

  selectedCountryCode = countryCode;
  isLoadingDetails = true;
  elements.explorerSection.hidden = true;
  elements.detailsPanel.hidden = false;
  elements.detailsRetryButton.hidden = true;
  showLoading(elements.detailsContent, "Requesting this country's details…");
  elements.detailsPanel.scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    const details = await getCountryDetails(countryCode);
    if (!details || typeof details !== "object") {
      throw new Error("The API did not return country details.");
    }
    const cachedCountry = initialCountries.find((country) => country.cca3 === countryCode);
    const country = {
      ...cachedCountry,
      ...details,
      name: { ...cachedCountry?.name, ...details.name },
      capital: details.capital?.length ? details.capital : cachedCountry?.capital,
      region: details.region || cachedCountry?.region,
      flags: cachedCountry?.flags,
      currencies: cachedCountry?.currencies,
      population: cachedCountry?.population,
    };
    renderCountryDetails(elements.detailsContent, country);
  } catch (error) {
    showDetailsError(elements.detailsContent, getFriendlyErrorMessage(error, "details"));
    elements.detailsRetryButton.hidden = false;
  } finally {
    isLoadingDetails = false;
  }
}

function closeCountryDetails() {
  elements.detailsPanel.hidden = true;
  elements.explorerSection.hidden = false;
  elements.searchInput.focus();
}

elements.searchForm.addEventListener("submit", handleSearch);
elements.clearButton.addEventListener("click", clearSearch);
elements.retryButton.addEventListener("click", () => {
  if (retryResultsAction) {
    retryResultsAction();
  }
});
elements.countryGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-country-code]");
  if (card) {
    openCountryDetails(card.dataset.countryCode);
  }
});
elements.backButton.addEventListener("click", closeCountryDetails);
elements.detailsRetryButton.addEventListener("click", () => {
  openCountryDetails(selectedCountryCode);
});

loadDashboardData();
