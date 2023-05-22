import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = new http.Server(app);
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

const port = 8080;

io.on("connection", (socket) => {
    socket.on("message", (msg) => {
        console.log(`Socket: ${msg} ${socket.id}`);
    })
});

server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

