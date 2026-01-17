import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
function consoleToTerminal() {
  return {
    name: "console-to-terminal",
    configureServer(server) {
      server.ws.on("console", (data) => {
        console.log(`[BrowserLog]:`, ...data);
      });
    },
  };
}
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), consoleToTerminal()],
  server: {
    allowedHosts: [
      "football-blitz.online"  // твой ngrok-домен
    ],
    host: true,   // важно: чтобы слушать все адреса
    port: 5173
  }
})
