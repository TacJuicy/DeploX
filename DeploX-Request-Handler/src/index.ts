import express from "express";
import dotenv from "dotenv";
import { S3 } from "aws-sdk";
import mime from "mime-types";

dotenv.config();

const app = express();

const s3 = new S3({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

// Handle root "/"
app.get("/", async (req, res) => {
  serveFromS3(req, res, "/index.html");
});

// Handle all other paths
app.get("/*splat", async (req, res) => {
  serveFromS3(req, res, req.path);
});

// Fetch file from S3 based on subdomain and request path
async function serveFromS3(req: express.Request, res: express.Response, path: string) {
  try {
    const host = req.hostname; // e.g. "755mt.deplox.com"
    const id = host.split(".")[0]; // e.g. "755mt"

    const s3Key = `dist/${id}${path}`; // e.g. "dist/755mt/index.html"
    console.log("Fetching:", s3Key);

    const contents = await s3.getObject({
      Bucket: "deplox",
      Key: s3Key
    }).promise();

    const contentType = mime.lookup(path) || "application/octet-stream";
    res.set("Content-Type", contentType);
    res.send(contents.Body);
  } catch (err) {
    console.error("Error fetching:", err);
    res.status(404).send("File not found");
  }
}

app.listen(3001, () => {
  console.log("Server running at http://localhost:3001");
});
