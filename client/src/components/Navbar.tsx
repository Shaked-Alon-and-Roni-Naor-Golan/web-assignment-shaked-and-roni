import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark bg-dark"
      style={{ justifyContent: "space-between" }}
    >
      <div className="container">
        <Link className="navbar-brand" to="/">
          <img
            src="/logo.png"
            alt="JustEat Logo"
            className="logo m-2 rounded-circle"
            style={{ width: "30px", height: "30px" }}
          />
          JustEat
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
      </div>
    </nav>
  );
};

export default Navbar;
