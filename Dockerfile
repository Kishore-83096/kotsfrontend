FROM node:22-alpine AS build

WORKDIR /app
ARG APP_MODE
ENV APP_MODE=${APP_MODE}
ARG BACKEND_BASE_URL
ENV BACKEND_BASE_URL=${BACKEND_BASE_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/kots_frontend/browser /usr/share/nginx/html

EXPOSE 80
EXPOSE 10000

CMD ["sh", "-c", "echo \"Frontend is running in ${APP_MODE:-development} mode. Open: http://127.0.0.1:4200 or http://127.0.0.1:10000\"; nginx -g 'daemon off;'"]
