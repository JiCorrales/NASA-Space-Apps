import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../../theme.css";
import "../../ui/ui.css";
import "../../styles.css";
import { Act1App } from "./Act1App";

createRoot(document.getElementById("root")!).render(<StrictMode><Act1App /></StrictMode>);
