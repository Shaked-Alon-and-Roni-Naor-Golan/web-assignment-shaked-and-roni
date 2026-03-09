import { useState } from "react";
import { PostsList } from "../components/PostsList";

const Home = () => {
  const [searchText, setSearchText] = useState("");
  const [appliedSearchText, setAppliedSearchText] = useState("");

  const applySearch = () => {
    setAppliedSearchText(searchText.trim());
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
      }}
    >
      <div style={{ width: "600px", marginTop: "16px", marginBottom: "12px" }}>
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Search posts (e.g. hotels in Tel Aviv)"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          <button className="btn btn-primary" type="button" onClick={applySearch}>
            Search
          </button>
        </div>
      </div>
      <PostsList searchQuery={appliedSearchText} />
    </div>
  );
};

export default Home;
