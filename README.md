# tChat

A full-stack chat app built with React, Express, MongoDB, and Socket.IO.

## Project folders

- `frontend/` — React UI, login and registration pages, API client, and Socket.IO client
- `backend/` — Express API, JWT authentication, MongoDB models, and Socket.IO server
- `database/` — database connection and model exports, plus the collection overview

These are separate application boundaries: deploy `frontend/` as a static Vite
site, `backend/` as a Node.js service, and provision MongoDB as a separate
database service. The backend imports schemas and connection helpers from the
local `@tchat/database` workspace package, so build it from the repository root.

## Deployment configuration

- Frontend build: `npm run build --workspace frontend`. Set `VITE_API_URL` to
  the deployed API's `/api` URL and `VITE_SOCKET_URL` to the deployed API origin.
- Backend start: `npm run start --workspace backend`. Set `PORT`, `JWT_SECRET`,
  `MONGODB_URI`, `MONGODB_DATABASE`, and `CLIENT_URL` in the hosting provider.
  `CLIENT_URL` is the frontend origin (or comma-separated origins).
- Database: use a MongoDB deployment and provide its URI as `MONGODB_URI`.
  Never deploy the local `database/data/` files or commit environment secrets.

Configure the frontend and backend separately in the hosting provider. Both
workspace commands run from the repository root so their workspace dependencies
resolve consistently.

## Run locally

Requirements: Node.js 20 or later and MongoDB listening on port `27017`.

1. Run `npm install` in the project root.
2. Start MongoDB.
3. Set a private `JWT_SECRET` in `backend/.env`.
4. In one terminal, run `npm run dev:backend` from the project root.
5. In another terminal, run `npm run dev:frontend` from the project root.
6. Open the Vite URL shown in the frontend terminal.

The backend defaults to `mongodb://localhost:27017/`. Set `MONGODB_URI` in
`backend/.env` to use another MongoDB server. Keep the JWT secret private.

Users can register, sign in, find another account by email, create a direct
conversation, and send persisted text messages. Socket.IO updates active
conversations and online status. File uploads and group conversations are not
implemented yet.
