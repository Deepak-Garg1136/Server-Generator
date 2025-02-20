const fs = require("fs");
const path = require("path");

const inputFile = path.join(__dirname, "input.json");

const input = JSON.parse(fs.readFileSync(inputFile, "utf8"));

const nodeMap = new Map();

input.nodes.forEach((node) => {
  nodeMap.set(node.id, node);
});

// Create Middleware
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

// It will find out which routes to be authenticated based on the target field of the middlewares
const routesToBeAuthenticated = (middlewares, routeId) => {
  for (const middleware of middlewares) {
    const targets = middleware.target;
    if (
      Array.isArray(targets) ? targets.includes(routeId) : targets == routeId
    ) {
      return middlewareString(middleware.name);
    }
  }
  return "";
};

// It will find out which routes to be authenticated based on the source field of the routes
const middlewareToBeApplied = (node) => {
  if (node.source == null) {
    return "";
  }

  if (node.properties?.type == "middleware") {
    return node.name;
  }
  return middlewareToBeApplied(nodeMap.get(node.source));
};

// It will generate a string of middlewares to be applied
function middlewareString(middlewareName) {
  let middlewaresArray = [];
  if (middlewareName.includes("Logging Middleware")) {
    middlewaresArray.push("logger");
  }
  if (middlewareName.includes("Auth Middleware")) {
    middlewaresArray.push("authMiddleware");
  }
  if (middlewareName.includes("Admin Auth Middleware")) {
    middlewaresArray.push("adminMiddleware");
  }

  return middlewaresArray.length > 0 ? middlewaresArray.join(", ") : "";
}

// It will generate the routes
const routesGenerator = (middlewares, routesNodes) => {
  let routesCode = "";
  routesNodes.forEach((route) => {
    let middlewaresString = routesToBeAuthenticated(middlewares, route.id);
    if (middlewaresString == "") {
      const middlewareName = middlewareToBeApplied(route);
      middlewaresString += middlewareString(middlewareName);
    }
    routesCode += `
app.${route.properties.method.toLowerCase()}('${route.properties.endpoint}'${
      middlewaresString ? ", " + middlewaresString + ", " : ", "
    }(req, res) => {
  res.json({ message: "${route.name} response" });
});
`;
  });
  return routesCode;
};

// It will generate the server code based on the routes and middlewares
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
