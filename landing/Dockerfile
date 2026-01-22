# Build Stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

# Install serve globally (lightweight static file server)
RUN npm install -g serve

# Copy built files from build stage
COPY --from=build /app/dist ./dist

EXPOSE 80

# Serve the built files on port 80
# Note: Port 80 requires root, but serve handles this in containers
CMD ["serve", "-s", "dist", "-l", "80"]
