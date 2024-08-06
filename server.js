import Hapi from "@hapi/hapi";
import routes from "./routes";
import { db } from "./database";
import Path from "path";

let server;

const start = async () => {
  server = Hapi.server({
    port: 3000,
    host: "localhost",
    routes: {
      cors: true,
      files: {
        relativeTo: Path.join(__dirname, "build"),
      },
    },
  });

  routes.forEach((route) => server.route(route));

  await server.register(require("@hapi/inert"));

  // Serve static files
  server.route({
    method: "GET",
    path: "/{param*}",
    handler: {
      directory: {
        path: Path.join(__dirname, "build"),
        listing: false,
        index: true,
      },
    },
  });

  // Fallback controller to serve main HTML file
  server.route({
    method: "GET",
    path: "/somepath/{any*}",
    handler: (request, h) => {
      return h.file(Path.join(__dirname, "build", "index.html"));
    },
  });

  db.connect();
  await server.start();
  console.log(`Server is listening on ${server.info.uri}`);
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

process.on("SIGINT", async () => {
  console.log("Stopping server...");
  await server.stop({ timeout: 10000 });
  db.end();
  console.log("Server stopped");
  process.exit(0);
});

start();
