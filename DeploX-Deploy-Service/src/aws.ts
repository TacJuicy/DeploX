// aws.ts
import { S3 } from "aws-sdk";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import dotenv from "dotenv";

dotenv.config();

const s3 = new S3({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function downloadS3Folder(prefix: string) {
  console.log("Downloading files from S3 with prefix:", prefix);

  const allFiles = await s3
    .listObjectsV2({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Prefix: prefix,
    })
    .promise();

  const id = prefix.split("/")[1];

  const allPromises =
    allFiles.Contents?.map(async ({ Key }) => {
      if (!Key) return;

      const relativePath = Key.replace(prefix + "/", "");
      const finalOutputPath = path.join(__dirname, "output", id, relativePath);
      const dirName = path.dirname(finalOutputPath);

      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
      }

      console.log("⬇️  Saving:", finalOutputPath);

      const readStream = s3
        .getObject({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key,
        })
        .createReadStream();

      const writeStream = fs.createWriteStream(finalOutputPath);
      await pipeline(readStream, writeStream);
    }) ?? [];

  console.log("Waiting for all downloads to complete...");
  await Promise.all(allPromises);
  console.log("All files downloaded successfully.");
}

export function copyFinalDist(id: string) {
  const possibleFolders = [
    path.join(__dirname, `output/${id}/frontend/dist`),
    path.join(__dirname, `output/${id}/dist`)
  ];

  let folderPath = possibleFolders.find(fs.existsSync);

  if (!folderPath) {
    console.error("No dist folder found for ID:", id);
    return;
  }

  const allFiles = getAllFiles(folderPath);
  allFiles.forEach((file) => {
    uploadFile(`dist/${id}/` + file.slice(folderPath.length + 1), file);
  });
}

const getAllFiles = (folderPath: string): string[] => {
  if (!fs.existsSync(folderPath)) {
    console.error("Output folder missing:", folderPath);
    return [];
  }

  let response: string[] = [];
  const allFilesAndFolders = fs.readdirSync(folderPath);
  allFilesAndFolders.forEach((file) => {
    const fullFilePath = path.join(folderPath, file);
    if (fs.statSync(fullFilePath).isDirectory()) {
      response = response.concat(getAllFiles(fullFilePath));
    } else {
      response.push(fullFilePath);
    }
  });
  return response;
};

const uploadFile = async (fileName: string, localFilePath: string) => {
  const fileContent = fs.readFileSync(localFilePath);
  const response = await s3
    .upload({
      Body: fileContent,
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: fileName,
    })
    .promise();
  console.log("Uploaded:", response.Key);
};
