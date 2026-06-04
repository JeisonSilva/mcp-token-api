FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci --ignore-scripts
COPY frontend/ .
RUN npm run build -- --configuration=production

FROM nginx:1.27-alpine
COPY --from=frontend-build /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx/frontend.conf /etc/nginx/nginx.conf
