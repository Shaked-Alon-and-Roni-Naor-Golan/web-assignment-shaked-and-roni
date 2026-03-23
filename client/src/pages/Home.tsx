import { KeyboardEvent, useState } from "react";
import { PostsList } from "../components/PostsList";

const AISearchLoader = ({ query }: { query: string }) => {
  return (
    <div className="ai-search-loader-card">
      <div className="ai-search-loader-orb" aria-hidden="true" />
      <div>
        <div className="ai-search-loader-title">AI search in progress</div>
        <div className="ai-search-loader-subtitle">
          Looking for best matches for “{query}”
          <span className="ai-search-loader-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const [searchText, setSearchText] = useState("");
  const [appliedSearchText, setAppliedSearchText] = useState("");
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const applySearch = () => {
    setAppliedSearchText(searchText.trim());
  };

  const handleSearchKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applySearch();
    }
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
            onKeyDown={handleSearchKeyDown}
          />
          <button className="btn btn-primary" type="button" onClick={applySearch}>
            Search
          </button>
        </div>
      </div>
      {isSearchLoading && appliedSearchText ? (
        <div style={{ width: "600px", marginBottom: "12px" }}>
          <AISearchLoader query={appliedSearchText} />
        </div>
      ) : null}
      <PostsList
        searchQuery={appliedSearchText}
        onSearchLoadingChange={setIsSearchLoading}
      />
    </div>
  );
};

export default Home;
