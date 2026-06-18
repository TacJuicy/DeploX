// utils.ts
import { exec } from "child_process";
import fs from "fs";
import path from "path";

export function buildProject(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const basePath = path.join(__dirname, `output/${id}`);
    const frontendPath = path.join(basePath, "frontend");
    const projectDir = fs.existsSync(frontendPath) ? frontendPath : basePath;
    const buildOutputDir = path.join(projectDir, "dist");

    const command = `cd ${projectDir} && npm install && npm run build`;
    console.log("Running build in:", projectDir);

    const child = exec(command);

    child.stdout?.on("data", (data) => {
      console.log("stdout:", data.toString());
    });

    child.stderr?.on("data", (data) => {
      console.error("stderr:", data.toString());
    });

    child.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`Build failed with exit code ${code}`));
      }

      if (!fs.existsSync(buildOutputDir)) {
        return reject(
          new Error(`Build finished but dist/ folder not found at ${buildOutputDir}`)
        );
      }

      resolve();
    });
  });
}
