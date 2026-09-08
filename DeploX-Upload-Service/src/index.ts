import express from "express";
import cors from "cors";
import simpleGit from "simple-git";
import { generate } from "./utils";
import path from "path";
import { getAllFiles } from "./file";
import { uploadFile } from "./upload";
import { createClient } from "redis";

const publisher = createClient();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/deploy", async (req, res) => {
  try {
    const repoUrl = req.body.repoUrl;
    if (!repoUrl || typeof repoUrl !== "string") {
      res.status(400).json({ error: "repoUrl is required" });
      return;
    }

    console.log(repoUrl);
    const id = generate();
    await simpleGit().clone(repoUrl, path.join(__dirname, `output/${id}`));

    const files = getAllFiles(path.join(__dirname, `output/${id}`));
    await Promise.all(
      files.map((file) => uploadFile(file.slice(__dirname.length + 1), file))
    );

    await publisher.lPush("build-queue", id);
    await publisher.hSet("status", id, "uploaded");

    res.json({ id });
  } catch (err: any) {
    console.error("Deploy failed:", err);
    res.status(500).json({ error: err.message ?? "Deploy failed" });
  }
});

app.get("/status", async (req, res) => {
  const id = req.query.id;
  if (typeof id !== "string" || !id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const status = await publisher.hGet("status", id);
  res.json({ status: status ?? "unknown" });
});

async function start() {
  await publisher.connect();
  app.listen(3000, () => {
    console.log("Upload service running at http://localhost:3000");
  });
}

start().catch((err) => {
  console.error("Failed to start upload service:", err);
  process.exit(1);
});
