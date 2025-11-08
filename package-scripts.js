const path = require("path");

const webPath = path.resolve(__dirname, "apps/web");

const ciWebPath = path.resolve(__dirname, "out/apps/web");

module.exports = {
  scripts: {
    prepare: {
      default: `nps prepare.web`,
      web: `yarn`,
      ci: {
        web: `npx turbo prune --scope=web && cd out && yarn install --frozen-lockfile`,
      },
    },
    lint: {
      default: `npx turbo run lint`,
      web: `npx turbo run lint --filter=web`,
      packages: {
        default: `npx turbo run lint --filter=@workspace/ui --filter=@workspace/constants --filter=@workspace/types`,
        ui: `npx turbo run lint --filter=@workspace/ui`,
        constants: `npx turbo run lint --filter=@workspace/constants`,
        types: `npx turbo run lint --filter=@workspace/types`,
      },
    },
    test: {
      default: `nps test.web`,
      web: `cd ${webPath} && yarn test`,
      ci: {
        default: `nps test.ci.web`,
        web: `cd ${ciWebPath} && yarn test:ci`,
      },
      watch: {
        default: `nps test.watch.web`,
        web: `cd ${webPath} && yarn test:watch`,
      },
    },
    build: {
      default: "npx turbo run build",
      ci: {
        web: "cd out && npm run build",
      },
    },
    docker: {
      build: {
        default: "nps docker.build.web",
        web: `docker build -t web . -f ${webPath}/Dockerfile`,
      },
    },
    start: {
      web: "docker compose -f docker-compose.web.yml up --build",
    },
    dev: {
      default: "npx turbo run dev",
      web: "npx turbo run dev --filter=web",
    },
  },
};
