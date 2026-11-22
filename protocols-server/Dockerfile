FROM oven/bun:1.4.2

WORKDIR /app

# Install dependencies first for better layer caching
COPY protocols-server/package.json ./
RUN bun install --production

# Copy the server code. The example protocol JSONs are imported at runtime via
# `../examples/...` (relative to /app), so they must live at /examples/.
COPY protocols-server/ ./
COPY examples/arthropods.cigaleprotocol.json examples/arthropods.light.cigaleprotocol.json examples/old-arthropods.cigaleprotocol.json /examples/

# Generated options/assets/caches live on the mounted PVC
ENV DATA_DIR=/data
RUN mkdir -p /data && chown -R bun:bun /data

EXPOSE 3000

USER bun

CMD ["bun", "run", "server.ts"]
