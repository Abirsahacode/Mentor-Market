import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource-variable/inter";
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/editorial.css";
import "./styles/workspace-pages.css";
import "./styles/public-overhaul.css";
import "./styles/dashboard-shell.css";
import "./styles/mobile-student.css";
import "./styles/creator-studio.css";
import "./styles/course-artwork.css";
import "./styles/discovery-plus.css";
import "./styles/course-experience.css";
import "./styles/live-class.css";
import "./styles/component-polish.css";
import "./styles/referral-system.css";
import App from "./App.jsx";
import AppErrorBoundary from "./components/AppErrorBoundary.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode><BrowserRouter><AppErrorBoundary><AuthProvider><App /></AuthProvider></AppErrorBoundary></BrowserRouter></StrictMode>,
);
