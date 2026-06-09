import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

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

camera.position.set(0, 2.5, 6);

function getDynamicFOV() {
  const aspect = window.innerWidth / window.innerHeight;
  if (aspect > 2.0) return 45; // ultrawide
  if (aspect > 1.6) return 50; // widescreen 16:9
  if (aspect > 1.0) return 60; // standard
  return 75; // portrait / mobile
}

window.addEventListener("resize", () => {
  const aspect = window.innerWidth / window.innerHeight;
  const maxPixelRatio = getMaxPixelRatio();
  camera.aspect = aspect;
  camera.fov = getDynamicFOV();
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  dynamicPixelRatio = Math.min(dynamicPixelRatio, maxPixelRatio);
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, dynamicPixelRatio, maxPixelRatio),
  );
  directionalLight.shadow.mapSize.width = window.innerWidth < 768 ? 1024 : 2048;
  directionalLight.shadow.mapSize.height = window.innerWidth < 768 ? 1024 : 2048;
  directionalLight.shadow.map?.dispose();
  renderer.shadowMap.needsUpdate = true;
  lerpAlpha = getLerpAlphaForViewport();
});

//Card divs

const label = document.getElementById("card-label")!;

function getMaxPixelRatio() {
  return window.innerWidth < 768 ? 1.5 : 2;
}

function getLerpAlphaForViewport() {
  return window.innerWidth < 768 ? 0.16 : 0.08;
}

const MIN_PIXEL_RATIO = 1;
let dynamicPixelRatio = Math.min(window.devicePixelRatio, getMaxPixelRatio());

// Renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance",
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(dynamicPixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
// Update shadow map only when scene/light/camera changes.
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;

document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.addEventListener("change", () => {
  renderer.shadowMap.needsUpdate = true;
});

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
directionalLight.shadow.mapSize.width = window.innerWidth < 768 ? 1024 : 2048;
directionalLight.shadow.mapSize.height = window.innerWidth < 768 ? 1024 : 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 25;
const d = 6;
directionalLight.shadow.camera.left = -d;
directionalLight.shadow.camera.right = d;
directionalLight.shadow.camera.top = d;
directionalLight.shadow.camera.bottom = -d;
directionalLight.shadow.bias = -0.0005;

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
      cardIndexMap.set(card, i + 1);
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

// =====================
// CLICK HANDLER
// =====================

const cardClickCount = new Map<THREE.Mesh, number>();
const cardIndexMap = new Map<THREE.Mesh, number>();
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
  // Ignore clicks on the back button or elements inside it
  const targetElement = event.target as HTMLElement;
  if (
    targetElement.id === "back-button" ||
    targetElement.closest("#back-button")
  )
    return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(cards);

  if (hits.length > 0) {
    const clicked = hits[0].object as THREE.Mesh;

    if (selectedCard && selectedCard !== clicked) {
      cardClickCount.set(selectedCard, 0);
      deselect();
    }

    const currentCount = cardClickCount.get(clicked) ?? 0;

    if (currentCount === 0) {
      cardClickCount.set(clicked, 1);
      select(clicked); // Keeps label hidden on first click
    } else if (currentCount === 1) {
      cardClickCount.set(clicked, 2);
      isExpanded = true;
      isAnimating = true;

      // Set fullscreen bounds once; avoid layout writes in animate().
      label.style.position = "fixed";
      label.style.top = "0";
      label.style.left = "0";
      label.style.width = "100vw";
      label.style.height = "100vh";
      label.style.transform = "none";

      setTimeout(() => {
        if (selectedCard === clicked && isExpanded) {
          label.style.opacity = "1";
          label.style.pointerEvents = "auto";
          label.innerHTML = `
  <div class="parallax-wrapper" style="
    position: relative;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    border-radius: 0px;
    -webkit-overflow-scrolling: touch;
  ">
    <div class="carousel-bg" style="
      position: sticky;
      top: 0;
      left: 0;
      width: 100%;
      height: 74vh; /* Takes up exactly half of the device viewport height */
      z-index: 1;
      overflow: hidden;
      pointer-events: none;
    ">
      <div class="carousel-track" style="display: flex; width: 300%; height: 100%; animation: carouselScroll 12s infinite ease-in-out;">
        <div style="width: 100%; height: 100%; background: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4)), url('https://picsum.photos/id/10/1200/800') center/cover no-repeat;"></div>
        <div style="width: 100%; height: 100%; background: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4)), url('https://picsum.photos/id/11/1200/800') center/cover no-repeat;"></div>
        <div style="width: 100%; height: 100%; background: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4)), url('https://picsum.photos/id/12/1200/800') center/cover no-repeat;"></div>
      </div>
    </div>

    <div class="scroll-content" style="
      position: relative;
      z-index: 2;
      margin-top: -15vh; /* Pulls text section up over the viewport carousel */
      background: #ffffff;
      color: #1e1e1e;
      padding: 3rem 2rem;
      min-height: 60vh;
      box-shadow: 0 -15px 30px rgba(0,0,0,0.5);
      box-sizing: border-box;
         border-radius: 0px 120px 0px 0;
    ">
      <div style="max-width: 600px; margin: 0 auto;">
        <h3 style="margin-top: 0; font-size: 2.2rem; margin-bottom: 1.5rem;">Card ${cardIndexMap.get(clicked) ?? 1}</h3>
        <p style="font-size: 1.1rem; line-height: 1.7; color: #ccc; margin-bottom: 1.5rem;">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
        <p style="font-size: 1.1rem; line-height: 1.7; color: #ccc;">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
        <div style="height: 150px;"></div>
      </div>
    </div>
  </div>

  <style>
    @keyframes carouselScroll {
      0%, 25%   { transform: translateX(0); }
      33%, 58%  { transform: translateX(-33.33%); }
      66%, 91%  { transform: translateX(-66.66%); }
      100%      { transform: translateX(0); }
    }
  </style>
`;
        }
      }, 300);

      backButton.style.opacity = "1";
      backButton.style.pointerEvents = "auto";
    }
  } else {
    if (selectedCard) {
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
  label.style.pointerEvents = "none";
  label.style.position = "absolute";
  label.style.width = "auto";
  label.style.height = "auto";
  label.style.top = "0";
  label.style.left = "0";
  label.style.transform = "translate3d(-50%, -50%, 0)";
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
  label.style.pointerEvents = "none";
  label.style.position = "absolute";
  label.style.width = "auto";
  label.style.height = "auto";
  label.style.top = "0";
  label.style.left = "0";
  label.style.transform = "translate3d(-50%, -50%, 0)";
  label.innerHTML = "";

  backButton.style.opacity = "0";
  backButton.style.pointerEvents = "none";
}

// =====================
// ANIMATION LOOP
// =====================

let lerpAlpha = getLerpAlphaForViewport();
const RAISED_POSITION = new THREE.Vector3(0, 2.5, 1.5);
const RAISED_CAMERA_TARGET = new THREE.Vector3(0, 2.5, 1.5);
const BASKET_CAMERA_TARGET = new THREE.Vector3(0, 0, 0);
const EXPANDED_POSITION = new THREE.Vector3(0, 3, 3);
const projectedPos = new THREE.Vector3();

let lastFrameTime = performance.now();
let frameSampleAccum = 0;
let frameSampleCount = 0;
let adaptiveCooldown = 0;

function tunePixelRatio(frameMs: number) {
  frameSampleAccum += frameMs;
  frameSampleCount += 1;

  if (frameSampleCount < 30) return;
  if (adaptiveCooldown > 0) {
    adaptiveCooldown -= 1;
    frameSampleAccum = 0;
    frameSampleCount = 0;
    return;
  }

  const avgFrameMs = frameSampleAccum / frameSampleCount;
  const maxPixelRatio = getMaxPixelRatio();
  let nextPixelRatio = dynamicPixelRatio;

  // Reduce GPU load when sustained frame time rises; recover quality slowly.
  if (avgFrameMs > 19) nextPixelRatio -= 0.1;
  if (avgFrameMs < 14 && dynamicPixelRatio < maxPixelRatio) nextPixelRatio += 0.05;

  nextPixelRatio = THREE.MathUtils.clamp(
    nextPixelRatio,
    MIN_PIXEL_RATIO,
    maxPixelRatio,
  );

  if (Math.abs(nextPixelRatio - dynamicPixelRatio) >= 0.025) {
    dynamicPixelRatio = nextPixelRatio;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, dynamicPixelRatio));
    renderer.shadowMap.needsUpdate = true;
    adaptiveCooldown = 2;
  }

  frameSampleAccum = 0;
  frameSampleCount = 0;
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
        lerpVector3(controls.target, RAISED_CAMERA_TARGET, lerpAlpha);

        if (clickCount === 1) {
          // Slide up
          lerpVector3(card.position, RAISED_POSITION, lerpAlpha);
          card.rotation.x += (-0.3 - card.rotation.x) * lerpAlpha;
          card.rotation.y += (0 - card.rotation.y) * lerpAlpha;

          if (card.position.distanceTo(RAISED_POSITION) > 0.01)
            stillMoving = true;
        } else if (clickCount === 2) {
          // Fly toward camera and fill view
          lerpVector3(card.position, EXPANDED_POSITION, lerpAlpha);
          card.rotation.x += (-0.27 - card.rotation.x) * lerpAlpha;
          card.rotation.y += (0 - card.rotation.y) * lerpAlpha;
          card.rotation.z += (0 - card.rotation.z) * lerpAlpha;

          // Scale up to fill canvas
          const targetScaley = 3;
          const targetScalex = 4;
          card.scale.x += (targetScalex - card.scale.x) * lerpAlpha;
          card.scale.y += (targetScaley - card.scale.y) * lerpAlpha;

          if (card.position.distanceTo(EXPANDED_POSITION) > 0.01)
            stillMoving = true;
        }

        // Keep per-frame DOM writes minimal: only update tracked position on click 1.
        if (clickCount === 1) {
          projectedPos.copy(card.position).project(camera);
          const x = (projectedPos.x * 0.5 + 0.5) * window.innerWidth;
          const y = (-projectedPos.y * 0.5 + 0.5) * window.innerHeight;
          label.style.transform = `translate3d(calc(${x}px - 50%), calc(${y - 100}px - 50%), 0)`;
        }
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
      lerpVector3(controls.target, BASKET_CAMERA_TARGET, lerpAlpha);
    }

    renderer.shadowMap.needsUpdate = true;
    if (!stillMoving) isAnimating = false;
  }

  const now = performance.now();
  const frameMs = now - lastFrameTime;
  lastFrameTime = now;
  tunePixelRatio(frameMs);

  renderer.render(scene, camera);
}

animate();
