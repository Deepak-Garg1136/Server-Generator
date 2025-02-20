const fs = require("fs");
const path = require("path");

const inputFile = path.join(__dirname, "input.json");

const input = JSON.parse(fs.readFileSync(inputFile, "utf8"));

const middlewareGenerator = (middlewareNodes) => {
  let middlewareCode = "";
  middlewareNodes.forEach((middleware) => {
    switch (middleware.name) {
      case "CORS Middleware":
        middlewareCode += `
const cors = require('cors');
app.use(cors({ origin: "${middleware.properties?.allowed_origins[0]}" }));
`;
        break;
      case "Auth Middleware":
        middlewareCode += `
const authMiddleware = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
`;
        break;
      case "Admin Auth Middleware":
        middlewareCode += `
const adminMiddleware = (req, res, next) => {
  if (req.headers.authorization !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
`;
        break;
      case "Logging Middleware":
        middlewareCode += `
const logger = (req, res, next) => {
  console.log(req.method, req.url);
  next();
};
`;
        break;
      default:
        console.error(`Unhandled middleware: ${middleware.name}`);
    }
  });

  return middlewareCode;
};

const routesToBeAuthenticated = (middlewares, routeId) => {
  let middlewareToBeApplied = [];
  middlewares.forEach((middleware) => {
    const targets = middleware.target;
    if (
      Array.isArray(targets) ? targets.includes(routeId) : targets == routeId
    ) {
      if (middleware.name.includes("Logging Middleware")) {
        middlewareToBeApplied.push("logger");
      }
      if (middleware.name.includes("Auth Middleware")) {
        middlewareToBeApplied.push("authMiddleware");
      }
      if (middleware.name.includes("Admin Auth Middleware")) {
        middlewareToBeApplied.push("adminMiddleware");
      }
    }
  });
  return middlewareToBeApplied.length > 0
    ? middlewareToBeApplied.join(", ")
    : null;
};

const routesGenerator = (middlewares, routesNodes) => {
  let routesCode = "";
  routesNodes.forEach((route) => {
    let middlewareString = routesToBeAuthenticated(middlewares, route.id);
    routesCode += `
app.${route.properties.method.toLowerCase()}('${route.properties.endpoint}'${
      middlewareString ? ", " + middlewareString + ", " : ", "
    }(req, res) => {
  res.json({ message: "${route.name} response" });
});
`;
  });
  return routesCode;
};

const serverCodeGenerator = (input) => {
  let serverCode = `
const express = require('express');
const app = express();
app.use(express.json());
`;

  const middlewaresToBeGenerated = new Set();
  const routesToBeGenerated = new Set();
  input.nodes.forEach((node) => {
    if (node.properties?.type === "middleware") {
      middlewaresToBeGenerated.add(node);
    } else if (node.properties?.endpoint) {
      routesToBeGenerated.add(node);
    }
  });

  const middlewareCode = middlewareGenerator(middlewaresToBeGenerated);
  if (middlewareCode) {
    serverCode += middlewareCode;
  }

  const routesCode = routesGenerator(
    middlewaresToBeGenerated,
    routesToBeGenerated
  );
  if (routesCode) {
    serverCode += routesCode;
  }

  serverCode += `
app.listen(3000, () => console.log("Server running on port 3000"));
`;

  return serverCode;
};

const serverCode = serverCodeGenerator(input);

fs.writeFile(path.join(__dirname, "generatedServer.js"), serverCode, (err) => {
  if (err) {
    console.error(err);
  } else {
    console.log("Server code generated successfully.");
  }
});
