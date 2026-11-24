FROM oven/bun:1.4.2

WORKDIR /app

# Install dependencies first for better layer caching
COPY protocols-server/package.json ./
RUN bun install --production

# Copy the server code. The example protocol JSONs are imported at runtime via
# `../examples/...` (relative to /app), so they must live at /examples/.
COPY protocols-server/ ./

# protocol-types.ts is gitignored — generate it from the protocol schema.
# The schemas are also served at /schemas/... by the server.
COPY static/*.schema.json ./static/
RUN bun run generate:types

# Protocol manifests (YAML only; the .json ones are generated at runtime by the
# metadatabuilders and written next to the YAMLs). Served at the root level by
# the server, so they must live at /protocols/ and be writable by the bun user.
COPY protocols/ /protocols/
RUN chown -R bun:bun /protocols

# Generated options/assets/caches live on the mounted PVC
ENV DATA_DIR=/data
# Write a progress snapshot file (progress.json) during regeneration,
# exposed via GET /api/regenerate
ENV PROGRESS_FILE=true
# Mutating API routes (POST /api/regenerate, DELETE /api/caches/...) require
# the API_PASSWORD env var, set at deploy time (e.g. via hfctl).
RUN mkdir -p /data && chown -R bun:bun /data

EXPOSE 3000

USER bun

CMD ["bun", "run", "main.ts", "--serve"]
