FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install with legacy peer deps (NOT npm ci)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Install serve
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Start the app
CMD ["serve", "-s", "build", "-l", "3000"]