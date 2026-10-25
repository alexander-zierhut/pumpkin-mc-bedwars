# syntax=docker/dockerfile:1
# The BedWars server image: the Pumpkin fork (vendor/Pumpkin, branch bedwars-pvp-fixes) with the TypeScript plugin,
# the config and the Rush map. The server directory is the volume /srv, filled on the first start.

FROM rust:1-bookworm AS pumpkin
WORKDIR /src
COPY vendor/Pumpkin/ ./
# lan profile: release with thin LTO (a fat LTO release build takes many times longer)
# JOBS limits the parallel compile jobs (docker compose build --build-arg JOBS=4), default all cores
ARG JOBS
RUN --mount=type=cache,target=/usr/local/cargo/registry,sharing=locked \
    --mount=type=cache,target=/src/target,sharing=locked \
    cargo build --locked --profile lan -p pumpkin ${JOBS:+-j $JOBS} && cp target/lan/pumpkin /pumpkin

FROM node:24-bookworm-slim AS plugin
WORKDIR /w
COPY plugin/package.json plugin/package-lock.json plugin/
RUN cd plugin && npm ci
COPY vendor/Pumpkin/crates/pumpkin-plugin-wit/ vendor/Pumpkin/crates/pumpkin-plugin-wit/
COPY config/ config/
COPY maps/ maps/
COPY tools/ tools/
COPY plugin/ plugin/
# the RCON password is generated per server on the first start (docker/entrypoint.sh), not baked into the image
RUN cd plugin && npm test && npm run check \
    && cd .. && tools/apply.sh /opt/bedwars \
    && rm /opt/bedwars/.rcon-password && cp config/pumpkin.toml /opt/bedwars/pumpkin.toml

FROM debian:bookworm-slim
LABEL org.opencontainers.image.source=https://github.com/alexander-zierhut/pumpkin-mc-bedwars
LABEL org.opencontainers.image.description="BedWars with 1.8 PvP on Pumpkin, a Minecraft server written in Rust"
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates tzdata && rm -rf /var/lib/apt/lists/*
COPY --from=pumpkin /pumpkin /usr/local/bin/pumpkin
COPY --from=plugin /opt/bedwars /opt/bedwars
COPY docker/entrypoint.sh /usr/local/bin/bedwars-entrypoint
COPY LICENSE /opt/bedwars/LICENSE
COPY vendor/Pumpkin/LICENSE /opt/bedwars/LICENSE-pumpkin
WORKDIR /srv
VOLUME /srv
EXPOSE 25565 25575
ENTRYPOINT ["bedwars-entrypoint"]
CMD ["pumpkin"]
