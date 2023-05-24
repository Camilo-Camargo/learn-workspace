import { io } from "socket.io-client";
import * as THREE from "three"
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from "stats.js"
import { getRapier } from "./rapier";
import { RigidBody, RigidBodyType } from "@dimforge/rapier3d";

const RAPIER = await getRapier();
const gravity = { x: 0.0, y: -9.81, z: 0.0 };
const world = new RAPIER.World(gravity);

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
  10000
);

const controls = new OrbitControls(camera, renderer.domElement);
const stats = new Stats();
document.body.appendChild(stats.dom);
camera.position.set(0, 2, 2);
controls.update();

window.addEventListener("resize", () => {
  width = window.innerWidth;
  height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

// add floor physic
const floor = new THREE.Mesh(
  new THREE.BoxGeometry(5, 0.25, 5),
  new THREE.MeshBasicMaterial({ color: 'red' })
);
floor.position.set(0, 0, 0);

const floorBodyDesc = new RAPIER.RigidBodyDesc(RigidBodyType.Fixed);
const floorBody = world.createRigidBody(floorBodyDesc);

//@ts-ignore
floorBody.setTranslation({ x: 0, y: 0, z: 0 });
const floorColliderDesc = RAPIER.ColliderDesc.cuboid(2.5, 0.125, 2.5);
world.createCollider(floorColliderDesc, floorBody);
scene.add(floor);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));

const sun = new THREE.DirectionalLight(0xffffff);
sun.position.set(50, 50, 50);
scene.add(sun);

const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshLambertMaterial({ color: 0xff00ff });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 3, 0);
const rigidBodyDesc = new RAPIER.RigidBodyDesc(RigidBodyType.Dynamic)
  .setTranslation(1, 3, 1);
const rigidBody = world.createRigidBody(rigidBodyDesc);
const rigidBodyColliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
const rigidBodyCollider = world.createCollider(rigidBodyColliderDesc, rigidBody);
rigidBodyCollider.setRestitution(1);

scene.add(player);

window.addEventListener("keydown", (e) => {
  const position = rigidBody.translation();
  switch (e.key) {
    case "ArrowUp":
      rigidBody.setTranslation({
        x: position.x,
        y: position.y,
        z: position.z-1
      },true);
      break;
    case "ArrowDown":
      rigidBody.setTranslation({
        x: position.x,
        y: position.y,
        z: position.z+1
      },true);
      break;
    case "ArrowLeft":
      rigidBody.setTranslation({
        x: position.x-1,
        y: position.y,
        z: position.z
      },true);
      break;
    case "ArrowRight":
      rigidBody.setTranslation({
        x: position.x+1,
        y: position.y,
        z: position.z
      },true);
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
    if (!scene.getObjectByName(player)) {
      const newPlayer = new THREE.Mesh(playerGeometry, playerMaterial);
      newPlayer.name = player;
      scene.add(newPlayer);
    } else {
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
  controls.update();
  stats.update();
  world.step();
  const rigidBodyPosition = rigidBody.translation();
  player.position.set(
    rigidBodyPosition.x,
    rigidBodyPosition.y,
    rigidBodyPosition.z
  );
  renderer.render(scene, camera);
  renderer.setClearColor(0xffffff);
}

socket.on("id", (id) => {
  clientId = id;
  gameLoop();
});

