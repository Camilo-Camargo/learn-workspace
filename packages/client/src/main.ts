import { io } from "socket.io-client";
import * as THREE from "three"
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from "stats.js"
import { getRapier } from "./rapier";
import { Collider, RigidBody, RigidBodyType, Vector } from "@dimforge/rapier3d";

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

class Player {
  geometry: THREE.BoxGeometry;
  material: THREE.MeshLambertMaterial;
  mesh: THREE.Mesh
  rigidBody: RigidBody;
  collider: Collider;
  constructor() {
    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    this.material = new THREE.MeshLambertMaterial({ color: 0xff00ff });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(0, 3, 0);

    // add physics
    const rigidBodyDesc = new RAPIER.RigidBodyDesc(RigidBodyType.Dynamic)
      .setTranslation(1, 3, 1);
    this.rigidBody = world.createRigidBody(rigidBodyDesc);
    const rigidBodyColliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
    this.collider = world.createCollider(rigidBodyColliderDesc, this.rigidBody);
    this.collider.setRestitution(1);
  }

  gameKeyboard() {
    window.addEventListener("keydown", (e) => {
      const playerPosition = this.rigidBody.translation();
      const vector: Vector = playerPosition;

      switch (e.key) {
        case "ArrowUp":
          vector.z = vector.z - 1;
          break;
        case "ArrowDown":
          vector.z = vector.z + 1;
          break;
        case "ArrowLeft":
          vector.x = vector.x - 1;
          break;
        case "ArrowRight":
          vector.x = vector.x + 1;
          break;
      }
      this.updatePosition(vector);
    });
  }

  updatePosition(vector: Vector) {
    this.rigidBody.setTranslation(vector, true);
    this.mesh.position.set(vector.x, vector.y, vector.z);
  }

  update() {
    const position = this.rigidBody.translation();
    this.mesh.position.set(position.x, position.y, position.z);
    socket.emit("update", {
      position: position
    });

  }
}

const clients: any = {};

const player = new Player();
scene.add(player.mesh);

socket.on("clients", (newClients: any) => {
  delete newClients[clientId];
  Object.keys(newClients).forEach(playerId => {
    const player: Player | undefined = clients[playerId];
    if (!player) {
      const newPlayer = new Player();
      clients[playerId] = newPlayer;
      newPlayer.mesh.name = playerId;
      scene.add(newPlayer.mesh);
      newPlayer.update();
    }
  })
})

socket.on("removeClient", (playerId) => {
  world.removeCollider(clients[playerId], true);
});


player.gameKeyboard();
renderer.setSize(width, height);
function gameLoop() {
  requestAnimationFrame(gameLoop);
  controls.update();
  stats.update();
  world.step();
  Object.values(clients).forEach((player: any) => {
    if (player) {
      player.update();
      console.log(player);
    }
  });
  renderer.render(scene, camera);
  renderer.setClearColor(0xffffff);
}

socket.on("id", (id) => {
  clientId = id;
  clients[clientId] = player;
});

gameLoop();

