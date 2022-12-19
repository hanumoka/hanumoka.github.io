// @ts-nocheck

import React, { FunctionComponent, useEffect } from 'react';
import { graphql } from 'gatsby';
import { PostPageItemType } from 'types/PostItem.types'; // 바로 아래에서 정의할 것입니다
import Template from 'components/Common/Template';
import PostHead from 'components/Post/PostHead';
import PostContent from 'components/Post/PostContent';
import CommentWidget from 'components/Post/CommentWidget';
import TableOfContents from 'components/Post/TableOfContents';
import Introduction from 'components/Main/Introduction';

type PostTemplateProps = {
  location: {
    href: string;
  };
  data: {
    allMarkdownRemark: {
      edges: PostPageItemType[];
    };
    file: {
      childImageSharp: {
        gatsbyImageData: IGatsbyImageData;
      };
      publicURL: string;
    };
  };
};

const PostTemplate: FunctionComponent<PostTemplateProps> = function ({
  location: { href },
  data: {
    allMarkdownRemark: { edges },
    file: {
      childImageSharp: { gatsbyImageData },
      publicURL,
    },
  },
}) {
  const {
    node: {
      html,
      tableOfContents,
      frontmatter: { title, summary, date, categories, thumbnail },
    },
  } = edges[0];

  const thumbnailPublicURL = thumbnail.publicURL;

  const scrollHandler = () => {
    const toc = document.getElementsByTagName('aside');

    console.dir(toc);

    if (!toc || toc.length < 0 || !toc[0] || !toc[0].style || toc[0].offsetWidth === 0) {
      return;
    }

    const anchor_holder = document.getElementsByClassName('anchor-header');
    if (!anchor_holder || anchor_holder.length <= 0) {
      return;
    }
    console.log('111');
    let selected_anchor = null;
    const anchor_holder_arr = Array.from(anchor_holder);
    for (let a of anchor_holder_arr) {
      if (a.getBoundingClientRect().top > -30) {
        selected_anchor = a.getAttribute('href');
        break;
      }
    }
    if (!selected_anchor) {
      selected_anchor = anchor_holder_arr[anchor_holder_arr.length - 1].getAttribute('href');
    }
    document.querySelectorAll('aside a.selected').forEach((a) => {
      a.classList.remove('selected');
    });

    console.log('적용 selected_anchor:' + selected_anchor);

    if (selected_anchor) {
      const toc_selected = document.querySelector("aside a[href='" + decodeURIComponent(selected_anchor) + "']");
      toc_selected && toc_selected.classList.add('selected');
    }
  };

  useEffect(() => {
    console.log('post_template useEffect...');

    document.addEventListener('scroll', scrollHandler);

    return () => {
      document.removeEventListener('scroll', scrollHandler);
    };
  }, []);

  return (
    <Template title={title} description={summary} url={href} image={thumbnailPublicURL}>
      {/* <Introduction profileImage={gatsbyImageData} /> */}
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
    file(name: { eq: "profile-image" }) {
      childImageSharp {
        gatsbyImageData(width: 120, height: 120)
      }
      publicURL
    }
  }
`;
