# FlowSync: arranque del monorepo (backend AdonisJS + frontend Vite).
#
#   make setup   instala dependencias, prepara backend/.env, genera APP_KEY y migra
#   make start   levanta backend (:3333) y frontend (:5173) a la vez; Ctrl+C para ambos
#
# Portable a propósito: GNU Make 3.81 (el de macOS) y /bin/sh POSIX, sin bashismos.
# En Windows se usa desde WSL, con el repo clonado dentro del sistema de ficheros de
# Linux (~/...), no en /mnt/c: ahí npm es muy lento y los node_modules no son de Linux.

SHELL := /bin/sh

NODE_MAJOR_MIN := 24

.DEFAULT_GOAL := help
.PHONY: help setup start check-node

help:
	@echo "Uso:"
	@echo "  make setup   instala dependencias, prepara backend/.env, genera APP_KEY y migra"
	@echo "  make start   levanta backend (http://localhost:3333) y frontend (http://localhost:5173)"

# Con Node < 24 el backend falla con 'Unknown file extension ".ts"': mejor avisar antes.
check-node:
	@command -v node >/dev/null 2>&1 || { echo "Error: no se encuentra node. Instala Node.js $(NODE_MAJOR_MIN)+." >&2; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "Error: no se encuentra npm." >&2; exit 1; }
	@node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= $(NODE_MAJOR_MIN) ? 0 : 1)' || { \
		echo "Error: se necesita Node.js $(NODE_MAJOR_MIN)+ (tienes $$(node -v))." >&2; exit 1; }

# Se puede repetir sin miedo: no pisa un .env existente ni regenera una APP_KEY ya puesta.
setup: check-node
	@echo "==> Dependencias del backend"
	cd backend && npm ci
	@echo "==> Dependencias del frontend"
	cd frontend && npm ci
	@echo "==> backend/.env"
	@if [ -f backend/.env ]; then echo "backend/.env ya existe, no se toca"; \
	else cp backend/.env.example backend/.env && echo "backend/.env creado desde .env.example"; fi
	@echo "==> APP_KEY"
	@if grep -Eq '^APP_KEY=.+' backend/.env; then echo "APP_KEY ya definida, no se regenera"; \
	else cd backend && node ace generate:key; fi
	@echo "==> Migraciones"
	cd backend && node ace migration:run
	@echo "Listo. Ejecuta 'make start'."

# Lo orquesta scripts/dev.mjs y no un `a & b & wait`: con sh no interactivo los procesos
# en segundo plano ignoran Ctrl+C y `ace serve` ignora SIGTERM, así que quedaban servidores
# huérfanos ocupando los puertos. El script cierra ambos con Ctrl+C y, si uno se cae,
# para también el otro.
start: check-node
	@[ -d backend/node_modules ] && [ -d frontend/node_modules ] && [ -f backend/.env ] || { \
		echo "Error: falta la instalación. Ejecuta 'make setup' primero." >&2; exit 1; }
	@node scripts/dev.mjs
