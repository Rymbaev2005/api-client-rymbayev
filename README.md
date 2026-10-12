# Country Explorer — REST API Client

**Student:** Rymbayev  
**Repository name:** `api-client-rymbayev`  
**Lab:** LAB 6 (Week 6): Async, Promise, Fetch, REST

## Project description

Country Explorer is a responsive country browser built with HTML, CSS, and plain JavaScript ES modules. It loads public country data, supports server-side name search, displays a regional dashboard, and requests a country profile when a visitor opens a card.

### Important API availability note

The lab brief names REST Countries v3.1, but its endpoints no longer serve country data. A live check returned a deprecation response explaining that versions v1–v4 were taken down; the replacement v5 requires an API key. To keep this project usable without a key, the working application instead uses the free FIRST API for country names, regions, and server-side search; CountriesNow for flags, capitals, currencies, and historical population data; and the World Bank API for the selected-country lookup. The endpoints and field differences are documented below. This is a deliberate, visible deviation from the original REST Countries endpoint requirement, not a claim that REST Countries v3.1 works.

## Features

- Loads an initial country list, an independent European country dataset, country metadata, and population history in parallel with `Promise.all`.
- Shows global and Europe country counts and population totals in a dashboard.
- Searches through the FIRST API with the user's term in its `q` URL parameter; it does not filter the already-loaded list.
- Shows country flags, names, capitals, regions, and population values in responsive cards.
- Makes a new World Bank request by ISO alpha-3 country code when a card is opened.
- Displays the country name, flag, capital, region, population, currency code, and country code in the profile. Fields not supplied by these keyless sources (official name, subregion, area, and languages) are explicitly marked “Not available.”
- Includes loading indicators, friendly error and empty-result messages, Retry and Clear buttons, and missing-data fallbacks.
- Uses semantic HTML, keyboard-operable buttons, accessible labels, live status announcements, and responsive CSS.

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript ES modules
- Native `fetch`, Promises, `async`/`await`, `try`/`catch`/`finally`, and `Promise.all`

No framework, external JavaScript library, or API key is used by the application. The stylesheet imports optional fonts from Google Fonts and has system-font fallbacks.

## Public APIs

These APIs are used because the specified REST Countries v3.1 service was retired and its replacement requires a key.

| API | Base URL | Use |
| --- | --- | --- |
| FIRST API | <https://api.first.org/data/v1> | Country list, region list, and server-side `q` name search |
| CountriesNow | <https://countriesnow.space/api/v0.1/countries> | Country flags, capitals, currency codes, and population history |
| World Bank API | <https://api.worldbank.org/v2/country> | Fresh lookup when a country card is opened |

### Endpoints used

| Endpoint | Purpose |
| --- | --- |
| `https://api.first.org/data/v1/countries?limit=500` | Initial country names and regions |
| `https://api.first.org/data/v1/countries?region=Europe&limit=500` | Independent Europe dataset for the dashboard |
| `https://api.first.org/data/v1/countries?q={searchTerm}&limit=500` | Server-side name search; `searchTerm` is URL encoded |
| `https://countriesnow.space/api/v0.1/countries/info?returns=name,currency,capital,flag,iso2,iso3` | Enrichment data used for cards and available profile fields |
| `https://countriesnow.space/api/v0.1/countries/population` | Population history; the newest included observation is 2018 |
| `https://api.worldbank.org/v2/country/{alpha3}?format=json` | Country profile request by ISO alpha-3 code |

FIRST's `q` parameter is a server-side search filter. The app sends that request for each search instead of filtering the initial country array. `Promise.all` starts the independent list and Europe requests together (and also starts metadata requests at the same time); the dashboard is rendered once all required data has arrived. The population source only contains historical observations through 2018, so the displayed totals are labeled with that latest available year.

## Run locally with VS Code Live Server

1. Open the `api-client-rymbayev` folder in VS Code.
2. Install the **Live Server** extension if it is not already installed.
3. In the Explorer, right-click `index.html` and select **Open with Live Server** (or click **Go Live**).
4. Use the address opened by Live Server. Do not open the HTML file directly with a `file://` URL; JavaScript modules should be served over HTTP.
5. An internet connection is needed to contact the APIs.

## How the asynchronous code works

`await` pauses the current `async` function until a Promise settles, so the next line can use the completed response without blocking the whole page. `fetch` resolves to a response even for HTTP errors such as 404, so the client checks `response.ok` and throws an error when the server did not return a successful status. `try` contains the asynchronous work, `catch` shows a helpful message when it fails, and `finally` restores controls after either success or failure. `Promise.all` starts independent requests together and returns their results only after all have succeeded, which is faster than waiting for them one after another.

## Project files

- `index.html` — semantic page structure, forms, dashboard, and accessible controls.
- `styles.css` — responsive layout, cards, status states, and visual design.
- `js/api.js` — API endpoints, native fetch requests, response checks, data normalization, and enrichment.
- `js/ui.js` — safe DOM-based rendering, formatting, and friendly error messages.
- `js/app.js` — application state, event handlers, parallel loading, search, details, and retries.
- `screenshots/.gitkeep` — keeps the screenshots folder in Git until the real screenshot is added.

## Screenshot

These screenshots are captured from the running application after its public API requests complete:

### Main page

![Country Explorer main page](screenshots/lab6.png)

### Server-side search

[View the Japan search results screenshot](screenshots/search.png).

### Country details

[View the Japan country details screenshot](screenshots/details.png).

### Parallel dashboard data

[View the loaded dashboard screenshot](screenshots/dashboard.png).

To reproduce these captures, start the project with Live Server, wait for the dashboard to load, search for `Japan`, and open the Japan card. The screenshots show data returned by the live public APIs; they are not mockups.

## Git and GitHub

The following are recommended commit checkpoints. Make each commit after completing the corresponding work. These are suggested commands only; no commits have been made by this project setup.

```powershell
git init
git branch -M main

# After creating the project shell:
git add index.html styles.css screenshots/.gitkeep
git commit -m "chore: initialize country explorer project"

# After implementing asynchronous API access and search:
git add js/api.js js/ui.js
git commit -m "feat: add async REST API client and country search"

# After implementing country details and parallel dashboard requests:
git add js/app.js
git commit -m "feat: add country details and parallel dashboard requests"

# After writing this README and saving screenshots/lab6.png:
git add README.md screenshots/lab6.png
git commit -m "docs: add README and project screenshot"
```

Create a **public** GitHub repository named exactly `api-client-rymbayev`, then connect and push (replace the placeholder with the repository's actual HTTPS or SSH URL):

```powershell
git remote add origin <YOUR_GITHUB_REPOSITORY_URL>
git push -u origin main
```

These are instructions only: a public repository is not created, and no push is claimed by this README.

## Publish with GitHub Pages

1. Open the `api-client-rymbayev` repository on GitHub and select **Settings**.
2. In the left menu, open **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Choose branch **main** and folder **/(root)**, then select **Save**.
5. Wait for the Pages deployment to finish. The published address will be shown in the Pages section; use the URL GitHub displays rather than assuming a URL in advance.

## AI tools disclosure

Edit this statement so it truthfully describes your own work and tools before submission:

> I used **[tool(s) actually used, or “no AI tools”]** to **[describe the specific assistance]**. I reviewed and tested the project, and I can explain the code. I made these changes myself: **[describe your edits]**.

Do not leave the template unchanged if it does not accurately describe what you did.

## Known API limitations

- REST Countries v3.1 is retired. REST Countries v5 requires an API key, so the application uses the documented keyless alternatives instead.
- CountriesNow's population history ends in 2018. Population totals are sums of the latest values that source provides and are not current population estimates.
- FIRST and CountriesNow do not supply the complete REST Countries profile. Official name, subregion, area, and languages are marked “Not available”; no values are fabricated.
- The sources can use different spellings or country coverage. The application joins enrichment data by ISO country codes and gracefully shows a fallback where a matching record is missing.
- Public APIs can be temporarily unavailable or rate limited. The page displays a friendly error and a Retry button.
- The browser must be online to retrieve the data.
