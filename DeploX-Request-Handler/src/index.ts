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
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

function getDeployId(req: express.Request): string | null {
  const host = req.hostname;
  const queryId = typeof req.query.id === "string" ? req.query.id : null;

  if (host === "localhost" || host === "127.0.0.1") {
    return queryId;
  }

  const subdomain = host.split(".")[0];
  if (!subdomain || subdomain === "www") {
    return queryId;
  }

  return subdomain;
}

app.get("/", async (req, res) => {
  await serveFromS3(req, res, "/index.html");
});

app.get("/*splat", async (req, res) => {
  await serveFromS3(req, res, req.path);
});

async function serveFromS3(
  req: express.Request,
  res: express.Response,
  filePath: string
) {
  try {
    const id = getDeployId(req);
    if (!id) {
      res
        .status(400)
        .send(
          "Missing deploy id. Open http://<id>.localhost:3001 or http://localhost:3001/?id=<id>"
        );
      return;
    }

    const s3Key = `dist/${id}${filePath}`;
    console.log("Fetching:", s3Key);

    const contents = await s3
      .getObject({
        Bucket: process.env.AWS_BUCKET_NAME || "deplox",
        Key: s3Key,
      })
      .promise();

    const contentType = mime.lookup(filePath) || "application/octet-stream";
    res.set("Content-Type", contentType);
    res.send(contents.Body);
  } catch (err) {
    console.error("Error fetching:", err);
    res.status(404).send("File not found");
  }
}

app.listen(3001, () => {
  console.log("Request handler running at http://localhost:3001");
  console.log("Open deployed sites at http://<id>.localhost:3001");
});
