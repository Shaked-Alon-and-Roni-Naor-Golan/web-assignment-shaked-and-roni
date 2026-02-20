import "./index.css";
import App from "./App.tsx";
import { StrictMode } from "react";
import { SnackbarProvider } from "notistack";
import { createRoot } from "react-dom/client";
import { UserContextProvider } from "./context/UserContext.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { PostsContextProvider } from "./context/PostsContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="199679980670-92k0l0d1m6v4l7n8n2rsvbqguiphuj7r.apps.googleusercontent.com">
      <UserContextProvider>
        <PostsContextProvider>
          <SnackbarProvider />
          <App />
        </PostsContextProvider>
      </UserContextProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
