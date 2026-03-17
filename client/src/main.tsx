import "./index.css";
import App from "./App.tsx";
import { StrictMode } from "react";
import { SnackbarProvider } from "notistack";
import { createRoot } from "react-dom/client";
import { UserContextProvider } from "./context/UserContext.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { PostsContextProvider } from "./context/PostsContext.tsx";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  throw new Error("Missing VITE_GOOGLE_CLIENT_ID in client/.env");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <UserContextProvider>
        <PostsContextProvider>
          <SnackbarProvider />
          <App />
        </PostsContextProvider>
      </UserContextProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
