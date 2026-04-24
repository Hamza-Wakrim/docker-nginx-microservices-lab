# Reverse Proxy Architecture with Docker Compose

This project is a small reverse proxy lab built with `Nginx`, `Docker Compose`, a static frontend, and three Node.js backend instances.

It shows how to:

- expose a single public entry point with Nginx
- route `/` to the frontend
- route `/api/` to multiple backend containers
- isolate internal services with Docker networks
- manage the stack with Docker Compose or Ansible

## Architecture

High-level request flow:

```text
Client
  |
  v
nginx-proxy
  |---- / -------> frontend
  |
  \---- /api/ ---> backend-1
                  backend-2
                  backend-3

backend-1/2/3 ----> postgres
backend-1/2/3 ----> redis
```

## Main Components

- `nginx-proxy`: public reverse proxy exposed on port `80`
- `frontend`: static web application
- `backend-1`, `backend-2`, `backend-3`: API containers behind the proxy upstream
- `postgres`: database service available on the internal backend network
- `redis`: cache service available on the internal backend network

## How Routing Works

The main configuration is in `nginx/nginx.conf.template`.

- requests to `/` are forwarded to the `frontend` service
- requests to `/api/` are forwarded to the `backend_api` upstream
- the upstream contains `backend-1`, `backend-2`, and `backend-3`
- proxy headers such as `Host`, `X-Real-IP`, and `X-Forwarded-For` are preserved

This means the browser only communicates with Nginx, and Nginx forwards traffic to the internal containers.

## Networks and Volumes

The Compose stack defines:

- `proxy-net`: connects `nginx-proxy`, `frontend`, and the backend containers
- `backend-net`: private network for the backend containers, `postgres`, and `redis`
- `postgres-data`: persistent PostgreSQL data
- `redis-data`: persistent Redis data

The proxy also mounts `./logs/nginx` into the container to store Nginx logs.

## Project Structure

```text
tp-docker/
├── README.md
├── .gitignore
├── docker-compose.yml
├── nginx/
│   └── nginx.conf.template
├── frontend/
│   ├── dockerfile
│   ├── index.html
│   └── app.js
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
└── ansible/
    ├── inventory.ini
    └── playbook.yml
```

## Frontend

The frontend is a simple static page with two actions:

- `Check Health` calls `/api/health`
- `Load Data` calls `/api/data`

Because the frontend uses relative `/api/...` URLs, requests pass through the reverse proxy automatically.

## Backend API

The backend is an Express application listening on port `3000`.

Available endpoints:

- `GET /health`
- `GET /data`

Example response:

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

At the moment, the backend containers receive `DB_HOST` and `REDIS_HOST` environment variables from Compose, while `postgres` and `redis` are available for future backend integration.

## Run with Docker Compose

Start the stack:

```bash
docker compose up --build
```

Run in detached mode:

```bash
docker compose up -d --build
```

Stop the stack:

```bash
docker compose down
```

Stop and remove volumes:

```bash
docker compose down -v
```

## Run with Ansible

The project also includes a small Ansible playbook in `ansible/playbook.yml` to manage the Docker Compose stack locally.

Start:

```bash
ansible-playbook -i ansible/inventory.ini ansible/playbook.yml -e action=start
```

Stop:

```bash
ansible-playbook -i ansible/inventory.ini ansible/playbook.yml -e action=stop
```

Restart:

```bash
ansible-playbook -i ansible/inventory.ini ansible/playbook.yml -e action=restart
```

Status:

```bash
ansible-playbook -i ansible/inventory.ini ansible/playbook.yml -e action=status
```

When `action=start` is used, the playbook creates `logs/nginx` before starting the containers.

## Test the Project

After startup, open:

```text
http://localhost
```

You can also test the API directly:

```bash
curl http://localhost/api/health
curl http://localhost/api/data
```

## Why This Setup Is Useful

This project is a good base for learning:

- reverse proxying with Nginx
- load balancing across multiple backend containers
- service isolation with Docker networks
- container orchestration with Docker Compose
- simple local automation with Ansible

## Possible Next Improvements

- add health checks for services
- connect the backend code to PostgreSQL and Redis
- add HTTPS and TLS termination
- add request logging/monitoring dashboards
- show which backend instance handled each request
