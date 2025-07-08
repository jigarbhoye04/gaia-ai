FROM node:24-alpine

# Create app directory
WORKDIR /app

# Install global pnpm (not required if using corepack)
RUN npm install -g pnpm

# Copy only required files for install step
COPY package.json pnpm-lock.yaml ./

# Install dependencies (will be cached unless package.json changes)
RUN pnpm install

# Copy the rest of the app (src, public, etc.)
COPY . .

# Expose port
EXPOSE 3000

# Start dev server (hot reload)
CMD ["pnpm", "dev"]