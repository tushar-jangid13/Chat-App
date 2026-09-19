const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const normalizeText = (value, limit) => (
    typeof value === "string" ? value.trim().slice(0, limit) : ""
);

function createChatServer() {
    const app = express();
    const server = http.createServer(app);
    const io = new Server(server);
    const users = new Map();

    app.use(express.static(path.join(__dirname, "..")));

    io.on("connection", socket => {
        socket.on("new-user-joined", (name, acknowledge) => {
            const reply = typeof acknowledge === "function" ? acknowledge : () => {};
            if (users.has(socket.id)) return reply({ ok: false, error: "already joined" });

            const userName = normalizeText(name, 40) || "Guest";
            users.set(socket.id, userName);
            socket.broadcast.emit("user-joined", userName);
            reply({ ok: true, name: userName });
        });

        socket.on("send", (message, acknowledge) => {
            const reply = typeof acknowledge === "function" ? acknowledge : () => {};
            const userName = users.get(socket.id);
            const safeMessage = normalizeText(message, 1000);

            if (!userName) return reply({ ok: false, error: "not joined" });
            if (!safeMessage) return reply({ ok: false, error: "empty message" });

            socket.broadcast.emit("receive", { message: safeMessage, name: userName });
            reply({ ok: true });
        });

        socket.on("disconnect", () => {
            const userName = users.get(socket.id);
            if (userName) socket.broadcast.emit("left", userName);
            users.delete(socket.id);
        });
    });

    return { app, server, io };
}

if (require.main === module) {
    const port = process.env.PORT || 8000;
    const { server } = createChatServer();
    server.listen(port, () => console.log(`Chat app is running at http://localhost:${port}`));
}

module.exports = { createChatServer };
