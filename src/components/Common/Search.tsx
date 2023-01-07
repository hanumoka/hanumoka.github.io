//@ts-nocheck

import { AppContext } from '../../context/app';
import styled from '@emotion/styled';
import { graphql, useStaticQuery, Link } from 'gatsby';
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

  return (
    <div className="mt-20">
      <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">
        Search
      </label>
      <div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="search"
          id="default-search"
          className="block w-full p-4 text-4xl text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="검색어를 입력하세요."
        />
        <div className="mt-8">
          <ul role="list" class="p-6 divide-y divide-slate-400 text-2xl ">
            {result.map(({ item }) => (
              <li key={item.id} class="flex py-4 first:pt-0 last:pb-0 hover:underline">
                <div class="ml-3 overflow-hidden">
                  <Link to={item.slug}>{item.title}</Link>
                </div>
              </li>
            ))}
          </ul>
          {result.length < 1 && query && <div>검색결과가 없습니다.</div>}
        </div>
      </div>
    </div>
  );
};

export default Search;
