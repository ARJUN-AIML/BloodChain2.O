# ===================================================
# Stage 1: Build React Assets with Node.js
# ===================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests for deterministic dependency installation
COPY package.json package-lock.json ./

# Install exact dependencies using package-lock.json
RUN npm ci --prefer-offline --no-audit

# Build arguments for frontend configuration
ARG VITE_API_BASE_URL=/api
ARG PUBLIC_APP_URL=https://bloodchain.org
ARG VITE_PUBLIC_APP_URL=https://bloodchain.org
ARG VITE_FIREBASE_API_KEY=AIzaSyDbMwrUoDEqMw_X4Rm_ss_bAzxRqdN1GuU
ARG VITE_FIREBASE_AUTH_DOMAIN=bloodchain-95960.firebaseapp.com
ARG VITE_FIREBASE_DATABASE_URL=https://bloodchain-95960-default-rtdb.asia-southeast1.firebasedatabase.app
ARG VITE_FIREBASE_PROJECT_ID=bloodchain-95960
ARG VITE_FIREBASE_STORAGE_BUCKET=bloodchain-95960.firebasestorage.app
ARG VITE_FIREBASE_MESSAGING_SENDER_ID=836624051781
ARG VITE_FIREBASE_APP_ID=1:836624051781:web:2ec7be72a04e317ab67d2c
ARG VITE_FIREBASE_MEASUREMENT_ID=G-7ZNRYWT6Y1

# Inject build arguments into environment for Vite compilation
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    PUBLIC_APP_URL=$PUBLIC_APP_URL \
    VITE_PUBLIC_APP_URL=$VITE_PUBLIC_APP_URL \
    VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_DATABASE_URL=$VITE_FIREBASE_DATABASE_URL \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID \
    VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID

# Copy frontend source code
COPY . .

# Compile production bundle
RUN npm run build

# ===================================================
# Stage 2: Production Nginx Server
# ===================================================
FROM nginx:1.27-alpine

# Clean default Nginx files
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose web server port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost:80/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
