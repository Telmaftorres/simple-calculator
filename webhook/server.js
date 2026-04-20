const http = require("http");
const crypto = require("crypto");
const { execFile } = require("child_process");

const SECRET = "4404aabe483e88c1f7977cfc4d82fb9d0086da2eba72dde1266afc8eafb39d6e";
const PORT = 9000;

http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/deploy") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const sig = "sha256=" + crypto.createHmac("sha256", SECRET).update(body).digest("hex");
      const ghSig = req.headers["x-hub-signature-256"];

      if (!ghSig || sig !== ghSig) {
        res.writeHead(401);
        return res.end("Unauthorized");
      }

      const payload = JSON.parse(body);
      if (payload.ref === "refs/heads/main") {
        console.log("Push on main detected, deploying...");
        execFile("/home/ubuntu/webhook/deploy.sh", (err, stdout, stderr) => {
          if (err) console.error("Deploy error:", stderr);
          else console.log("Deploy done:", stdout);
        });
      }

      res.writeHead(200);
      res.end("OK");
    });
  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(PORT, () => console.log(`Webhook listening on port ${PORT}`));
