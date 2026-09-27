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

# Los dos targets son de desarrollo. Un NODE_ENV=production heredado del shell haría que
# `npm ci` omitiera devDependencies (y `node ace` no arrancaría) y que generate:key no
# escribiera la clave.
export NODE_ENV := development

# APP_KEY con contenido real: `APP_KEY=`, `APP_KEY=""`, solo espacios o un \r de un .env
# con CRLF no cuentan (con ellos el backend no arranca).
APP_KEY_SET := ^APP_KEY=["]?[A-Za-z0-9_-]

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
# En WSL, el PATH incluye el de Windows: un node/npm de /mnt/c instalaría node_modules de
# Windows. Tienen que ser los de Linux.
	@for bin in node npm; do case "$$(command -v $$bin)" in /mnt/*) \
		echo "Error: $$bin apunta a Windows ($$(command -v $$bin)). Instala Node.js dentro de WSL (p. ej. con nvm)." >&2; \
		exit 1;; esac; done

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
	@if grep -Eq '$(APP_KEY_SET)' backend/.env; then echo "APP_KEY ya definida, no se regenera"; \
	else (cd backend && node ace generate:key) && \
		grep -Eq '$(APP_KEY_SET)' backend/.env || { \
		echo "Error: no se pudo escribir APP_KEY en backend/.env." >&2; exit 1; }; fi
	@echo "==> Migraciones"
	cd backend && node ace migration:run
	@echo "Listo. Ejecuta 'make start'."

# Lo orquesta scripts/dev.mjs y no un `a & b & wait`: con sh no interactivo los procesos
# en segundo plano ignoran Ctrl+C y `ace serve` ignora SIGTERM, así que quedaban servidores
# huérfanos ocupando los puertos. El script cierra ambos con Ctrl+C y, si uno se cae,
# para también el otro.
start: check-node
	@[ -d backend/node_modules ] && [ -d frontend/node_modules ] && [ -f backend/.env ] && \
		grep -Eq '$(APP_KEY_SET)' backend/.env || { \
		echo "Error: falta la instalación. Ejecuta 'make setup' primero." >&2; exit 1; }
	@node scripts/dev.mjs
