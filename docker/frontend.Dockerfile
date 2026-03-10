# Stage 1: Build the React application
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Install dependencies based on package.json
COPY package.json package-lock.json ./
RUN npm install

# Copy application files
COPY . .

# Build for production
RUN npm run build

# Stage 2: Serve the application using NGINX
FROM nginx:alpine

# Copy the built application from previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY default.conf /etc/nginx/conf.d/default.conf

# Expose port (Internal container port)
EXPOSE 80

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]
