FROM node:18-alpine

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

EXPOSE 3000

CMD ["npm", "start"]
