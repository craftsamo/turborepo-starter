const path = require("path");

const webPath = path.resolve(__dirname, "apps/web");

const ciPath = path.resolve(__dirname, "out");

module.exports = {
  scripts: {
    link: `node scripts/link-agent-skills.mjs`,
    setup: {
      github: {
        default: `node scripts/setup/github/repository.mts`,
        secrets: `node scripts/setup/github/secrets.mts`,
      },
    },
    prepare: {
      default: `nps prepare.web`,
      web: `pnpm install`,
      ci: {
        web: `npx turbo prune --scope=web && cd out && pnpm install --frozen-lockfile`,
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
    format: {
      default: `npx turbo run format`,
      web: `npx turbo run format --filter=web`,
      packages: {
        default: `npx turbo run format --filter=@workspace/ui --filter=@workspace/constants --filter=@workspace/types`,
        ui: `npx turbo run format --filter=@workspace/ui`,
        constants: `npx turbo run format --filter=@workspace/constants`,
        types: `npx turbo run format --filter=@workspace/types`,
      },
    },
    typecheck: {
      default: `nps typecheck.scripts && npx turbo run typecheck`,
      scripts: `pnpm exec tsc6 --project scripts/tsconfig.json`,
      web: `npx turbo run typecheck --filter=web`,
      packages: {
        default: `npx turbo run typecheck --filter=@workspace/ui --filter=@workspace/constants --filter=@workspace/types`,
        ui: `npx turbo run typecheck --filter=@workspace/ui`,
        constants: `npx turbo run typecheck --filter=@workspace/constants`,
        types: `npx turbo run typecheck --filter=@workspace/types`,
      },
    },
    test: {
      default: `nps test.scripts && npx turbo run test`,
      scripts: `node --test scripts/tests/*.test.mjs`,
      e2e: `npx turbo run test:e2e`,
      web: {
        default: `nps test.web.unit`,
        unit: `npx turbo run test --filter=web`,
        e2e: {
          default: `nps test.web.e2e.all`,
          desktop: `npx turbo run test:e2e --filter=web -- --project=desktop`,
          tablet: `npx turbo run test:e2e --filter=web -- --project=tablet`,
          mobile: `npx turbo run test:e2e --filter=web -- --project=mobile`,
          all: `npx turbo run test:e2e --filter=web`,
        },
        live: `npx turbo run test:live --filter=web`,
      },
      ci: {
        default: `nps test.ci.scripts && nps test.ci.web`,
        scripts: `node --test scripts/tests/*.test.mjs`,
        web: {
          default: `nps test.ci.web.unit`,
          unit: `cd ${ciPath} && pnpm exec turbo run test:ci --filter=web`,
          e2e: {
            default: `nps test.ci.web.e2e.all`,
            desktop: `cd ${ciPath} && pnpm exec turbo run test:e2e --filter=web -- --project=desktop`,
            tablet: `cd ${ciPath} && pnpm exec turbo run test:e2e --filter=web -- --project=tablet`,
            mobile: `cd ${ciPath} && pnpm exec turbo run test:e2e --filter=web -- --project=mobile`,
            all: `cd ${ciPath} && pnpm exec turbo run test:e2e --filter=web`,
          },
        },
      },
      watch: {
        default: `nps test.watch.web`,
        web: `cd ${webPath} && pnpm test:watch`,
      },
    },
    build: {
      default: "npx turbo run build",
      web: "npx turbo run build --filter=web",
      packages: {
        default: `npx turbo run build --filter=@workspace/constants --filter=@workspace/types`,
        constants: `npx turbo run build --filter=@workspace/constants`,
        types: `npx turbo run build --filter=@workspace/types`,
      },
      ci: {
        web: "cd out && pnpm build",
      },
    },
    docker: {
      build: {
        default: "nps docker.build.web",
        web: `docker build -t web . -f ${webPath}/Dockerfile`,
      },
      start: {
        web: "docker compose -f docker-compose.web.yml up --build",
      },
    },
    start: {
      default: `npx turbo run start`,
      web: "npx turbo run start --filter=web",
    },
    dev: {
      default: "npx turbo run dev",
      web: "npx turbo run dev --filter=web",
    },
  },
};
