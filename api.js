const FIRST_API_URL = "https://api.first.org/data/v1/countries";
const COUNTRIES_NOW_URL = "https://countriesnow.space/api/v0.1/countries";
const WORLD_BANK_URL = "https://api.worldbank.org/v2/country";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function requestJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError(`The API request failed with status ${response.status}.`, response.status);
  }
  return response.json();
}

function toFirstApiCountries(payload) {
  if (!payload || payload.status !== "OK" || !payload.data || typeof payload.data !== "object") {
    throw new Error("The country service returned an unexpected response.");
  }

  return Object.entries(payload.data).map(([alpha2, details]) => ({
    name: { common: details.country },
    cca2: alpha2,
    region: details.region,
  }));
}

export async function getCountries() {
  const payload = await requestJson(`${FIRST_API_URL}?limit=500`);
  return toFirstApiCountries(payload);
}

export async function getEuropeanCountries() {
  const payload = await requestJson(`${FIRST_API_URL}?region=Europe&limit=500`);
  return toFirstApiCountries(payload);
}

export async function getCountryMetadata() {
  const payload = await requestJson(`${COUNTRIES_NOW_URL}/info?returns=name,currency,capital,flag,iso2,iso3`);
  if (payload?.error || !Array.isArray(payload?.data)) {
    throw new Error("The country details service returned an unexpected response.");
  }
  return payload.data;
}

export async function getPopulationData() {
  const payload = await requestJson(`${COUNTRIES_NOW_URL}/population`);
  if (payload?.error || !Array.isArray(payload?.data)) {
    throw new Error("The population service returned an unexpected response.");
  }
  return payload.data;
}

export function enrichCountries(countries, metadata, populationData) {
  const metadataByAlpha2 = new Map(metadata.map((country) => [country.iso2, country]));
  const populationByAlpha3 = new Map(
    populationData.map((country) => {
      const latestPopulation = Array.isArray(country.populationCounts)
        ? country.populationCounts[country.populationCounts.length - 1]?.value
        : undefined;
      return [country.iso3, latestPopulation];
    }),
  );

  return countries.map((country) => {
    const countryMetadata = metadataByAlpha2.get(country.cca2);
    const alpha3 = countryMetadata?.iso3;
    const currency = countryMetadata?.currency;
    return {
      ...country,
      cca3: alpha3,
      flags: {
        svg: countryMetadata?.flag || `https://flagcdn.com/${country.cca2?.toLowerCase()}.svg`,
      },
      capital: countryMetadata?.capital ? [countryMetadata.capital] : [],
      population: populationByAlpha3.get(alpha3),
      currencies: currency ? { [currency]: { name: currency } } : {},
    };
  });
}

export async function searchCountries(searchTerm) {
  const query = encodeURIComponent(searchTerm);
  const payload = await requestJson(`${FIRST_API_URL}?q=${query}&limit=500`);
  return toFirstApiCountries(payload);
}

export async function getCountryDetails(countryCode) {
  const code = encodeURIComponent(countryCode);
  const payload = await requestJson(`${WORLD_BANK_URL}/${code}?format=json`);
  const country = Array.isArray(payload) && Array.isArray(payload[1]) ? payload[1][0] : null;
  if (!country) {
    throw new ApiError("The country was not found.", 404);
  }

  return {
    name: { common: country.name },
    cca3: country.id,
    region: country.region?.value,
    capital: country.capitalCity ? [country.capitalCity] : [],
  };
}
