# ──────────────────────────────────────────────────────────────────────────────
# SENAM — Docker control via make
#
# Windows: `make` is not built into PowerShell. Install GNU Make once, e.g.
#     winget install ezwinports.make      (or: scoop install make / choco install make)
# then restart the terminal. You can also run the underlying `docker compose`
# commands directly if you prefer not to install make.
#
# Quick start:
#     cp .env.example .env       # then set a long JWT_SECRET
#     make up-dev                # dev stack (hot reload) — http://localhost:5173
#     make up                    # prod stack            — http://localhost
# ──────────────────────────────────────────────────────────────────────────────

COMPOSE ?= docker compose
DEV  := -f docker-compose.yml -f docker-compose.dev.yml
PROD := -f docker-compose.yml

.DEFAULT_GOAL := help

# ── Help ────────────────────────────────────────────────────────────────────
.PHONY: help
help: ## Show this help
	@echo "SENAM docker targets:"
	@echo ""
	@echo "  Production stack (single origin, port 80):"
	@echo "    make build           Build prod images (api + dashboard/nginx)"
	@echo "    make up              Start prod stack (detached)"
	@echo "    make down            Stop prod stack"
	@echo ""
	@echo "  Development stack (hot reload, api:3000 + vite:5173):"
	@echo "    make build-dev       Build dev images"
	@echo "    make up-dev          Start dev stack (follow logs)"
	@echo "    make up-dev-d        Start dev stack (detached)"
	@echo "    make down-dev        Stop dev stack"
	@echo ""
	@echo "  Database:"
	@echo "    make migrate         Run TypeORM migrations (dev: builds first)"
	@echo "    make migrate-prod    Run migrations against the running prod stack"
	@echo "    make seed            Seed dev data"
	@echo ""
	@echo "  Ops:"
	@echo "    make ps | logs | logs-api | logs-web | restart"
	@echo "    make api-shell | web-shell | db-shell | redis-cli"
	@echo "    make down-v          Stop and DELETE volumes (wipes db/redis/minio)"
	@echo "    make clean           Remove stack + dangling docker resources"

# ── Build ─────────────────────────────────────────────────────────────────────
.PHONY: build build-dev
build: ## Build production images
	$(COMPOSE) $(PROD) build

build-dev: ## Build development images
	$(COMPOSE) $(DEV) build

# ── Up / Down (prod) ───────────────────────────────────────────────────────────
.PHONY: up down restart
up: ## Start the production stack (detached)
	$(COMPOSE) $(PROD) up -d

down: ## Stop the production stack
	$(COMPOSE) $(PROD) down

restart: ## Restart the production stack
	$(COMPOSE) $(PROD) restart

# ── Up / Down (dev) ─────────────────────────────────────────────────────────────
.PHONY: up-dev up-dev-d down-dev
up-dev: ## Start the dev stack and follow logs
	$(COMPOSE) $(DEV) up

up-dev-d: ## Start the dev stack (detached)
	$(COMPOSE) $(DEV) up -d

down-dev: ## Stop the dev stack
	$(COMPOSE) $(DEV) down

# ── Database ────────────────────────────────────────────────────────────────────
.PHONY: migrate migrate-prod seed
migrate: ## Build + run migrations inside the running dev api container
	$(COMPOSE) $(DEV) exec api sh -c "npm run build && npm run migration:run"

migrate-prod: ## Run migrations against the running prod api container
	$(COMPOSE) $(PROD) exec api npm run migration:run

seed: ## Seed development data (dev stack)
	$(COMPOSE) $(DEV) exec api npm run seed:dev

# ── Inspection ──────────────────────────────────────────────────────────────────
.PHONY: ps logs logs-api logs-web
ps: ## Show container status (dev view)
	$(COMPOSE) $(DEV) ps

logs: ## Follow all logs (dev)
	$(COMPOSE) $(DEV) logs -f

logs-api: ## Follow api logs (dev)
	$(COMPOSE) $(DEV) logs -f api

logs-web: ## Follow web logs (dev)
	$(COMPOSE) $(DEV) logs -f web

# ── Shells ──────────────────────────────────────────────────────────────────────
.PHONY: api-shell web-shell db-shell redis-cli
api-shell: ## Shell into the api container
	$(COMPOSE) $(DEV) exec api sh

web-shell: ## Shell into the web container
	$(COMPOSE) $(DEV) exec web sh

db-shell: ## psql into postgres
	$(COMPOSE) $(DEV) exec postgres psql -U $${POSTGRES_USER:-senam} -d $${POSTGRES_DB:-senam}

redis-cli: ## redis-cli into redis
	$(COMPOSE) $(DEV) exec redis redis-cli

# ── Cleanup ─────────────────────────────────────────────────────────────────────
.PHONY: down-v clean
down-v: ## Stop dev stack and remove named volumes (DESTRUCTIVE)
	$(COMPOSE) $(DEV) down -v

clean: ## Remove dev stack (with volumes) and prune dangling docker resources
	$(COMPOSE) $(DEV) down -v --remove-orphans
	docker system prune -f
