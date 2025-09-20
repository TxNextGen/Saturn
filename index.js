import { createServer } from "http";
import { join } from "path";
import express from "express";
import { routeRequest } from "wisp-server-node";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = parseInt(process.env.PORT || "8080", 10);
const info = {
    "version": "1.0",
};

const startup_msg = `
| SaturnProxy ${info.version} |

Running on:
    http://localhost:${port}
`;

const pubDir = join(__dirname, "public");

const app = express();
const server = createServer(app);

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, PUT, DELETE"
    );
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

app.get("/uv/uv.config.js", (req, res) => {
    res.sendFile(join(pubDir, "uv/uv.config.js"));
});

app.use("/uv/", express.static(uvPath));
app.use("/epoxy/", express.static(epoxyPath));
app.use("/baremux/", express.static(baremuxPath));

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
    console.log(startup_msg);
});