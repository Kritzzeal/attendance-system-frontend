# Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies - using npm install instead of npm ci
RUN npm install --legacy-peer-deps

# Copy all files
COPY . .

# Build the React app for production
RUN npm run build

# Install serve to run the production build
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Command to run the app
CMD ["serve", "-s", "build", "-l", "3000"]