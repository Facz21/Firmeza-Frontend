# Stage 1: Build React + TypeScript Frontend with Node 22 (Debian glibc for Vite 8 / Rolldown compatibility)
FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

COPY . .

ARG VITE_API_URL=http://localhost:5193/api/v1
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Stage 2: Serve static bundle with Nginx
FROM nginx:alpine AS final
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
