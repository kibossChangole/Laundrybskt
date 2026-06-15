export const cardDataManifest = [
  {
    id: 1,
    coverMeshTexture: "/kanban.png", // Texture rendered on the 3D mesh
    title: "Apex Kanban - Modern Stylised Kanban Board",
    subtitle: "ESTABLISH SYSTEM ORDER.",
    linkplace: "Live link",
    link: "https://apex-team-board-web.vercel.app",
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
    title: "Cybernetic Oasis",
    subtitle: "Art Direction & Shaders",
    description:
      "Card 2 has totally different copy! It talks about the beautiful aesthetic choices, color psychology, and environment lighting profiles.",
    additionalText:
      "Technical breakdowns or specifications unique to your second milestone asset.",
    carouselImages: [
      "https://picsum.photos/id/30/1200/800",
      "https://picsum.photos/id/31/1200/800",
      "https://picsum.photos/id/32/1200/800",
    ],
  },

  {
    id: 3,
    coverMeshTexture: "/yapsesh.png",
    title: "Cybernetic Oasis",
    subtitle: "Art Direction & Shaders",
    description:
      "Card 2 has totally different copy! It talks about the beautiful aesthetic choices, color psychology, and environment lighting profiles.",
    additionalText:
      "Technical breakdowns or specifications unique to your second milestone asset.",
    carouselImages: [
      "https://picsum.photos/id/30/1200/800",
      "https://picsum.photos/id/31/1200/800",
      "https://picsum.photos/id/32/1200/800",
    ],
  },
];
