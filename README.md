# Gift Ideas Demo

A JavaScript demo with a Node.js/Express 5 read-only REST API and a React 19/Vite frontend. The browser fetches the API; the API reads gift ideas from a local MongoDB database (`gift_ideas.giftIdeas`), populated with seed scripts.

## Run locally

Prerequisites: Node.js 24 LTS or newer, npm (included with Node), and a local MongoDB server running on `mongodb://127.0.0.1:27017`.

From the repository root:

```powershell
npm install
npm run db:seed -w api
npm run dev
```

- Frontend: http://127.0.0.1:5173
- API: http://127.0.0.1:3001/api/gift-ideas

Both processes run together; Ctrl+C stops them. Vite can select another frontend port if 5173 is occupied; use the URL printed in the terminal. The API fails rather than silently changing its port.

```powershell
Invoke-RestMethod http://127.0.0.1:3001/api/gift-ideas
```

To use a different API port, set both values in the same terminal before starting:

```powershell
$env:PORT = "3002"
$env:API_PORT = "3002"
npm run dev
```

`PORT` controls Express and `API_PORT` controls the Vite proxy. These are process environment variables; no `.env` file loader is configured.

## Database

The API reads from MongoDB. Connection settings default to a local server and can be overridden with environment variables:

- `MONGODB_URI` (default `mongodb://127.0.0.1:27017`)
- `MONGODB_DB` (default `gift_ideas`)

Population scripts (run from the repository root):

```powershell
npm run db:seed -w api    # upserts the six sample records into gift_ideas.giftIdeas
npm run db:reset -w api   # removes all documents from the collection
```

Seeding is idempotent: documents are upserted by `id` (unique index), so re-running it is safe. The sample records live in `api/src/data/giftIdeas.js` and are only used by the seed script and tests — the API itself always reads from the database.

## API contract

`GET /api/gift-ideas` returns HTTP 200 and a JSON array, ordered as below:

| id | idea | price | type |
| --- | --- | --- | --- |
| 1 | Ravintolaillallinen | 80 | elämys |
| 2 | Saunavuoro | 30 | elämys |
| 3 | Konserttiliput | 65 | elämys |
| 4 | Kahvimuki | 15 | tuote |
| 5 | Kirja | 25 | tuote |
| 6 | Villapaita | 60 | tuote |

Each object has exactly `id` (number), `idea` (string), `price` (number, EUR), and `type` (string). Finnish text is preserved in JSON; the client formats prices using `Intl.NumberFormat("fi-FI")`.

The API supports full CRUD:

| Method | Path | Success | Description |
| --- | --- | --- | --- |
| GET | `/api/gift-ideas` | 200 | List all gift ideas ordered by `id` |
| GET | `/api/gift-ideas/:id` | 200 | Get one gift idea |
| POST | `/api/gift-ideas` | 201 | Create a gift idea; the `id` is generated |
| PUT | `/api/gift-ideas/:id` | 200 | Replace an existing gift idea |
| DELETE | `/api/gift-ideas/:id` | 204 | Remove a gift idea |

POST and PUT accept a JSON body with `idea` (non-empty string, trimmed), `price` (non-negative number), and `type` (`"elämys"` or `"tuote"`). Invalid input and malformed JSON return HTTP 400 with `{ "error": "<reason>" }`. Unknown routes, unknown ids, and unsupported methods return HTTP 404 with `{ "error": "Not found" }`. Repository failures return HTTP 500 with `{ "error": "Internal server error" }`; details are logged only on the server.

## Structure

```text
api/
  src/
    app.js                         Express configuration; no listening side effects
    server.js                      Port and process startup
    data/giftIdeas.js               The six sample records (seed data)
    db/mongoClient.js               MongoDB connection handling
    features/gift-ideas/
      giftIdeasRoutes.js            HTTP routes
      giftIdeasController.js        HTTP request/response handling
      giftIdeasRepository.js        Async data access (MongoDB)
      giftIdeas.test.js             API and repository tests
  scripts/
    seedGiftIdeas.js                Populates MongoDB with the sample records
    resetGiftIdeas.js               Empties the giftIdeas collection
client/
  public/gift-wrap.jpg              Locally served decorative photograph
  src/
    main.jsx                       React entry point
    App.jsx                        Screen composition and request states
    styles.css                     Responsive visual styling
    features/gift-ideas/
      giftIdeasApi.js               Fetch and HTTP errors (list, create, delete)
      useGiftIdeas.js               Loading, errors, retry, create/delete actions
      GiftIdeaForm.jsx              Form for creating a new gift idea
      GiftIdeasList.jsx             Presentation, EUR formatting and delete buttons
      GiftIdeas.test.jsx            Client behavior tests
    test/setup.js                  DOM matchers and test cleanup
  e2e/giftIdeas.spec.js             Live browser integration tests
  vite.config.js                   React, tests, development/preview API proxy
eslint.config.js                   Shared JavaScript/React lint configuration
infra/
  main.bicep                        Azure resources: Cosmos DB (Mongo RU), App Service
  provision.ps1                     Creates the Azure resources
  setup-github-oidc.ps1             Wires GitHub Actions deployment (OIDC)
.github/workflows/deploy.yml        Builds, tests and deploys to App Service
playwright.config.js               Desktop and mobile browser projects
package.json                       npm workspaces and shared commands
package-lock.json                  Reproducible dependency versions
```

Request flow: React screen -> request hook -> fetch helper -> Vite `/api` proxy -> Express router -> controller -> repository -> MongoDB.

The API and client have separate dependencies and can run individually with `npm run dev -w api` and `npm run dev -w client`. One root install manages both workspaces.

## Tests and build

```powershell
npm test
npm run lint
npm run build
```

Focused tests: `npm test -w api` or `npm test -w client`. API tests use Supertest without binding the configured server port; CRUD tests mock the repository, so they do not need a running MongoDB. Client tests mock the HTTP boundary and cover loading, populated/empty states, retry, cancelled/stale requests, and creating/deleting ideas.

For live Chromium checks, install the browser once:

```powershell
npx playwright install chromium
```

Keep `npm run dev` running in one terminal, then run `npm run test:e2e` in another. If Vite uses another port, set `$env:CLIENT_URL = "http://127.0.0.1:5174"` before running the checks. Browser tests cover real API data, retry, empty states, image loading, and layout at desktop/mobile sizes. Screenshots are saved under `node_modules/.cache/`.

`npm run build` produces `client/dist`; plain JavaScript needs no API transpilation. `npm start` starts only the API. To inspect the built client locally, keep the API running and use `npm run preview -w client` (usually http://127.0.0.1:4173).

Vite's development/preview proxy is not a production server. In Azure, Express serves the client build itself: when the `CLIENT_DIST` environment variable points to a directory, the API also serves those static files and falls back to `index.html` for non-`/api` GET requests. `HOST` controls the listen address (`0.0.0.0` in App Service, default `127.0.0.1` locally).

## Deploy to Azure

Resources: one Linux App Service (serves both the API and the client build) and an Azure Cosmos DB for MongoDB (RU, serverless) account with the `gift_ideas` database and an indexed `giftIdeas` collection.

Provision once (requires Azure CLI):

```powershell
az login
.\infra\provision.ps1 -ResourceGroup rg-gift-ideas -Location swedencentral
```

Wire up GitHub Actions deployment via OIDC (requires `gh auth login`); the script creates an Entra app registration with a federated credential for the `main` branch, grants it Website Contributor on the resource group, and stores `AZURE_CLIENT_ID`/`AZURE_TENANT_ID`/`AZURE_SUBSCRIPTION_ID` secrets plus the `AZURE_WEBAPP_NAME` variable in the repository:

```powershell
.\infra\setup-github-oidc.ps1 -ResourceGroup rg-gift-ideas
```

Application code deploys from `.github/workflows/deploy.yml` on every push to `main` (or manually via *Run workflow*): it lints, tests, builds the client, and deploys the API plus the client build to App Service. No deployment credentials live in the repository.

Seed the Azure database once from your machine:

```powershell
$env:MONGODB_URI = az cosmosdb keys list -g rg-gift-ideas -n <cosmosAccountName> --type connection-strings --query "connectionStrings[0].connectionString" -o tsv
npm run db:seed -w api
Remove-Item Env:MONGODB_URI
```

## Extend later

- Add an update (edit) flow to the client; the API already supports `PUT /api/gift-ideas/:id`. Keep fetching outside presentation components.
- Add a service layer only when there is actual business logic to share; this simple feature does not need one yet.

## Assets and tooling

The decorative gift photograph is from [Unsplash](https://unsplash.com/photos/1549465220-1a8b9238cd48), downloaded from [the source image](https://images.unsplash.com/photo-1549465220-1a8b9238cd48). It is served locally and is not gift-idea data. DM Sans and Manrope load from Google Fonts, with sans-serif fallbacks if offline. Icons use Lucide.

The root `minimatch` override selects the patched development-tool dependency for GHSA-g3hv-75wg-m249. Remove it when upstream ESLint dependencies no longer select affected versions.