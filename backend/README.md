# 🖥️ Nova AI — Backend Service

The backend is a lightweight, zero-dependency Python service that:
1. **Serves the Frontend**: Serves static HTML, CSS, and JS assets from `../frontend` with strict no-cache headers for instant updates during development.
2. **AI Proxy Endpoint (`/api/chat`)**: Proxies chat prompts and PDF contexts to the cloud neural engine with CORS headers (`Access-Control-Allow-Origin: *`), preventing client-side network/adblocker restrictions.

## Requirements
- Python 3.8+ (Uses only standard library modules: `http.server`, `urllib.request`, `json`, `socketserver`)
- No `pip install` needed!

## Running the Backend

From the project root:
```bash
python3 backend/server.py
```

Or from inside the `backend/` folder:
```bash
cd backend
python3 server.py
```

The server will launch at **http://localhost:3000**.
