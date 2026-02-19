import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "./store/store";
import App from "./App";
import "./index.css";

// ─── Disable ALL mouse/touch scrolling globally ───────────────────────────
// CSS overflow:hidden stops most scroll but wheel events on inner scrollable
// containers can still slip through. This blocks them at the JS level.
const blockScroll = (event) => event.preventDefault();

window.addEventListener("wheel", blockScroll, { passive: false });
window.addEventListener("touchmove", blockScroll, { passive: false });
window.addEventListener("touchstart", blockScroll, { passive: false });

// ─── Disable Tab key globally ─────────────────────────────────────────────
window.addEventListener("keydown", (event) => {
  if (event.key === "Tab") event.preventDefault();
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
