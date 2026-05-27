import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";

// Set document.title from the bridge's brand env (JANUS_BRAND). The static
// index.html title is just a fallback for the moment before this resolves.
fetch("/api/brand")
  .then(r => r.ok ? r.json() : null)
  .then(d => { if (d?.brand) document.title = d.brand; })
  .catch(() => {});

// Register the service worker so browsers consider us an installable PWA.
// Without this, Chrome on Android won't show the "Install" prompt and iOS
// Safari's "Add to Home Screen" gives a degraded experience. sw.js itself
// is a no-op fetch handler — exists only to satisfy install criteria.
if ("serviceWorker" in navigator && location.protocol === "https:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("[pwa] service worker registration failed:", err);
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
