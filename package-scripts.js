const path = require("path");

const webPath = path.resolve(__dirname, "apps/web");
const apiPath = path.resolve(__dirname, "apps/api");
const discordPath = path.resolve(__dirname, "apps/discordbot");

const ciWebPath = path.resolve(__dirname, "out/apps/web");
const ciApiPath = path.resolve(__dirname, "out/apps/api");
const ciDiscordBotPath = path.resolve(__dirname, "out/apps/discordbot");

module.exports = {
  scripts: {
    prepare: {
      default: `nps prepare.web prepare.api`,
      web: `yarn`,
      api: `nps prepare.docker`,
      docker: "docker compose -f docker-compose.proxy.yml up -d",
      ci: {
        web: `npx turbo prune --scope=web && cd out && yarn install --frozen-lockfile`,
        api: `npx turbo prune --scope=api && cd out && yarn install --frozen-lockfile`,
        discordbot: `npx turbo prune --scope=discordbot && cd out && yarn install --frozen-lockfile`,
      },
    },
    test: {
      default: `nps test.web test.api`,
      web: `cd ${webPath} && yarn test`,
      api: `cd ${apiPath} && yarn test`,
      discordbot: `cd ${discordPath} && yarn test`,
      ci: {
        default: `nps test.ci.web test.ci.api`,
        web: `cd ${ciWebPath} && yarn test:ci`,
        api: `cd ${ciApiPath} && yarn test:ci`,
        discordbot: `cd ${ciDiscordBotPath} && yarn test:ci`,
      },
      watch: {
        default: `nps test.watch.web test.watch.api`,
        web: `cd ${webPath} && yarn test:watch`,
        api: `cd ${apiPath} && yarn test:watch`,
        discordbot: `cd ${discordPath} && yarn test:watch`,
      },
    },
    build: {
      default: "npx turbo run build",
      ci: {
        web: "cd out && npm run build",
        api: "cd out && npm run build",
        api: "cd out && npm run build",
      },
    },
    docker: {
      default: "nps docker.build.web docker.build.api docker.build.discordbot",
      build: {
        web: `docker build -t web . -f ${webPath}/Dockerfile`,
        api: `docker build -t api . -f ${apiPath}/Dockerfile`,
        discordbot: `docker build -t api . -f ${discordPath}/Dockerfile`,
      },
    },
    start: {
      web: "docker compose -f docker-compose.web.yml up --build",
      proxy: "nps prepare.docker",
      api: "nps prepare.docker && docker compose -f docker-compose.api.yml up --build",
      discordbot:
        "nps prepare.docker && docker compose -f docker-compose.discordbot.yml up --build",
    },
    dev: {
      default: "npx turbo run dev",
      web: "npx turbo run dev --filter=web",
      api: "npx turbo run dev --filter=api",
      discordbot: "npx turbo run dev --filter=discordbot",
    },
  },
};
