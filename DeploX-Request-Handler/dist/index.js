"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const aws_sdk_1 = require("aws-sdk");
const mime_types_1 = __importDefault(require("mime-types"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const s3 = new aws_sdk_1.S3({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});
// Handle root "/"
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    serveFromS3(req, res, "/index.html");
}));
// Handle all other paths
app.get("/*splat", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    serveFromS3(req, res, req.path);
}));
// Fetch file from S3 based on subdomain and request path
function serveFromS3(req, res, path) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const host = req.hostname; // e.g. "755mt.deplox.com"
            const id = host.split(".")[0]; // e.g. "755mt"
            const s3Key = `dist/${id}${path}`; // e.g. "dist/755mt/index.html"
            console.log("Fetching:", s3Key);
            const contents = yield s3.getObject({
                Bucket: "deplox",
                Key: s3Key
            }).promise();
            const contentType = mime_types_1.default.lookup(path) || "application/octet-stream";
            res.set("Content-Type", contentType);
            res.send(contents.Body);
        }
        catch (err) {
            console.error("Error fetching:", err);
            res.status(404).send("File not found");
        }
    });
}
app.listen(3001, () => {
    console.log("Server running at http://localhost:3001");
});
