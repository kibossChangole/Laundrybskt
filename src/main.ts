import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { cardDataManifest } from "./manifest";

// Scene
const scene = new THREE.Scene();
const textureLoader = new THREE.TextureLoader();

const colorHex = "#c24814ff"; // target color
const markerColor = 0xffffff; // marker color

//
/// WHITE CIRCLE MARKING
//

textureLoader.load("/roughconcretetexture.jpg", (loadedTexture) => {
  // 1. Optimize texture mapping for a painted look
  loadedTexture.wrapS = THREE.RepeatWrapping;
  loadedTexture.wrapT = THREE.RepeatWrapping;
  loadedTexture.repeat.set(5, 5);

  // 2. Define Geometries
  const innerRadius = 5;
  const outerRadius = 6;
  const thetaSegments = 128;
  const phiSegments = 1;
  const thetaStart = 0;
  const thetaLength = 2 * Math.PI;

  const ringGeometry = new THREE.RingGeometry(
    innerRadius,
    outerRadius,
    thetaSegments,
    phiSegments,
    thetaStart,
    thetaLength,
  );

  const lineWidth = outerRadius - innerRadius - 0.2;
  const lineHeight = outerRadius * 5; // 48 units long!
  const lineGeometry = new THREE.PlaneGeometry(lineWidth, lineHeight);

  // 3. Create Custom Shader Logic function (so we can apply it to both materials)
  const applyBadPaintShader = (shader: any) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      `
      float paintNoise = texture2D(map, vMapUv).r;
      if (paintNoise < 0.65) {
          discard;
      }
      gl_FragColor.a *= smoothstep(0.2, 0.5, paintNoise);
      #include <opaque_fragment>
      `,
    );
  };

  // 4. Material for the RING (Stays at 1, 1 repeat)
  const ringMaterial = new THREE.MeshStandardMaterial({
    color: markerColor,
    map: loadedTexture,
    roughness: 0.1,
    metalness: 0.1,
    transparent: false,
    opacity: 0.9,
    side: THREE.DoubleSide,
  });
  ringMaterial.onBeforeCompile = applyBadPaintShader;

  // 5. Material for the LINE (Cloned, with high texture repetition to stop the stretching)
  const lineMaterial = ringMaterial.clone();

  // Clone the texture map so we don't accidentally change the ring's texture scale
  lineMaterial.map = loadedTexture.clone();
  lineMaterial.map.needsUpdate = true;

  // Stretch the texture 1 time wide, but repeat it 8 times along its 48-unit length!
  lineMaterial.map.repeat.set(1, 8);

  // Re-link the custom shader to the cloned material
  lineMaterial.onBeforeCompile = applyBadPaintShader;

  // 6. Combine into Meshes using their respective materials
  const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
  const lineMesh = new THREE.Mesh(lineGeometry, lineMaterial);

  // Offset the line slightly on local Z so it doesn't Z-fight or overlap cleanly with the ring
  lineMesh.position.z = -0.001;

  // Create group
  const basketballMarkingGroup = new THREE.Group();
  basketballMarkingGroup.add(ringMesh);
  basketballMarkingGroup.add(lineMesh);

  // Positioning and Orientation
  basketballMarkingGroup.rotation.x = -Math.PI / 2;
  basketballMarkingGroup.position.set(0, -0.8, 0);

  scene.add(basketballMarkingGroup);
});

//
//ROUGH TEXTURED BACKGROUND
//

// 1. Load your seamless rough grayscale texture
textureLoader.load("/roughconcretetexture.jpg", (loadedTexture) => {
  const image = loadedTexture.image;

  // 2. Create an off-screen canvas matching the image size
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d")!;

  // 3. Draw the rough texture onto the canvas first
  ctx.drawImage(image, 0, 0);

  // 4. Use 'multiply' blend mode to bake the color into the texture
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 5. Reset composite operation back to normal
  ctx.globalCompositeOperation = "source-over";

  // 6. Convert the tinted canvas into a Three.js texture
  const tintedTexture = new THREE.CanvasTexture(canvas);

  // 7. Make it repeat seamlessly across the background
  tintedTexture.wrapS = THREE.RepeatWrapping;
  tintedTexture.wrapT = THREE.RepeatWrapping;
  tintedTexture.repeat.set(6, 4); // Adjust to make the roughness tighter or larger

  // 8. Apply to your scene
  scene.background = tintedTexture;
});

//aspect ratio and field of view
const aspectRatio = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera(
  aspectRatio > 1.6 ? 50 : 60, // narrower FOV on wide screens, wider on tall/mobile
  aspectRatio,
  0.1,
  1000,
);

camera.position.set(0, 4, 4.5);

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
  directionalLight.shadow.mapSize.height =
    window.innerWidth < 768 ? 1024 : 2048;
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
controls.minPolarAngle = Math.PI * 0.2;
controls.maxPolarAngle = Math.PI * 0.2;

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
// TEXTURE SELECTION RESOURCE ARRAY
// =====================
// Files in public/ are served from root "/" directly without writing out the public folder name
const cardTextures = [
  "/kanban.png",
  "/gt3rs.png",
  "https://picsum.photos/id/12/800/800",
  "https://picsum.photos/id/13/800/800",
  "https://picsum.photos/id/14/800/800",
  "https://picsum.photos/id/15/800/800",
];

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
    // VINYL CARDS GENERATOR LOOP (RESTORED)
    // =====================

    const basketBox = new THREE.Box3().setFromObject(model);
    const basketSize = basketBox.getSize(new THREE.Vector3());
    const basketCenter = basketBox.getCenter(new THREE.Vector3());

    const cardSize = basketSize.x * 0.75;
    const cardThickness = 0.015;
    const stackBaseY = basketBox.min.y + basketSize.y * 0.01;
    const leanAngle = Math.PI * -0.1;

    for (let i = 0; i < 6; i++) {
      const geometry = new THREE.BoxGeometry(cardSize, cardSize, cardThickness);

      // Get the dedicated data object for this index
      const currentManifest = cardDataManifest[i];

      // Load texture using our new manifest structure
      const texture = textureLoader.load(currentManifest.coverMeshTexture);
      texture.colorSpace = THREE.SRGBColorSpace;

      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.4,
        metalness: 0.1,
      });

      const card = new THREE.Mesh(geometry, material);
      card.castShadow = true;
      card.receiveShadow = true;

      // --- THE SECRET SAUCE ---
      // Store the entire data config directly on the 3D object userData property
      card.userData = currentManifest;

      const pos = new THREE.Vector3(
        basketCenter.x,
        stackBaseY + cardSize / 2 + i * 0.15,
        basketCenter.z - i * (cardSize * 0.2) + 0.7,
      );

      card.position.copy(pos);
      card.rotation.x = leanAngle;

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
let isGameViewActive = false;
let isGameViewTransitioning = false;
const GAME_VIEW_TRANSITION_MS = 850;

// Back button
const backButton = document.getElementById("back-button")!;
backButton.addEventListener("click", () => {
  if (selectedCard) {
    cardClickCount.set(selectedCard, 0);
    deselect();
  }
});

window.addEventListener("click", (event) => {
  if (isGameViewActive || isGameViewTransitioning) return;

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
      select(clicked);
    } else if (currentCount === 1) {
      cardClickCount.set(clicked, 2);
      isExpanded = true;
      isAnimating = true;

      // Unpack all of our custom data from the clicked 3D mesh!
      const data = clicked.userData;

      label.style.position = "fixed";
      label.style.top = "0";
      label.style.left = "0";
      label.style.width = "100vw";
      label.style.height = "101vh";
      label.style.transform = "translate3d(0px, 0px, 0px)";

      setTimeout(() => {
        if (selectedCard === clicked && isExpanded) {
          label.style.opacity = "1";
          label.style.pointerEvents = "auto";

          const carouselImages =
            Array.isArray(data.carouselImages) && data.carouselImages.length > 0
              ? data.carouselImages
              : [data.coverMeshTexture];
          const slideCount = carouselImages.length;
          const trackWidth = `${slideCount * 100}%`;
          const animationDuration = Math.max(slideCount * 4, 12);
          const slideMarkup = carouselImages
            .map(
              (imagePath: string, index: number) => `
        <div class="carousel-slide">
          <img
            class="carousel-image"
            src="${imagePath}"
            alt="${data.title} preview ${index + 1}"
            loading="lazy"
            decoding="async"
            draggable="false"
          />
          <div class="carousel-overlay"></div>
        </div>`,
            )
            .join("");

          const keyframeSteps: string[] = [];
          if (slideCount > 1) {
            const segment = 100 / slideCount;
            for (let i = 0; i < slideCount; i += 1) {
              const start = i * segment;
              const holdEnd = Math.min(start + segment * 0.72, 99.5);
              const offset = -i * (100 / slideCount);
              keyframeSteps.push(
                `${start.toFixed(2)}%, ${holdEnd.toFixed(2)}% { transform: translateX(${offset}%); }`,
              );
            }
            keyframeSteps.push("100% { transform: translateX(0%); }");
          }

          // Dynamically read from our custom manifest keys
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
      height: 74vh;
      z-index: 1;
      overflow: hidden;
      pointer-events: none;
    ">
      <div class="carousel-track" style="display: flex; width: ${trackWidth}; height: 100%; ${slideCount > 1 ? `animation: carouselScroll ${animationDuration}s infinite ease-in-out;` : ""}">
        ${slideMarkup}
      </div>
    </div>

    <div class="scroll-content" style="
      position: relative;
      z-index: 2;
      margin-top: -15vh;
      background: #ffffff;
      color: #1e1e1e;
      padding: 3rem 2rem;
      min-height: 60vh;
      box-shadow: 0 -15px 30px rgba(0,0,0,0.5);
      box-sizing: border-box;
      border-radius: 0px 120px 0px 0;
    ">
      <div style="max-width: 600px; margin: 0 auto;">
        <h3 style="margin-top: 0; font-size: 2.2rem; margin-bottom: 0.2rem;">${data.title}</h3>
        <h4 style="margin-top: 0; font-size: 1.1rem; color: #777; font-weight: 400; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem;">${data.subtitle}</h4>
        <a href="${data.link}" target="_blank" rel="noopener noreferrer" style="font-size: 0.8rem; color: #777; text-transform: uppercase; margin-bottom: 2rem;">${data.linkplace}</a>
        
        <p style="font-size: 0.8rem; color: #aaa; text-transform: uppercase; margin-bottom: 0.5rem;">Card Cover Artwork Reference:</p>
        <div style="width: 120px; height: 120px; border-radius: 8px; margin-bottom: 2.5rem; background: url('${data.coverMeshTexture}') center/cover no-repeat; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></div>

        <p style="font-size: 1.1rem; line-height: 1.7; color: #333; margin-bottom: 1.5rem;">
          ${data.description}
        </p>

         <p style="font-size: 1.1rem; line-height: 1.7; color: #333; margin-bottom: 1.5rem;">
          ${data.secdescription}
        </p>
        
        <p style="font-size: 1.1rem; line-height: 1.7; color: #666; font-style: italic;">
          ${data.additionalText}
        </p>
        <div style="height: 150px;"></div>
      </div>
    </div>
  </div>

  <style>
    .carousel-slide {
      position: relative;
      flex: 0 0 ${100 / slideCount}%;
      height: 100%;
      overflow: hidden;
    }

    .carousel-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
      transform: scale(1.01);
    }

    .carousel-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.45));
    }

    @keyframes carouselScroll {
      ${slideCount > 1 ? keyframeSteps.join("\n      ") : "0%, 100% { transform: translateX(0); }"}
    }

    @media (max-width: 768px) {
      .carousel-bg {
        height: 46vh !important;
      }

      .scroll-content {
        margin-top: -8vh !important;
        padding: 1.6rem 1rem !important;
        border-radius: 18px 18px 0 0 !important;
      }

      .scroll-content h3 {
        font-size: 1.6rem !important;
      }

      .scroll-content h4 {
        font-size: 0.9rem !important;
        line-height: 1.4;
      }
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
  label.style.zIndex = "20";
  label.style.position = "absolute";
  label.style.width = "auto";
  label.style.height = "auto";
  label.style.top = "0";
  label.style.left = "0";
  label.style.transform = "translate3d(0px, 0px, 0px)";
  label.innerHTML = "";
}

function deselect() {
  if (selectedCard) {
    selectedCard.rotation.y = 0;
    selectedCard.rotation.z = 0;
    cardClickCount.set(selectedCard, 0);
  }
  cardRotationY = 0;
  isExpanded = false;
  selectedCard = null;
  isAnimating = true;
  controls.enableRotate = true;
  controls.enableZoom = true;

  label.style.opacity = "0";
  label.style.pointerEvents = "none";
  label.style.zIndex = "20";
  label.style.position = "absolute";
  label.style.width = "auto";
  label.style.height = "auto";
  label.style.top = "0";
  label.style.left = "0";
  label.style.transform = "translate3d(0px, 0px, 0px)";
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

  if (avgFrameMs > 19) nextPixelRatio -= 0.1;
  if (avgFrameMs < 14 && dynamicPixelRatio < maxPixelRatio)
    nextPixelRatio += 0.05;

  nextPixelRatio = THREE.MathUtils.clamp(
    nextPixelRatio,
    MIN_PIXEL_RATIO,
    maxPixelRatio,
  );

  if (Math.abs(nextPixelRatio - dynamicPixelRatio) >= 0.025) {
    dynamicPixelRatio = nextPixelRatio;
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, dynamicPixelRatio),
    );
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
          lerpVector3(card.position, RAISED_POSITION, lerpAlpha);
          card.rotation.x += (-0.9 - card.rotation.x) * lerpAlpha;
          card.rotation.y += (0 - card.rotation.y) * lerpAlpha;

          if (card.position.distanceTo(RAISED_POSITION) > 0.01)
            stillMoving = true;
        } else if (clickCount === 2) {
          lerpVector3(card.position, EXPANDED_POSITION, lerpAlpha);
          card.rotation.x += (-0.27 - card.rotation.x) * lerpAlpha;
          card.rotation.y += (0 - card.rotation.y) * lerpAlpha;
          card.rotation.z += (0 - card.rotation.z) * lerpAlpha;

          const targetScaley = 3;
          const targetScalex = 4;
          card.scale.x += (targetScalex - card.scale.x) * lerpAlpha;
          card.scale.y += (targetScaley - card.scale.y) * lerpAlpha;

          if (card.position.distanceTo(EXPANDED_POSITION) > 0.01)
            stillMoving = true;
        }

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

// =====================
// GAME VIEW TRANSITION HANDLER
// =====================

const gameView = document.getElementById("game-view")!;
const closeGameBtn = document.getElementById("close-game-btn")!;
const gameButtons = document.querySelectorAll(".game-btn");

const canvasElement = renderer.domElement;
canvasElement.style.transition =
  "transform 0.8s cubic-bezier(0.77, 0, 0.175, 1)";

gameButtons.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    isGameViewActive = true;
    isGameViewTransitioning = true;

    if (selectedCard) {
      cardClickCount.set(selectedCard, 0);
      deselect();
    }

    canvasElement.style.transform = "translateY(-100vh)";
    gameView.style.transform = "translateY(0)";
    gameView.style.opacity = "1";
    gameView.style.pointerEvents = "auto";

    controls.enabled = false;

    setTimeout(() => {
      isGameViewTransitioning = false;
    }, GAME_VIEW_TRANSITION_MS);
  });
});

closeGameBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  isGameViewTransitioning = true;

  canvasElement.style.transform = "translateY(0)";
  gameView.style.transform = "translateY(100vh)";
  gameView.style.opacity = "0";
  gameView.style.pointerEvents = "none";

  controls.enabled = true;

  setTimeout(() => {
    isGameViewActive = false;
    isGameViewTransitioning = false;
  }, GAME_VIEW_TRANSITION_MS);
});
