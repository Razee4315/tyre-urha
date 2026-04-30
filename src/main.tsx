import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./screens/screens.css";
import "./screens/hud.css";

// Prevent the iOS-style elastic scroll from offsetting the canvas on tap.
document.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length > 1) return;
    e.preventDefault();
  },
  { passive: false },
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
