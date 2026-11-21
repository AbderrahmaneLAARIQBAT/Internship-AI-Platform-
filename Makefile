.PHONY: up down build logs shell-backend shell-db seed clean help

# Default target
help:
	@echo "Intern AI Platform - Make Commands"
	@echo "==================================="
	@echo "make up          - Start all services"
	@echo "make down        - Stop all services"
	@echo "make build       - Rebuild all Docker images"
	@echo "make logs        - Follow all service logs"
	@echo "make logs-api    - Follow backend logs only"
	@echo "make shell-api   - Open shell in backend container"
	@echo "make shell-db    - Open psql in database container"
	@echo "make clean       - Remove containers, volumes, and images"
	@echo "make restart     - Restart all services"

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose up --build -d

logs:
	docker compose logs -f

logs-api:
	docker compose logs -f backend

logs-db:
	docker compose logs -f db

logs-frontend:
	docker compose logs -f frontend

shell-api:
	docker compose exec backend bash

shell-db:
	docker compose exec db psql -U intern_admin -d intern_ai

restart:
	docker compose restart

clean:
	docker compose down -v --rmi local
	docker system prune -f

status:
	docker compose ps

health:
	@curl -s http://localhost:8000/health | python -m json.tool || echo "Backend not running"
