# ============================================================
# RMS Backend — Makefile
# Quick dev shortcuts for the NestJS monorepo
# ============================================================

.PHONY: help up down up-tools down-tools dev test lint format clean build logs ps

# ── Default target ────────────────────────────────────────────
help:
	@echo ""
	@echo "  RMS Backend — available commands"
	@echo ""
	@echo "  Infrastructure:"
	@echo "    make up           Start core infra (MongoDB, Redis, Kafka) in background"
	@echo "    make up-tools     Start infra + dev tools (Mongo-Express, Redis-Commander)"
	@echo "    make down         Stop all containers"
	@echo "    make logs         Follow container logs"
	@echo "    make ps           Show running containers"
	@echo ""
	@echo "  Development:"
	@echo "    make dev          Start all microservices in watch mode (Turborepo)"
	@echo "    make build        Build all services"
	@echo "    make typecheck    Type-check all services"
	@echo "    make lint         Lint all services"
	@echo "    make format       Format all files with Prettier"
	@echo "    make clean        Remove all dist/ folders and cache"
	@echo ""
	@echo "  Testing:"
	@echo "    make test         Run unit tests for all services"
	@echo "    make test-e2e     Run integration/e2e tests"
	@echo "    make test-cover   Run tests with coverage report"
	@echo ""

# ── Infrastructure ─────────────────────────────────────────────
up:
	docker compose up -d mongodb redis kafka

up-tools:
	docker compose --profile dev-tools up -d

up-all:
	docker compose --profile dev-tools up -d

down:
	docker compose down

logs:
	docker compose logs -f

ps:
	docker compose ps

# ── Infra health check ─────────────────────────────────────────
wait-infra:
	@echo "Waiting for MongoDB..."
	@until docker exec rms-mongodb mongosh --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; do sleep 2; done
	@echo "Waiting for Redis..."
	@until docker exec rms-redis redis-cli ping > /dev/null 2>&1; do sleep 2; done
	@echo "Infrastructure is ready ✓"

# ── Development ─────────────────────────────────────────────────
dev: up wait-infra
	npm run dev

build:
	npm run build

typecheck:
	npm run typecheck

lint:
	npm run lint

format:
	npm run format

format-check:
	npm run format:check

clean:
	npm run clean
	find . -name "dist" -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.tsbuildinfo" -not -path "*/node_modules/*" -exec rm -f {} + 2>/dev/null || true

# ── Testing ──────────────────────────────────────────────────────
test:
	npm run test

test-e2e:
	npm run test:e2e

test-cover:
	npm run test -- --coverage

# ── Install ───────────────────────────────────────────────────────
install:
	npm install

# ── Setup (first-time onboarding) ────────────────────────────────
setup: install up wait-infra
	@echo ""
	@echo "  ✓  RMS Backend ready for development"
	@echo "  Run 'make dev' to start all services"
	@echo ""
