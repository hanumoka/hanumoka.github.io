// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { graphql } from 'gatsby';
import { useFlexSearch } from 'react-use-flexsearch';

const Search = ({
  data: {
    localSearchPages: { index, store },
    allMarkdownRemark: { nodes },
  },
}) => {
  // const results = useFlexSearch(searchQuery, index, store);
  // const posts = unflattenResults(results);

  // const results = useFlexSearch(searchQuery, index, store);
  // // If a user has typed in a query, use the search results. Otherwise, use all posts
  // const posts = searchQuery ? unflattenResults(results) : nodes;

  const [searchQuery, setSearchQuery] = useState('');

  const unFlattenResults = (results) =>
    results.map((post) => {
      const { date, slug, tags, title } = post;
      return { slug, frontmatter: { title, date, tags } };
    });

  useEffect(() => {
    const { search } = window.location;
    const query = new URLSearchParams(search).get('s');
    // const results = useFlexSearch(searchQuery, index, store);

    // setSearchQuery(query);
  });

  const results = useFlexSearch('한국', index, store);
  console.log('=================');
  console.log(JSON.stringify(results));

  // console.log(JSON.stringify(posts));

  return (
    <div>
      <form action="/search" method="get" autoComplete="off">
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
      </form>
      {/* <div className="border-2">{JSON.stringify(posts)}</div> */}
    </div>
  );
};

export default Search;

export const pageQuery = graphql`
  query {
    localSearchPages {
      index
      store
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      nodes {
        excerpt
        fields {
          slug
        }
        frontmatter {
          date(formatString: "MMMM DD, YYYY")
          title
        }
      }
    }
  }
`;
