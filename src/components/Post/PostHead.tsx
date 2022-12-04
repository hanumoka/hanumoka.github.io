import React, { FunctionComponent } from 'react'
import styled from '@emotion/styled'
import { GatsbyImage, IGatsbyImageData } from 'gatsby-plugin-image'

import PostHeadInfo, { PostHeadInfoProps } from 'components/Post/PostHeadInfo'

type PostHeadProps = PostHeadInfoProps & {
  thumbnail: {
    childImageSharp: {
      gatsbyImageData: IGatsbyImageData
    }
  }
}

type GatsbyImgProps = {
  image: IGatsbyImageData
  alt: string
  className?: string
}


const PostHeadWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 400px;

  @media (max-width: 768px) {
    height: 300px;
  }
`

const BackgroundImage = styled((props: GatsbyImgProps) => (
  <GatsbyImage {...props} style={{ position: 'absolute' }} />
))`
  z-index: -1;
  width: 100%;
  height: 300px;
  object-fit: cover;
  filter: brightness(0.25);

  @media (max-width: 768px) {
    height: 300px;
  }
`

const PostHead: FunctionComponent<PostHeadProps> = function ({
    title,
    date,
    categories,
    thumbnail: {
      childImageSharp: { gatsbyImageData },
    },
  }) {

    return (
      <PostHeadWrapper>
        <div>
          <BackgroundImage image={gatsbyImageData} alt="thumbnail" />
          <PostHeadInfo title={title} date={date} categories={categories} />
        </div>
      </PostHeadWrapper>
    )
  }
  
  export default PostHead