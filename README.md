# Reverse Proxy Architecture with Docker and Nginx

This project demonstrates a reverse proxy architecture built with Docker Compose, Nginx, a static frontend, a Node.js API, PostgreSQL, and Redis.

The goal is to show how a single entry point can:

- serve the frontend to users
- forward API traffic to backend services
- hide internal container addresses behind one public endpoint
- support basic load balancing between multiple backend instances

## Architecture Overview

The stack is organized around one main Nginx reverse proxy:

- `frontend/`: static web application served by Nginx
- `backend/`: Node.js API exposing `/health` and `/data`
- `nginx/`: main reverse proxy configuration
- `backend/nginx/`: simpler proxy example that forwards all traffic to one API container
- `docker-compose.yml`: orchestrates the full multi-container stack

High-level request flow:

```text
Client Browser
     |
     v
[ Main Nginx Reverse Proxy ]
     |------------------------------> /        -> Frontend container
     |
     |------------------------------> /api/*   -> Backend API pool
                                                   |- backend-1
                                                   |- backend-2
                                                   \- backend-3
```

## How Routing Works

The main reverse proxy configuration is based on `nginx/nginx.conf.template`.

- Requests to `/` are sent to the frontend container.
- Requests to `/api/` are sent to the `backend_api` upstream.
- The upstream contains 3 backend servers, which allows basic load balancing.
- Nginx also forwards useful headers such as:
  - `Host`
  - `X-Real-IP`
  - `X-Forwarded-For`
  - `X-Forwarded-Proto`

In the Compose setup, the backend containers also communicate with `postgres` and `redis` on the private `backend-net` network, while Nginx and the frontend stay on `proxy-net`.

This means the browser only talks to Nginx, while Nginx communicates with the internal services.

## Project Structure

```text
docker/
├── README.md
├── docker-compose.yml
├── nginx/
│   └── nginx.conf.template
├── frontend/
│   ├── dockerfile
│   ├── index.html
│   └── app.js
└── backend/
    ├── Dockerfile
    ├── package.json
    └── server.js
```

## Frontend

The frontend is a minimal static site that provides two buttons:

- `Check Health` -> calls `/api/health`
- `Load Data` -> calls `/api/data`

Because the frontend uses relative paths (`/api/...`), requests automatically go through the reverse proxy instead of calling the backend directly.

## Backend API

The backend is a small Express application listening on port `3000`.

Available endpoints:

- `GET /health`: returns service status
- `GET /data`: returns sample JSON data

Example responses:

```json
{
  "status": "ok",
  "service": "minimal-node-api"
}
```

```json
{
  "message": "Voici les donnees de test",
  "items": [
    { "id": 1, "name": "Post 1" },
    { "id": 2, "name": "Post 2" }
  ]
}
```

## Reverse Proxy Configurations

### 1. Main proxy

`nginx/nginx.conf.template` is the main architecture example:

- `/` -> frontend
- `/api/` -> backend upstream group

This is the most complete example in the repository.

The upstream targets in this configuration match the services declared in `docker-compose.yml`.

### 2. Backend-only proxy

`backend/nginx/nginx.conf` and `backend/nginx/nginx.conf.template` show a simpler setup where Nginx forwards everything to a single API container.

This version is useful if you want to understand reverse proxy basics before adding a frontend and multiple backend instances.

## Run the Project with Docker Compose

The recommended way to run the project is with `docker-compose.yml`.

### 1. Start the stack

```bash
docker compose up --build
```

### 2. Run in detached mode

```bash
docker compose up -d --build
```

### 3. Stop the stack

```bash
docker compose down
```

### 4. Stop and remove volumes

```bash
docker compose down -v
```

## Services Started by Compose

The Compose file starts these services:

- `nginx-proxy`: public entry point on port `80`
- `frontend`: static client application
- `backend-1`, `backend-2`, `backend-3`: API instances used by the reverse proxy upstream
- `postgres`: relational database
- `redis`: cache or fast in-memory service

It also creates:

- `proxy-net`: network between the proxy, frontend, and API services
- `backend-net`: private network between the API services, PostgreSQL, and Redis
- `postgres-data`: persistent PostgreSQL volume
- `redis-data`: persistent Redis volume

## Test the Architecture

After startup:

- open `http://localhost`
- click `Check Health`
- click `Load Data`

You can also test directly:

```bash
curl http://localhost/api/health
curl http://localhost/api/data
```

## Why This Architecture Is Useful

This reverse proxy pattern is common because it:

- centralizes traffic through one public entry point
- separates frontend and backend concerns
- makes backend services private and easier to scale
- allows load balancing and future SSL termination
- simplifies client-side URLs

## Possible Improvements

If you want to take this project further, you can add:

- health checks for backend containers
- HTTPS with TLS certificates
- round-robin demonstration with backend instance IDs
- logging and monitoring
- caching or rate limiting in Nginx

## Summary

This repository is a simple educational example of a reverse proxy architecture:

- Nginx is the public gateway
- the frontend is served behind Nginx
- API calls go through `/api/`
- Nginx forwards those calls to one or more backend containers

It is a good base for learning container networking, reverse proxying, and service routing with Docker.
