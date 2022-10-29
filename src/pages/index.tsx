import React, { FunctionComponent } from 'react'
import styled from '@emotion/styled'
import GlobalStyle from 'components/common/GlobalStyle'
import Footer from 'components/common/Footer'
import CategoryList from 'components/main/CategoryList'
import Introduction from 'components/main/Introduction'
import PostList from 'components/main/PostList'

import { PostListItemType } from 'types/PostItem.types'
import { graphql } from 'gatsby'

const CATEGORY_LIST = {
  All: 5,
  Web: 3,
  Mobile: 2,
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`

// type IndexPageProps = {
//   data: {
//     allMarkdownRemark: {
//       edges: [
//         {
//           node: {
//             id: string
//             frontmatter: {
//               title: string
//               summary: string
//               date: string
//               categories: string[]
//               thumbnail: {
//                 publicURL: string
//               }
//             }
//           }
//         },
//       ]
//     }
//   }
// }

type IndexPageProps = {
  data: {
    allMarkdownRemark: {
      edges: PostListItemType[]
    }
  }
}

const IndexPage: FunctionComponent<IndexPageProps> = function ({
  data: {
    allMarkdownRemark: { edges },
  },
}) {
  return (
    <Container>
      <GlobalStyle />
      <Introduction />
      <CategoryList selectedCategory="Web" categoryList={CATEGORY_LIST} />
      <PostList posts={edges} />
      <Footer />
    </Container>
  )
}

export default IndexPage

export const getPostList = graphql`
  query getPostList {
    allMarkdownRemark(
      sort: { order: DESC, fields: [frontmatter___date, frontmatter___title] }
    ) {
      edges {
        node {
          id
          frontmatter {
            title
            summary
            date(formatString: "YYYY.MM.DD.")
            categories
            thumbnail {
              publicURL
            }
          }
        }
      }
    }
  }
`