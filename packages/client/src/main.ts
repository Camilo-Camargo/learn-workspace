import { io } from "socket.io-client";
import * as THREE from "three"

const socket = io('http://localhost:8080');

const CANVAS_ID = "app";
let width = window.innerWidth;
let height = window.innerHeight;
let clientId: string; 

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById(CANVAS_ID) as HTMLCanvasElement
});
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  width / height,
  0.1,
  1000
);

window.addEventListener("resize", () => {
  width = window.innerWidth;
  height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

scene.add(new THREE.AmbientLight(0xffffff, 0.5));

const sun = new THREE.DirectionalLight(0xffffff);
sun.position.set(50, 50, 50);
scene.add(sun);

const playerGeometry = new THREE.BoxGeometry(1, 1);
const playerMaterial = new THREE.MeshLambertMaterial({ color: 0xff00ff });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 0, 0);
scene.add(player);

window.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp":
      player.translateZ(-1);
      break;
    case "ArrowDown":
      player.translateZ(1);
      break;
    case "ArrowLeft":
      player.translateX(-1);
      break;
    case "ArrowRight":
      player.translateX(1);
      break;
  }

  socket.emit("update", {
    position: player?.position
  });
});

socket.on("clients", (clients: any) => {
  delete clients[clientId];
  Object.keys(clients).forEach(player => {
    const playerValues = clients[player];
    if(!scene.getObjectByName(player)){
      const newPlayer = new THREE.Mesh(playerGeometry, playerMaterial);
      newPlayer.name = player;
      scene.add(newPlayer);
    }else{
      const newPlayer = scene.getObjectByName(player)!;
      const position = playerValues.position;
      newPlayer.position.set(position.x, position.y, position.z);
    }
  })
})

socket.on("removeClient", (id) => {
  scene.remove(scene.getObjectByName(id)!);
});

renderer.setSize(width, height);
function gameLoop() {
  requestAnimationFrame(gameLoop);
  renderer.render(scene, camera);
  renderer.setClearColor(0xffffff);
}

socket.on("id", (id) => {
  clientId = id;
  gameLoop();
});

