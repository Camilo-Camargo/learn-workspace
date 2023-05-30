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
const clients: any = {};

io.on("connection", (socket) => {
    socket.emit("id", socket.id);
    clients[socket.id] = {};

    socket.on("update", (location) => {
        clients[socket.id] = {
            position: location.position
        }
        io.emit("clients", clients);
    })

    socket.on("disconnect", () => {
        delete clients[socket.id];
        io.emit("removeClient", socket.id);
    })
});

server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

