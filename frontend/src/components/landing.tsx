import { CardTitle, CardDescription, CardHeader, CardContent, Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import axios from "axios"

const BACKEND_UPLOAD_URL = "http://localhost:3000";

function siteUrl(id: string) {
  return `http://${id}.localhost:3001`;
}

export function Landing() {
  const [repoUrl, setRepoUrl] = useState("");
  const [uploadId, setUploadId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const deployed = status === "deployed";
  const failed = status === "failed";

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Deploy your GitHub Repository</CardTitle>
          <CardDescription>Enter the URL of your GitHub repository to deploy it</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="github-url">GitHub Repository URL</Label>
              <Input
                id="github-url"
                onChange={(e) => {
                  setRepoUrl(e.target.value);
                }}
                placeholder="https://github.com/username/repo"
              />
            </div>
            <Button onClick={async () => {
              setError("");
              setStatus("");
              setUploading(true);
              try {
                const res = await axios.post(`${BACKEND_UPLOAD_URL}/deploy`, {
                  repoUrl: repoUrl
                });
                setUploadId(res.data.id);
                setStatus("uploaded");
                setUploading(false);

                const interval = setInterval(async () => {
                  try {
                    const response = await axios.get(`${BACKEND_UPLOAD_URL}/status?id=${res.data.id}`);
                    const nextStatus = response.data.status as string;
                    setStatus(nextStatus);

                    if (nextStatus === "deployed" || nextStatus === "failed") {
                      clearInterval(interval);
                    }
                  } catch (pollErr: any) {
                    clearInterval(interval);
                    setError(pollErr.message ?? "Failed to check deploy status");
                  }
                }, 3000)
              } catch (err: any) {
                setUploading(false);
                setError(err.response?.data?.error ?? err.message ?? "Deploy failed");
              }
            }} disabled={uploadId !== "" || uploading} className="w-full" type="submit">
              {uploading
                ? "Uploading..."
                : uploadId
                  ? `Deploying (${uploadId})`
                  : "Upload"}
            </Button>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {failed && <p className="text-sm text-red-600">Build failed for {uploadId}.</p>}
          </div>
        </CardContent>
      </Card>
      {deployed && <Card className="w-full max-w-md mt-8">
        <CardHeader>
          <CardTitle className="text-xl">Deployment Status</CardTitle>
          <CardDescription>Your website is successfully deployed!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="deployed-url">Deployed URL</Label>
            <Input id="deployed-url" readOnly type="url" value={siteUrl(uploadId)} />
          </div>
          <br />
          <Button className="w-full" variant="outline" asChild>
            <a href={siteUrl(uploadId)} target="_blank" rel="noreferrer">
              Visit Website
            </a>
          </Button>
        </CardContent>
      </Card>}
    </main>
  )
}
