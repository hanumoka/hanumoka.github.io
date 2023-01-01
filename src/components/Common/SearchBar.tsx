//@ts-nocheck

import React from 'react';

const SearchBar = ({ searchQuery, setSearchQuery }) => {
  return (
    <div>
      <form action="/" method="get" autoComplete="off">
        <label htmlFor="header-search">
          <span className="visually-hidden">Search blog posts</span>
        </label>
        <input
          value={searchQuery}
          onInput={(e) => setSearchQuery(e.target.value)}
          type="text"
          id="header-search"
          placeholder="Search blog posts"
          name="s"
        />
        <button type="submit">Search</button>
      </form>{' '}
    </div>
  );
};

export default SearchBar;
