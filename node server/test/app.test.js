const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const { io: createClient } = require("socket.io-client");
const { createChatServer } = require("../app");

let server;
let baseUrl;
const clients = [];

const connect = () => new Promise((resolve, reject) => {
    const client = createClient(baseUrl, { transports: ["websocket"], forceNew: true });
    clients.push(client);
    client.once("connect", () => resolve(client));
    client.once("connect_error", reject);
});

const nextEvent = (client, event) => new Promise(resolve => client.once(event, resolve));
const emitAck = (client, event, value) => new Promise(resolve => client.emit(event, value, resolve));

before(async () => {
    ({ server } = createChatServer());
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    clients.forEach(client => client.disconnect());
    await new Promise(resolve => server.close(resolve));
});

test("serves the chat page and its browser assets", async () => {
    for (const resource of ["/", "/client.js", "/style.css"]) {
        const response = await fetch(`${baseUrl}${resource}`);
        assert.equal(response.status, 200, `${resource} should load`);
    }
});

test("announces joined users and delivers validated messages", async () => {
    const alice = await connect();
    assert.deepEqual(await emitAck(alice, "new-user-joined", "Alice"), { ok: true, name: "Alice" });

    const bob = await connect();
    const joined = nextEvent(alice, "user-joined");
    assert.deepEqual(await emitAck(bob, "new-user-joined", " Bob "), { ok: true, name: "Bob" });
    assert.equal(await joined, "Bob");

    const received = nextEvent(alice, "receive");
    assert.deepEqual(await emitAck(bob, "send", "  Hello Alice  "), { ok: true });
    assert.deepEqual(await received, { name: "Bob", message: "Hello Alice" });
    assert.deepEqual(await emitAck(bob, "send", "   "), { ok: false, error: "empty message" });
    assert.deepEqual(await emitAck(bob, "new-user-joined", "Bob"), { ok: false, error: "already joined" });
});

test("rejects messages from users that have not joined", async () => {
    const stranger = await connect();
    assert.deepEqual(await emitAck(stranger, "send", "Hello"), { ok: false, error: "not joined" });
});
