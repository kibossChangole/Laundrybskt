import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd97d55);

const aspectRatio = window.innerWidth / window.innerHeight;

const camera = new THREE.PerspectiveCamera(
  aspectRatio > 1.6 ? 50 : 60, // narrower FOV on wide screens, wider on tall/mobile
  aspectRatio,
  0.1,
  1000,
);

camera.position.set(0, 3, 6);

function getDynamicFOV() {
  const aspect = window.innerWidth / window.innerHeight;
  if (aspect > 2.0) return 45; // ultrawide
  if (aspect > 1.6) return 50; // widescreen 16:9
  if (aspect > 1.0) return 60; // standard
  return 75; // portrait / mobile
}

window.addEventListener("resize", () => {
  const aspect = window.innerWidth / window.innerHeight;
  getDynamicFOV();
  camera.aspect = aspect;
  camera.fov = aspect > 1.6 ? 50 : 60;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

//Card divs

const label = document.getElementById("card-label")!;

// Renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Limit vertical orbit
controls.minPolarAngle = Math.PI * 0.1;
controls.maxPolarAngle = Math.PI * 0.4;

// Lock horizontal rotation completely
controls.minAzimuthAngle = 0.0;
controls.maxAzimuthAngle = 0.0;

controls.enableZoom = false; 

// =====================
// LIGHTING
// =====================

// Ambient Light
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);

// Main Key Light
const directionalLight = new THREE.DirectionalLight(0xffffff, 3);

directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;

directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;

scene.add(directionalLight);

// Fill Light
const fillLight = new THREE.DirectionalLight(0xffffff, 1.5);

fillLight.position.set(-5, 5, 5);
scene.add(fillLight);

// Rim Light
const rimLight = new THREE.DirectionalLight(0xffffff, 2);

rimLight.position.set(0, 4, -6);
scene.add(rimLight);

// Optional Hemisphere Light
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);

scene.add(hemiLight);

// =====================
// GROUND
// =====================

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.ShadowMaterial({
    opacity: 0.25,
  }),
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -1;

ground.receiveShadow = true;

scene.add(ground);

// =====================
// MODEL LOADER
// =====================

const loader = new GLTFLoader();

// Track cards and selected state
const cards: THREE.Mesh[] = [];
let selectedCard: THREE.Mesh | null = null;
let isAnimating = false;

// Store original positions/rotations to restore on deselect
const originalStates = new Map<
  THREE.Mesh,
  { position: THREE.Vector3; rotation: THREE.Euler }
>();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

loader.load(
  "/scene.gltf",

  (gltf) => {
    const model = gltf.scene;

    model.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());

    model.position.sub(center);
    model.position.z = 0;
    model.rotation.y = Math.PI / 2;

    scene.add(model);

    // =====================
    // VINYL CARDS
    // =====================

    const basketBox = new THREE.Box3().setFromObject(model);
    const basketSize = basketBox.getSize(new THREE.Vector3());
    const basketCenter = basketBox.getCenter(new THREE.Vector3());

    const cardSize = basketSize.x * 0.75;
    const cardThickness = 0.015;
    const stackBaseY = basketBox.min.y + basketSize.y * 0.01;
    const leanAngle = Math.PI * -0.1;
    const cardColors = [
      0x5a9cb5, 0xface68, 0xfaac68, 0xfa6868, 0xb1c29e, 0xffb4a2,
    ];

    for (let i = 0; i < 6; i++) {
      const geometry = new THREE.BoxGeometry(cardSize, cardSize, cardThickness);
      const material = new THREE.MeshStandardMaterial({
        color: cardColors[i],
        roughness: 0.4,
        metalness: 0.1,
      });

      const card = new THREE.Mesh(geometry, material);
      card.castShadow = true;
      card.receiveShadow = true;

      const pos = new THREE.Vector3(
        basketCenter.x,
        stackBaseY + cardSize / 2 + i * 0.15,
        basketCenter.z - i * (cardSize * 0.2) + 0.7,
      );

      card.position.copy(pos);
      card.rotation.x = leanAngle;

      // Save original state
      originalStates.set(card, {
        position: pos.clone(),
        rotation: card.rotation.clone(),
      });

      cards.push(card);
      scene.add(card);
    }

    console.log("Model loaded");
  },

  (xhr) => {
    console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
  },

  (error) => {
    console.error(error);
  },
);

// =====================
// ANIMATION HELPERS
// =====================

function lerpVector3(
  current: THREE.Vector3,
  target: THREE.Vector3,
  alpha: number,
) {
  current.lerp(target, alpha);
}

// Raised position — above the basket, upright, facing camera
function getRaisedPosition(): THREE.Vector3 {
  return new THREE.Vector3(0, 2.5, 1.5);
}

function getRaisedCameraTarget(): THREE.Vector3 {
  return new THREE.Vector3(0, 2.5, 1.5);
}

function getBasketCameraTarget(): THREE.Vector3 {
  return new THREE.Vector3(0, 0, 0);
}

// =====================
// CLICK HANDLER
// =====================

const cardClickCount = new Map<THREE.Mesh, number>();
let cardRotationY = 0;
let isExpanded = false;

// Back button
const backButton = document.getElementById("back-button")!;
backButton.addEventListener("click", () => {
  if (selectedCard) {
    cardClickCount.set(selectedCard, 0);
    deselect();
  }
});

window.addEventListener("click", (event) => {
  // Ignore clicks on the back button
  if ((event.target as HTMLElement).id === "back-button") return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(cards);

  if (hits.length > 0) {
    const clicked = hits[0].object as THREE.Mesh;
    const count = cardClickCount.get(clicked) ?? 0;
    const next = count + 1;

    if (next === 1) {
      cardClickCount.set(clicked, 1);
      select(clicked);
      label.style.opacity = "1";
      label.style.pointerEvents = "auto"; // <-- ADD THIS: enables scrolling when visible
      label.innerHTML = ``;
    } else if (next === 2) {
      cardClickCount.set(clicked, 2);
      isExpanded = true;
      isAnimating = true;

      // --- ADDED/CHANGED FOR THE SECOND CLICK ---

      setTimeout(() => {
        // Only update if the user hasn't quickly clicked away/deselected in those few ms
        if (selectedCard === clicked && isExpanded) {
          label.style.opacity = "1";
          label.style.pointerEvents = "auto";
          label.innerHTML = `<h3>Card ${cards.indexOf(clicked) + 1}</h3><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>`;
        }
      }, 300); // <-- 300 milliseconds delay. Change this number to tweak the timing!

      // ------------------------------------------

      backButton.style.opacity = "1";
      backButton.style.pointerEvents = "auto";
    }
  } else {
    if (selectedCard && !isExpanded) {
      cardClickCount.set(selectedCard, 0);
      deselect();
    }
  }
});

function select(card: THREE.Mesh) {
  selectedCard = card;
  isAnimating = true;
  isExpanded = false;
  cardRotationY = 0;
  card.rotation.y = 0;
  card.rotation.z = 0;
  controls.enableRotate = false;
  controls.enableZoom = false;

  label.style.opacity = "0";
  label.style.pointerEvents = "none"; // <-- ADD THIS: keeps it unclickable on click 1
  label.innerHTML = "";
}

function deselect() {
  if (selectedCard) {
    selectedCard.rotation.y = 0;
    selectedCard.rotation.z = 0;
    cardClickCount.set(selectedCard, 0); // Reset the click tracker for this card
  }
  cardRotationY = 0;
  isExpanded = false;
  selectedCard = null;
  isAnimating = true;
  controls.enableRotate = true;
  controls.enableZoom = true;

  label.style.opacity = "0";
  label.style.pointerEvents = "none"; // <-- ADD THIS: disables interaction when closed
  label.innerHTML = "";

  backButton.style.opacity = "0";
  backButton.style.pointerEvents = "none";
}

// =====================
// ANIMATION LOOP
// =====================

const lerpAlpha = 0.08;

// How close to camera the card flies when expanded
function getExpandedPosition(): THREE.Vector3 {
  return new THREE.Vector3(0, 3, 3);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  if (isAnimating) {
    let stillMoving = false;

    cards.forEach((card) => {
      const orig = originalStates.get(card)!;
      const clickCount = cardClickCount.get(card) ?? 0;

      if (card === selectedCard) {
        lerpVector3(controls.target, getRaisedCameraTarget(), lerpAlpha);

        if (clickCount === 1) {
          // Slide up
          lerpVector3(card.position, getRaisedPosition(), lerpAlpha);
          card.rotation.x += (-0.3 - card.rotation.x) * lerpAlpha;
          card.rotation.y += (0 - card.rotation.y) * lerpAlpha;

          if (card.position.distanceTo(getRaisedPosition()) > 0.01)
            stillMoving = true;
        } else if (clickCount === 2) {
          // Fly toward camera and fill view
          const expandedPos = getExpandedPosition();
          lerpVector3(card.position, expandedPos, lerpAlpha);
          card.rotation.x += (-0.27 - card.rotation.x) * lerpAlpha;
          card.rotation.y += (0 - card.rotation.y) * lerpAlpha;
          card.rotation.z += (0 - card.rotation.z) * lerpAlpha;

          // Scale up to fill canvas
          const targetScaley = 3;
          const targetScalex = 4;
          card.scale.x += (targetScalex - card.scale.x) * lerpAlpha;
          card.scale.y += (targetScaley - card.scale.y) * lerpAlpha;

          if (card.position.distanceTo(expandedPos) > 0.01) stillMoving = true;
        }

        const pos = card.position.clone();
        pos.project(camera);
        const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-pos.y * 0.5 + 0.5) * window.innerHeight;
        label.style.left = `${x}px`;
        label.style.top = `${y - 100}px`;
      } else {
        lerpVector3(card.position, orig.position, lerpAlpha);
        card.rotation.x += (orig.rotation.x - card.rotation.x) * lerpAlpha;
        card.rotation.y += (orig.rotation.y - card.rotation.y) * lerpAlpha;
        card.rotation.z += (orig.rotation.z - card.rotation.z) * lerpAlpha;

        // Reset scale
        card.scale.x += (1 - card.scale.x) * lerpAlpha;
        card.scale.y += (1 - card.scale.y) * lerpAlpha;

        if (card.position.distanceTo(orig.position) > 0.01) stillMoving = true;
      }
    });

    if (!selectedCard) {
      lerpVector3(controls.target, getBasketCameraTarget(), lerpAlpha);
    }

    if (!stillMoving) isAnimating = false;
  }

  renderer.render(scene, camera);
}

animate();
