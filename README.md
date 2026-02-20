# SNIP — URL Shortener (Node 22 LTS + Azure)

A URL shortener demo app showcasing **Node 22 LTS** features, deployable to Azure App Service.

## Node 22 Features Demonstrated

| Feature | Usage |
|---|---|
| `node:sqlite` | Built-in database — no `better-sqlite3` needed |
| Native `fetch()` | HTTP requests — no `axios` or `node-fetch` |
| ES Modules | `import/export` — no Babel or CommonJS hacks |
| `--watch` flag | Hot reload in dev — no `nodemon` |

## Project Structure

```
azure-demo-node22/
├── server.js          # ES Module server (import/export)
├── package.json       # "type": "module" for ESM
├── public/
│   └── index.html     # Dark terminal-style frontend
└── README.md
```

## Running Locally

Requires Node 22+:
```bash
node --version   # should be v22.x.x
npm install
npm start        # or: node --watch server.js (dev mode, no nodemon!)
```

## Deploy to Azure App Service (Node 22 LTS)

### 1. Login & setup
```bash
az login
az group create --name Node22DemoRG --location eastus
```

### 2. Create App Service Plan
```bash
az appservice plan create \
  --name Node22Plan \
  --resource-group Node22DemoRG \
  --sku F1 \
  --is-linux
```

### 3. Create Web App with Node 22 runtime
```bash
az webapp create \
  --name snip-url-shortener \
  --resource-group Node22DemoRG \
  --plan Node22Plan \
  --runtime "NODE:22-lts"
```

### 4. Deploy
```bash
zip -r app.zip . --exclude "node_modules/*" --exclude ".git/*"

az webapp deploy \
  --resource-group Node22DemoRG \
  --name snip-url-shortener \
  --src-path app.zip \
  --type zip
```

### 5. Open app
```bash
az webapp browse --resource-group Node22DemoRG --name snip-url-shortener
```

## Key Difference from Node 18 Demo

The `--runtime "NODE:22-lts"` flag in step 3 is the key change. Azure supports:
- `NODE:18-lts`
- `NODE:20-lts`
- `NODE:22-lts` ← this demo

Also note `"type": "module"` in `package.json` — required for ES Modules to work.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/links | List all links |
| POST | /api/links | Create `{ url, code? }` |
| DELETE | /api/links/:code | Delete a link |
| GET | /api/health | Health + Node version info |
| GET | /:code | Redirect to destination |
