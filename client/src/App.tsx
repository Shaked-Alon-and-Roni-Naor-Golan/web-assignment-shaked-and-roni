import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import AddPost from "./pages/AddPost";
import Profile from "./pages/Profile";
import Navbar from "./components/Navbar";
import PostDetails from "./pages/PostDetails";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import { useUserContext } from "./context/UserContext";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {
  const { user, loadingUser } = useUserContext() ?? {};

  return (
    <Router>
      {user && <Navbar />}

      <div
        className="d-flex justify-content-center align-items-center"
        style={{ backgroundColor: "#fcf1d9" }}
      >
        {loadingUser ? (
          <div
            className="spinner-border text-success"
            style={{ width: "15rem", height: "15rem" }}
          />
        ) : (
          <Routes>
            {!user ? (
              <>
                <Route path="/" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Home />} />
                <Route path="/add-post" element={<AddPost></AddPost>} />
                <Route path="/profile" element={<Profile></Profile>} />
                <Route path="/post/:id" element={<PostDetails></PostDetails>} />
              </>
            )}
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
