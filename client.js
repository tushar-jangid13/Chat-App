const socket = io();

const form = document.getElementById("send-container");
const messageInput = document.getElementById("msgInput");
const sendButton = form.querySelector("button[type='submit']");
const joinForm = document.getElementById("join-form");
const joinRow = document.getElementById("joinRow");
const nameInput = document.getElementById("nameInput");
const joinButton = joinForm.querySelector("button[type='submit']");
const messageContainer = document.querySelector(".chat-window");
const emptyState = document.getElementById("emptyState");
const connectionStatus = document.getElementById("connectionStatus");
let name = "";
let sending = false;
let joining = false;

const setComposerEnabled = enabled => {
    messageInput.disabled = !enabled;
    sendButton.disabled = !enabled;
};

const setJoinEnabled = enabled => {
    nameInput.disabled = !enabled;
    joinButton.disabled = !enabled;
};

const showEmptyState = text => {
    if (!messageContainer.querySelector(".message")) {
        emptyState.textContent = text;
        if (!emptyState.isConnected) messageContainer.append(emptyState);
    }
};

const append = (message, position) => {
    const messageElement = document.createElement("div");
    messageElement.textContent = message;
    messageElement.classList.add("message", position);
    emptyState.remove();
    messageContainer.append(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;
};

const acknowledge = (event, value) => new Promise(resolve => socket.emit(event, value, resolve));

const joinChat = async () => {
    if (!socket.connected || joining) return false;

    joining = true;
    setJoinEnabled(false);
    const result = await acknowledge("new-user-joined", name);
    joining = false;

    if (!result?.ok) {
        connectionStatus.textContent = "Could not join the chat. Please try again.";
        setJoinEnabled(true);
        return false;
    }

    joinRow.hidden = true;
    setComposerEnabled(true);
    messageInput.focus();
    connectionStatus.textContent = `Connected as ${result.name}`;
    showEmptyState("No messages yet. Say hello!");
    return true;
};

socket.on("connect", async () => {
    if (name) {
        await joinChat();
        return;
    }

    connectionStatus.textContent = "Connected. Enter your name to join.";
    setJoinEnabled(true);
    nameInput.focus();
});

socket.on("disconnect", () => {
    sending = false;
    setComposerEnabled(false);
    setJoinEnabled(false);
    connectionStatus.textContent = "Disconnected. Trying to reconnect…";
});

socket.on("connect_error", () => {
    setComposerEnabled(false);
    setJoinEnabled(false);
    connectionStatus.textContent = "Could not reach the chat server. Start it with npm start.";
});

joinForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!socket.connected || joining) return;

    name = nameInput.value.trim().slice(0, 40) || "Guest";
    await joinChat();
});

socket.on("user-joined", userName => append(`${userName} joined the chat`, "event"));

socket.on("receive", data => {
    if (data && typeof data.name === "string" && typeof data.message === "string") {
        append(`${data.name}: ${data.message}`, "left");
    }
});

socket.on("left", userName => {
    if (userName) append(`${userName} left the chat`, "event");
});

form.addEventListener("submit", async event => {
    event.preventDefault();
    const message = messageInput.value.trim();
    if (!message || !socket.connected || sending) return;

    sending = true;
    setComposerEnabled(false);
    const result = await acknowledge("send", message);
    sending = false;

    if (result?.ok) {
        append(`You: ${message}`, "right");
        messageInput.value = "";
    } else {
        connectionStatus.textContent = "Message was not sent. Please try again.";
    }

    if (socket.connected) setComposerEnabled(true);
    messageInput.focus();
});
