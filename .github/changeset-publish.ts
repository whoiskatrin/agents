import { execSync } from "node:child_process";

execSync(`tsx ./.github/resolve-workspace-versions.ts`);
execSync(`npx changeset publish`);
