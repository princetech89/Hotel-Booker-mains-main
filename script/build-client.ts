import { build as viteBuild } from "vite";

async function buildClient() {
  console.log("building client...");
  await viteBuild();
}

buildClient().catch((err) => {
  console.error(err);
  process.exit(1);
});
