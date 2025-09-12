# Use the official playwright docker image
FROM mcr.microsoft.com/playwright:v1.55.0-noble

# Install unzip and curl (required by bun)
RUN apt-get update && apt-get install -y \
    unzip \
    curl \
    && rm -rf /var/lib/apt/lists/*

