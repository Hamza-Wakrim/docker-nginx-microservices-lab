# Reverse Proxy Architecture with Docker and Nginx

This project demonstrates a simple reverse proxy architecture built with Docker, Nginx, a static frontend, and a Node.js API.

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

High-level request flow:

```text
Client Browser
     |
     v
[ Main Nginx Reverse Proxy ]
     |------------------------------> /        -> Frontend container
     |
     |------------------------------> /api/*   -> Backend API pool
                                                   |- API 1
                                                   |- API 2
                                                   \- API 3
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

This means the browser only talks to Nginx, while Nginx communicates with the internal services.

## Project Structure

```text
docker/
├── README.md
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

This version is useful if you want to understand reverse proxy basics before adding a frontend and multiple backend instances.

## Run the Project with Docker

There is no `docker-compose.yml` in the repository at the moment, so the stack can be started manually with Docker commands.

### 1. Create a Docker network

```bash
docker network create reverse-proxy-net
```

### 2. Build the images

```bash
docker build -t frontend ./frontend
docker build -t backend ./backend
```

### 3. Start frontend container

```bash
docker run -d --name frontend --network reverse-proxy-net -p 8081:80 frontend
```

### 4. Start multiple backend containers

```bash
docker run -d --name api1 --network reverse-proxy-net backend
docker run -d --name api2 --network reverse-proxy-net backend
docker run -d --name api3 --network reverse-proxy-net backend
```

### 5. Start the main Nginx reverse proxy

Use environment variables that match `nginx/nginx.conf.template`.

Example:

```powershell
docker run -d --name reverse-proxy --network reverse-proxy-net -p 8080:80 -e FRONTEND_HOST=frontend -e FRONTEND_PORT=80 -e API_HOST_1=api1 -e API_PORT_1=3000 -e API_HOST_2=api2 -e API_PORT_2=3000 -e API_HOST_3=api3 -e API_PORT_3=3000 -v "${PWD}/nginx/nginx.conf.template:/etc/nginx/templates/default.conf.template:ro" nginx:alpine
```

If Docker does not resolve `${PWD}` correctly on your machine, replace it with the full absolute path to `nginx/nginx.conf.template`.

## Test the Architecture

After startup:

- open `http://localhost:8080`
- click `Check Health`
- click `Load Data`

You can also test directly:

```bash
curl http://localhost:8080/api/health
curl http://localhost:8080/api/data
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

- a `docker-compose.yml` file
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
