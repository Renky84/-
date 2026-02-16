import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import LoginGate from "./components/LoginGate";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LoginGate>
      <App />
    </LoginGate>
  </React.StrictMode>
);
const logout = () => {
  localStorage.removeItem("sound_manager_logged_in");
  location.reload();
};