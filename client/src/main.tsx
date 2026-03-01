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
    <GoogleOAuthProvider clientId="1048046342911-bvt062chcgn9rj7te10o07lse41bb323.apps.googleusercontent.com">
      <UserContextProvider>
        <PostsContextProvider>
          <SnackbarProvider />
          <App />
        </PostsContextProvider>
      </UserContextProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
