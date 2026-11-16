import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Bootstrap (framework de estilização) - CSS e JavaScript (menu hambúrguer, dropdowns)
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// Estilos personalizados globais do AproVest (cores, tema claro/escuro, tipografia)
import "./styles/tema.css";

import { AuthProvider } from "./contexts/AuthContext";
import AppRoutes from "./routes/AppRoutes";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </StrictMode>
);
