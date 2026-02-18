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
    <GoogleOAuthProvider clientId="118665777117-ql3ouua8tf8n9r4j6o27qr7bdrg2lt3v.apps.googleusercontent.com">
      <UserContextProvider>
        <PostsContextProvider>
          <SnackbarProvider />
          <App />
        </PostsContextProvider>
      </UserContextProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
