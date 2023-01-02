// @ts-nocheck
import { graphql, useStaticQuery } from 'gatsby';
import * as React from 'react';
import { useGatsbyPluginFusejs } from 'react-use-fusejs';

export function Search() {
  const data = useStaticQuery(graphql`
    {
      fusejs {
        index
        data
      }
    }
  `);

  const [query, setQuery] = React.useState('');

  // fusejs 객체를 가공 없이 그대로 넘긴다
  const result = useGatsbyPluginFusejs(query, data.fusejs);

  return (
    <div>
      <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul>
        {result.map(({ item }) => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
      <div className="border-2">{JSON.stringify(result)}</div>
    </div>
  );
}

export default Search;
