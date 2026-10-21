FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Set environment variable for build & runtime
ENV NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Build application
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start Next.js production server
CMD ["npm", "start", "--", "-p", "3000"]
