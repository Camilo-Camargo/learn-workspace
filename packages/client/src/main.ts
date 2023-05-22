import { io } from "socket.io-client";
import * as THREE from "three"

const socket = io('http://localhost:8080');
socket.emit("message", "Hello");

const CANVAS_ID = "app";
let width = window.innerWidth;
let height = window.innerHeight;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById(CANVAS_ID) as HTMLCanvasElement
});

window.addEventListener("resize", () => {
  width = window.innerWidth;
  height = window.innerHeight;
  renderer.setSize(width, height);
});

renderer.setSize(width, height);

