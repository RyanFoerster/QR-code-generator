FROM node:lts AS build
WORKDIR /app

# Installer jq pour manipuler le JSON
# RUN apt-get update && apt-get install -y jq

# Copier seulement les fichiers de dépendances d'abord
COPY package.json pnpm-lock.yaml* ./

# Installer pnpm
RUN npm install -g pnpm

# Créer un package.json temporaire avec une version spécifique d'esbuild
# RUN cat package.json | jq '.dependencies.esbuild = "0.25.5"' > /tmp/package.json && mv /tmp/package.json ./package.json

# Installer les dépendances
RUN pnpm install

# Ajouter explicitement esbuild avec la bonne version
# RUN pnpm add esbuild@0.25.5 -E

# Copier le reste des fichiers
COPY . .

# Construire l'application
RUN pnpm run build

# Étape de production
FROM node:lts-alpine AS runtime
WORKDIR /app

# Copier seulement les fichiers nécessaires
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules

# Exposer le port
EXPOSE 8080

# Commande de démarrage
CMD [ "node", "./dist/server/entry.mjs" ]