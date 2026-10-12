const numberFormatter = new Intl.NumberFormat();

function textOrFallback(value, fallback = "Not available") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  return String(value);
}

function formatNumber(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? numberFormatter.format(value)
    : "Not available";
}

function getCountryName(country) {
  return country?.name?.common || "Unknown country";
}

function makeTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  element.textContent = text;
  return element;
}

function setCountryFlag(image, country, altText) {
  const alpha2 = country?.cca2?.toLowerCase();
  image.src = country?.flags?.svg || (alpha2 ? `https://flagcdn.com/${alpha2}.svg` : "");
  image.alt = country?.flags?.alt || altText;
  image.addEventListener("error", () => {
    if (image.dataset.fallbackAttempted || !alpha2) {
      return;
    }
    image.dataset.fallbackAttempted = "true";
    image.src = `https://flagcdn.com/${alpha2}.svg`;
  });
}

export function renderCountryList(container, countries) {
  const cards = countries.map((country) => {
    const countryName = getCountryName(country);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "country-card";
    card.dataset.countryCode = textOrFallback(country?.cca3, "");
    card.setAttribute("aria-label", `Open details for ${countryName}`);

    const top = document.createElement("span");
    top.className = "country-card__top";
    const flag = document.createElement("img");
    flag.className = "country-flag";
    setCountryFlag(flag, country, `Flag of ${countryName}`);
    flag.loading = "lazy";
    const code = makeTextElement("span", "country-code", textOrFallback(country?.cca3, "—"));
    top.append(flag, code);

    const name = makeTextElement("span", "country-card__name", countryName);
    const meta = document.createElement("span");
    meta.className = "country-card__meta";
    meta.append(
      makeTextElement("span", "", `Capital · ${textOrFallback(country?.capital?.[0])}`),
      makeTextElement("span", "", `Region · ${textOrFallback(country?.region)}`),
      makeTextElement("span", "", `Population · ${formatNumber(country?.population)}`),
    );
    const action = makeTextElement("span", "country-card__action", "View country details →");
    card.append(top, name, meta, action);
    return card;
  });

  container.replaceChildren(...cards);
}

export function renderDashboard(globalCountries, europeanCountries, elements) {
  const totalPopulation = globalCountries.reduce((sum, country) => {
    return sum + (typeof country?.population === "number" ? country.population : 0);
  }, 0);
  const europePopulation = europeanCountries.reduce((sum, country) => {
    return sum + (typeof country?.population === "number" ? country.population : 0);
  }, 0);

  elements.globalCount.textContent = formatNumber(globalCountries.length);
  elements.globalNote.textContent = `Population total · latest available (2018): ${formatNumber(totalPopulation)}`;
  elements.europeCount.textContent = formatNumber(europeanCountries.length);
  elements.europeNote.textContent = `Population total · latest available (2018): ${formatNumber(europePopulation)}`;
  elements.dashboardStatus.textContent = "";
}

export function showLoading(container, message) {
  const loading = document.createElement("div");
  loading.className = "loading-message";
  loading.setAttribute("role", "status");
  const spinner = document.createElement("span");
  spinner.className = "spinner";
  spinner.setAttribute("aria-hidden", "true");
  loading.append(spinner, document.createTextNode(message));
  container.replaceChildren(loading);
}

export function showResultsFeedback(element, message, kind = "") {
  element.className = kind ? `feedback feedback--${kind}` : "feedback";
  element.textContent = message;
}

export function renderCountryDetails(container, country) {
  const name = country?.name?.common || "Unknown country";
  const heading = makeTextElement("h2", "details-name", name);
  heading.id = "details-heading";

  const flag = document.createElement("img");
  flag.className = "details-flag";
  setCountryFlag(flag, country, `Flag of ${name}`);

  const officialName = makeTextElement("p", "details-official", country?.name?.official || "Official name not available");
  const heroText = document.createElement("div");
  heroText.append(heading, officialName);
  const hero = document.createElement("div");
  hero.className = "details-hero";
  hero.append(flag, heroText);

  const languages = country?.languages && typeof country.languages === "object"
    ? Object.values(country.languages).filter(Boolean).join(", ")
    : "";
  const currencies = country?.currencies && typeof country.currencies === "object"
    ? Object.values(country.currencies)
      .map((currency) => currency?.name)
      .filter(Boolean)
      .join(", ")
    : "";
  const fields = [
    ["Capital", Array.isArray(country?.capital) ? country.capital.join(", ") : ""],
    ["Region", country?.region],
    ["Subregion", country?.subregion],
    ["Population", formatNumber(country?.population)],
    ["Area", typeof country?.area === "number" ? `${formatNumber(country.area)} km²` : ""],
    ["Languages", languages],
    ["Currencies", currencies],
    ["Country code", country?.cca3],
  ];

  const grid = document.createElement("dl");
  grid.className = "details-grid";
  fields.forEach(([label, value]) => {
    const item = document.createElement("div");
    item.className = "detail-item";
    item.append(
      makeTextElement("dt", "", label),
      makeTextElement("dd", "", textOrFallback(value)),
    );
    grid.append(item);
  });

  container.replaceChildren(hero, grid);
}

export function showDetailsError(container, message) {
  container.replaceChildren(makeTextElement("p", "feedback feedback--error", message));
}

export function getFriendlyErrorMessage(error, action) {
  if (error?.status === 404) {
    return action === "search"
      ? "No countries matched that name. Check the spelling and try again."
      : "The country details could not be found. Please choose another country.";
  }
  if (error instanceof TypeError) {
    return "We could not reach the country service. Check your internet connection and try again.";
  }
  return `We could not ${action === "details" ? "load this country" : action === "search" ? "search countries" : "load country data"} right now. Please try again.`;
}
