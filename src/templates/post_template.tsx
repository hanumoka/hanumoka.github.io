// @ts-nocheck

import React, { FunctionComponent } from 'react';
import { graphql } from 'gatsby';
import { PostPageItemType } from 'types/PostItem.types'; // 바로 아래에서 정의할 것입니다
import Template from 'components/Common/Template';
import PostHead from 'components/Post/PostHead';
import PostContent from 'components/Post/PostContent';
import CommentWidget from 'components/Post/CommentWidget';
import TableOfContents from 'components/Post/TableOfContents';

type PostTemplateProps = {
  data: {
    allMarkdownRemark: {
      edges: PostPageItemType[];
    };
  };
  location: {
    href: string;
  };
};

const PostTemplate: FunctionComponent<PostTemplateProps> = function ({
  data: {
    allMarkdownRemark: { edges },
  },
  location: { href },
}) {
  const {
    node: {
      html,
      tableOfContents,
      frontmatter: { title, summary, date, categories, thumbnail },
    },
  } = edges[0];

  const publicURL = thumbnail.publicURL;

  return (
    <Template title={title} description={summary} url={href} image={publicURL}>
      <PostHead title={title} date={date} categories={categories} thumbnail={thumbnail} />
      <TableOfContents toc={tableOfContents} />
      <PostContent html={html} />
      <CommentWidget />
    </Template>
  );
};

export default PostTemplate;

export const queryMarkdownDataBySlug = graphql`
  query queryMarkdownDataBySlug($slug: String) {
    allMarkdownRemark(filter: { fields: { slug: { eq: $slug } } }) {
      edges {
        node {
          html
          tableOfContents
          frontmatter {
            title
            summary
            date(formatString: "YYYY.MM.DD.")
            categories
            thumbnail {
              childImageSharp {
                gatsbyImageData
              }
              publicURL
            }
          }
        }
      }
    }
  }
`;
