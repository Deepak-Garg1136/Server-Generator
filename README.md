# Server Code Generator

This project generates server-side code based on the structure defined in an `input.json` file. The generated server code is an Express.js application with routes and middleware configured according to the input JSON.

## Prerequisites

- Node.js (v12 or higher)

## Installation

1. Clone the repository or download the project files.
2. Navigate to the project directory.

## Usage

1. Ensure that your input.json file is orrectly structured and placed in the project directory.

2. Run the script.js file to generate the server code:
   node script.js

3. The generated server code will be written to generatedServer.js.

4. To start the generated server, run:
   node generatedServer.js

## Input JSON Structure

The input.json file should define the nodes of the application, including routes and middleware. Each node should have the following structure:

{

"nodes": [
{
"id": "1",
"name": "Start",
"source": null,
"target": "2",
"properties": { "type": "entry" }
},
{
"id": "2",
"name": "CORS Middleware",
"source": "1",
"target": "3",
"properties": { "type": "middleware", "allowed_origins": ["*"] }
},
{
"id": "3",
"name": "Auth Middleware",
"source": "2",
"target": ["4", "5", "6", "7"],
"properties": { "type": "middleware", "auth_required": true }
},
{
"id": "4",
"name": "Login Route",
"source": "3",
"target": "8",
"properties": { "endpoint": "/login", "method": "POST" }
},
// Additional nodes...
]
}

## Middleware and Routes

The script generates middleware and routes based on the nodes defined in the `input.json` file. The following middleware types are supported:

- **CORS Middleware**: Configures Cross-Origin Resource Sharing.
- **Auth Middleware**: Checks for authorization headers.
- **Admin Auth Middleware**: Checks for admin authorization.
- **Logging Middleware**: Logs incoming requests.

Routes are generated with the specified HTTP methods and endpoints.

## Customization

You can customize the middleware and route generation logic by modifying the `script.js` file. The key functions to look at are:

- `middlewareGenerator`: Generates middleware code based on the nodes.
- `routesGenerator`: Generates route code based on the nodes.
