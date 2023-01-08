// @ts-nocheck

import React, { FunctionComponent, useMemo } from 'react';
import CategoryList2, { CategoryList2Props } from 'components/Main/CategoryList2';
import styled from '@emotion/styled';

import { graphql, useStaticQuery } from 'gatsby';
import { GatsbyImage, IGatsbyImageData } from 'gatsby-plugin-image';
// import ProfileImage from 'components/Main/ProfileImage';
import { PostListItemType } from 'types/PostItem.types';
import queryString, { ParsedQuery } from 'query-string';
import Template from 'components/Common/Template';
import Search from 'components/Common/Search';

const PageWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 20px;
  width: 876px;
  margin: 0 auto;
  padding: 50px 0 100px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    width: 100%;
    padding: 50px 20px;
  }
`;

type TagsPageProps = {
  location: {
    search: string;
  };
  data: {
    site: {
      siteMetadata: {
        title: string;
        description: string;
        siteUrl: string;
      };
    };
    allMarkdownRemark: {
      edges: PostListItemType[];
    };
    file: {
      childImageSharp: {
        gatsbyImageData: IGatsbyImageData;
      };
      publicURL: string;
    };
  };
};

const IndexPage: FunctionComponent<TagsPageProps> = function ({
  location: { search },
  data: {
    site: {
      siteMetadata: { title, description, siteUrl },
    },
    allMarkdownRemark: { edges },
    file: {
      childImageSharp: { gatsbyImageData },
      publicURL,
    },
  },
}) {
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  } else {
    return (
      <Template title={title} description={description} url={siteUrl} image={publicURL} profileImage={gatsbyImageData}>
        <PageWrapper>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            <div className="space-y-2 pt-6 pb-8 md:space-y-5">
              <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
                About
              </h1>
            </div>
            <div className="items-start space-y-2 xl:grid xl:grid-cols-3 xl:gap-x-8 xl:space-y-0">
              <div className="flex flex-col items-center pt-8">
                {/* <Image src={avatar} alt="avatar" width="192px" height="192px" className="h-48 w-48 rounded-full" /> */}
                <GatsbyImage
                  width="192px"
                  height="192px"
                  className="h-48 w-48 rounded-full"
                  image={gatsbyImageData}
                  alt="Profile Image"
                />
                <h3 className="pt-4 pb-2 text-2xl font-bold leading-8 tracking-tight">Hanumoka</h3>
                <div className="text-gray-500 dark:text-gray-400">모지리 개발자</div>
                {/* <div className="text-gray-500 dark:text-gray-400">company</div> */}
                <div className="flex space-x-3 pt-6">
                  {/* <SocialIcon kind="mail" href={`mailto:${email}`} />
                  <SocialIcon kind="github" href={github} />
                  <SocialIcon kind="linkedin" href={linkedin} />
                  <SocialIcon kind="twitter" href={twitter} /> */}
                </div>
              </div>
              <div className="prose max-w-none pt-8 pb-8 dark:prose-dark xl:col-span-2">
                개발은 하면 할수록 모르는게 많아져 고민인 개발자...
              </div>
            </div>
          </div>
        </PageWrapper>
      </Template>
    );
  }
};

export default IndexPage;

export const getPostList = graphql`
  query getPostList {
    site {
      siteMetadata {
        title
        description
        siteUrl
      }
    }
    allMarkdownRemark(sort: { order: DESC, fields: [frontmatter___date, frontmatter___title] }) {
      edges {
        node {
          id
          fields {
            slug
          }
          frontmatter {
            title
            summary
            date(formatString: "YYYY.MM.DD.")
            categories
            thumbnail {
              childImageSharp {
                gatsbyImageData(width: 768, height: 400)
              }
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
