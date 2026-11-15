# tChat backend

Node.js, Express, MongoDB, and Socket.IO backend for the tChat app.

## Run locally

1. Install Node.js 20 or later and MongoDB. The default local connection uses port `27017`.
2. Run `npm install` in the project root.
3. Copy `.env.example` to `.env` and set a private `JWT_SECRET`.
4. Start MongoDB, then run `npm run dev:backend` from the project root.

The API listens on `http://localhost:5001` by default. The health endpoint is
`GET /api/health`.

## Deployment boundary

Deploy this folder as the Node.js API service from the repository root so the
`@tchat/database` workspace package is available. Use `npm install` during the
build and `npm run start --workspace backend` as the start command. Configure
`PORT`, `JWT_SECRET`, `MONGODB_URI`, `MONGODB_DATABASE`, and `CLIENT_URL` in the
service environment. `CLIENT_URL` can contain comma-separated frontend origins.
Do not copy `.env` or local MongoDB files into the deployment image.

The API adds basic browser security headers and limits login and registration
to 10 requests per IP every 15 minutes. This limiter is held in process memory;
for a multi-instance deployment, configure equivalent rate limiting at the
hosting proxy or use a shared rate-limit store.

## API routes

Authentication routes:

- `POST /api/auth/register` with `name`, `email`, and `password`
- `POST /api/auth/login` with `email` and `password`
- `GET /api/auth/me`

User routes require a bearer token:

- `GET /api/users?search=name-or-email`
- `GET /api/users/:userId`

Messaging routes require a bearer token:

- `GET /api/messages/conversations`
- `POST /api/messages/conversations` with `participantId`
- `GET /api/messages/conversations/:conversationId/messages`
- `POST /api/messages/conversations/:conversationId/messages` with `text`
- `PATCH /api/messages/conversations/:conversationId/read`

The register and login responses include a JWT. Send it on protected requests
as `Authorization: Bearer <token>`.

## Socket events

Connect to the same server with a Socket.IO client and pass the JWT as
`auth: { token }`. After connecting, the server supports:

- `conversation:join` with a conversation ID (membership is checked)
- `conversation:leave` with a conversation ID
- `typing:start` and `typing:stop` with a conversation ID

The server emits `message:new`, `conversation:updated`, `user:online`, and
`user:offline` events.
