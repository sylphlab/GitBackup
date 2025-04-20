# Use an official Node.js runtime as a parent image
# Choose a version compatible with your project (e.g., LTS version)
FROM node:20-alpine as builder

# Set the working directory in the container
WORKDIR /app

# Install git - essential for simple-git to function
# Alpine uses apk package manager
RUN apk update && apk add --no-cache git

# Copy package.json and package-lock.json (or yarn.lock, pnpm-lock.yaml)
COPY package*.json ./

# Install app dependencies
# Use --omit=dev if you don't need devDependencies in the final image
# Or install all and prune later if build step needs devDependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# --- Production Stage ---
# Use a smaller base image for the final image
FROM node:20-alpine

WORKDIR /app

# Install git again in the production stage
RUN apk update && apk add --no-cache git

# Copy only necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json .
# Copy .env file handling logic might be needed, or rely on runtime env vars

# Expose any port if your application listens on one (not needed for this CLI tool)
# EXPOSE 3000

# Define the command to run your app
# Assumes GITHUB_PAT will be passed as an environment variable at runtime
CMD ["node", "dist/main.js"]