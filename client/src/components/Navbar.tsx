import { authLogout } from "../services/auth";
import { Link, useNavigate } from "react-router-dom";
import { useUserContext } from "../context/UserContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { setUser } = useUserContext() ?? {};

  const handleLogout = async () => {
    await authLogout();
    try {
      setUser?.(null);
      navigate("/");
    } catch (err) {
      console.error("Failed to finalize local logout", err);
    }
  };

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark bg-dark"
      style={{ justifyContent: "space-between" }}
    >
      <div className="container">
        <Link className="navbar-brand" to="/">
          <img
            src="/logo.png"
            alt="HotelLand Logo"
            className="logo m-2 rounded-circle"
            style={{ width: "30px", height: "30px" }}
          />
          HotelLand
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link to="/" className="nav-link">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <div className="nav-link">|</div>
            </li>
            <li className="nav-item">
              <Link to="/profile" className="nav-link">
                Profile
              </Link>
            </li>
            <li className="nav-item">
              <div className="nav-link">|</div>
            </li>
            <li className="nav-item">
              <Link to="/add-post" className="nav-link">
                Add Hotel
              </Link>
            </li>
            <li className="nav-item">
              <div className="nav-link">|</div>
            </li>
            <li className="nav-item">
              <button className="nav-link btn btn-link" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
