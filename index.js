import { createServer } from "http";
import { join } from "path";
import express from "express";
import fetch from "node-fetch"; // make sure node-fetch installed
import { routeRequest } from "wisp-server-node";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = parseInt(process.env.PORT || "8080", 10);

const pubDir = join(__dirname, "public");

const app = express();
const server = createServer(app);


app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Expose-Headers", "Content-Length, X-Kuma-Revision");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Service-Worker-Allowed", "/");
  next();
});


app.use(express.static(pubDir));
app.use("/uv/", express.static(uvPath));
app.use("/libcurl/", express.static(libcurlPath));
app.use("/epoxy/", express.static(epoxyPath));
app.use("/baremux/", express.static(baremuxPath));


app.get("/scram/", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send("Missing url parameter");

  try {
    const response = await fetch(targetUrl, { redirect: "follow" });
    const contentType = response.headers.get("content-type") || "text/html";

    if (
      contentType.includes("application/octet-stream") ||
      contentType.includes("wasm") ||
      contentType.includes("image") ||
      contentType.includes("video")
    ) {
      const buffer = await response.arrayBuffer();
      res.setHeader("Content-Type", contentType);
      return res.send(Buffer.from(buffer));
    }

    const text = await response.text();
    res.setHeader("Content-Type", contentType);
    res.send(text);
  } catch (err) {
    console.error("[Scramjet fetch error]:", err);
    res.status(500).send("Failed to fetch the requested URL");
  }
});


app.use((req, res) => {
  res.status(404).sendFile(join(pubDir, "404.html"));
});


server.on("upgrade", (req, socket, head) => {
  if (req.url.endsWith("/wisp/")) {
    routeRequest(req, socket, head);
  } else {
    socket.end();
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`| SaturnProxy 1.0 | Running on http://localhost:${port}`);
});
