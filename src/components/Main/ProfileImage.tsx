// 소개글 구역에서 사용할 프로필 이미지
import React, { FunctionComponent } from 'react';
import styled from '@emotion/styled';
import { GatsbyImage, IGatsbyImageData } from 'gatsby-plugin-image';

type ProfileImageProps = {
  profileImage: IGatsbyImageData;
};

const ProfileImageWrapper = styled(GatsbyImage)`
  width: 80px;
  height: 80px;
  border-radius: 50%;

  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
  }
`;

const ProfileImage: FunctionComponent<ProfileImageProps> = function ({ profileImage }) {
  return <ProfileImageWrapper image={profileImage} alt="Profile Image" />;
};

export default ProfileImage;
