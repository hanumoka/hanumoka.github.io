//@ts-nocheck

import { AppContext } from '../../context/app';
import styled from '@emotion/styled';
import { graphql, useStaticQuery } from 'gatsby';
import * as React from 'react';
import { useGatsbyPluginFusejs } from 'react-use-fusejs';

const Search = ({ searchQuery, setSearchQuery }) => {
  const data = useStaticQuery(graphql`
    {
      fusejs {
        publicUrl
      }
    }
  `);

  const [query, setQuery] = React.useState('');
  const { fusejs, setFusejs } = React.useContext(AppContext);
  const result = useGatsbyPluginFusejs(query, fusejs);

  const fetching = React.useRef(false);

  React.useEffect(() => {
    if (!fetching.current && !fusejs && query) {
      fetching.current = true;

      fetch(data.fusejs.publicUrl)
        .then((res) => res.json())
        .then((json) => setFusejs(json));
    }
  }, [fusejs, query]);

  console.log('result====>');
  console.log(JSON.stringify(result));

  return (
    <>
      <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">
        Search
      </label>
      <div className="w-full">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="search"
          id="default-search"
          className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="검색어를 입력... 태그는 검색안됨"
        />
        <ul>
          {result.map(({ item }) => (
            <li key={item.id}>
              {item.title} : {item.slug}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Search;
