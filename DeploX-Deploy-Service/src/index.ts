import { createClient } from "redis";
import { copyFinalDist, downloadS3Folder } from "./aws";
import { buildProject } from "./utils";

async function main() {
  const subscriber = createClient();
  const publisher = createClient();

  await subscriber.connect();
  await publisher.connect();

  while (true) {
    const response = await subscriber.brPop("build-queue", 0);
    if (!response) continue;

    const id = response.element;
    console.log("🔔 Received job for:", id);

    try {
      await downloadS3Folder(`output/${id}`);
      await buildProject(id);
      copyFinalDist(id);
      await publisher.hSet("status", id, "deployed");
      console.log(`Deployment succeeded for ${id}`);
    } catch (err: any) {
      console.error(`Deployment failed for ${id}:`, err.message);
      await publisher.hSet("status", id, "failed");
    }
  }
}

main();
