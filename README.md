# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## How to Play Online

Since this is a Peer-to-Peer (P2P) game, both players need to be able to connect to each other.

### 1. Local Network (Same Wi-Fi)
If you and your friend are on the **same Wi-Fi**:
1. Open a terminal and run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) to find your local IP address (e.g., `192.168.1.5`).
2. Run the game with `npm run dev -- --host`.
3. Your friend can join by typing `http://YOUR_IP_ADDRESS:5173` in their browser.

### 2. Internet (Different Networks)
If your friend is in a **different house**, they cannot access `localhost`. You must make the game accessible online.

#### Option A: Deploy (Recommended)
Deploy the game to a free hosting service like **Vercel** or **Netlify**.
1. Push your code to GitHub.
2. Import the project into Vercel/Netlify.
3. Share the generated URL (e.g., `https://my-crazy-remix.vercel.app`) with your friend.

#### Option B: Tunneling (Quick Test)
Use a tool like **ngrok** to share your local port.
1. Install ngrok.
2. Run your game: `npm run dev`
3. In a new terminal, run: `ngrok http 5173`
4. Share the `https://....ngrok-free.app` link with your friend.

