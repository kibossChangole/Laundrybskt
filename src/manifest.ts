export const cardDataManifest = [
  {
    id: 1,
    coverMeshTexture: "/kanban.png", // Texture rendered on the 3D mesh
    title: "Apex Kanban - Modern Stylised Kanban Board",
    subtitle:
      "username: alice | password: password123  | ESTABLISH SYSTEM ORDER",
    linkplace: "Live link",
    link: "https://apex-team-board-web.vercel.app",
    GithubLink: "https://github.com/kibossChangole/ApexTeamBoard",
    githublinkplace: "GitHub Repository",
    description:
      "ApexTeamBoard is a polished Kanban experience built to feel fast, focused, and collaborative from the first click. The demo runs as a frontend-only SPA powered by React 18, TypeScript, Vite, React Router, and TanStack Query, with a sleek glassmorphism UI, Lucide icons, and persistent localStorage data. That means you can sign in, create tasks, move cards across Todo, In-Progress, and Done, and comment instantly, all without deploying a backend.",
    secdescription:
      "this demo showcases the product feel and interaction model, while the actual implementation adds the server-side guarantees teams need in real environments: persistent multi-user data, authenticated access control, validated inputs, and reliable API-driven state",
    additionalText:
      "Under the hood, the full version is designed as a complete monorepo stack: a TypeScript Express API with Zod validation, JWT authentication, bcrypt password hashing, and a Better-SQLite3 database for durable storage. Instead of the browser shim, the production flow uses real REST endpoints for auth, tasks, pagination, search, and comments, enforcing consistent error contracts and secure user isolation.",
    carouselImages: [
      "kanban/1.png",
      "kanban/2.png",
      "kanban/3.png",
      "kanban/4.png",
    ],
  },
  {
    id: 2,
    coverMeshTexture: "/gt3rs.png",
    title: "Three JS GT3RS Car Configurator",
    subtitle: "Video-game style 3D car configurator",
    linkplace: "Live link",
    link: "https://gt3rs-configurator.vercel.app",
    GithubLink: "https://github.com/kibossChangole/GT3RSconfigurator",
    githublinkplace: "GitHub Repository",
    description:
      "GT3RS Configurator is a premium web-based 3D vehicle customization experience built to showcase real-time rendering, interactive UI design, and performance-conscious frontend engineering. The project started around the Porsche 911 GT3RS concept but has evolved into a multi-model configurator featuring vehicles like the Mercedes G63, GLE63, Land Cruiser 250, and Range Rover Sport.",
    secdescription:
      "The stack is intentionally lightweight and modern: Three.js powers the 3D scene and material rendering, while Vite provides a fast build and development workflow using native ES modules. Core scene tooling includes GLTFLoader for model loading, RGBELoader for environment lighting, and OrbitControls for smooth user interaction (pan, zoom, orbit). The UI layer is built with vanilla HTML/CSS/JS, using a glassmorphism-inspired control panel and responsive layout behavior.",
    additionalText:
      "A key technical highlight is the model configuration system that maps each vehicle to custom transform settings (scale, offsets, rotation, paint targets), allowing one unified viewer pipeline to support different assets reliably. Users can switch models dynamically and apply paint finishes in real time, with lighting and reflections tuned to preserve a high-end showroom feel. The app also includes adaptive rendering decisions for mobile vs desktop, such as responsive camera FOV, capped pixel ratio, and adjusted shadow-map size for performance balance.",
    carouselImages: [
      "gt3rs/1.png",
      "gt3rs/2.png",
      "gt3rs/3.png",
      "gt3rs/4.png",
    ],
  },

  {
    id: 3,
    coverMeshTexture: "/yapsesh.png",
    title: "YapSesh",
    subtitle: "Meet and interact with Moros",
    linkplace: "Live link",
    link: "https://yapsesh-clone.vercel.app",
    GithubLink: "https://github.com/kibossChangole/yapsesh",
    githublinkplace: "GitHub Repository",
    description:
      "Card 2 has totally different copy! It talks about the beautiful aesthetic choices, color psychology, and environment lighting profiles.",
    additionalText:
      "Technical breakdowns or specifications unique to your second milestone asset.",
    carouselImages: ["/yapsesh/3.png", "/yapsesh/2.png", "/yapsesh/1.png"],
  },
];
