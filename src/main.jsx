// src/main.jsx
import ReactDOM from "react-dom/client";
import "@/index.css";

import { AuthProvider } from "@/components/auth/AuthProvider";
import PagesRouter from "@/pages/PagesRouter.jsx";

// React 17+ no longer requires importing React for JSX
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <AuthProvider>
    <PagesRouter />
  </AuthProvider>
);
