// 페이지 상단 소개글
import React, { FunctionComponent } from 'react';
import styled from '@emotion/styled';
import ProfileImage from 'components/Main/ProfileImage';
import { IGatsbyImageData } from 'gatsby-plugin-image';

// const Background = styled.div`
//   width: 100%;
//   background-image: linear-gradient(60deg, #29323c 0%, #485563 100%);
//   color: #ffffff;
// `;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  width: 768px;
  height: 120px;
  margin: 0 auto;

  @media (max-width: 768px) {
    width: 100%;
    height: 80px;
    padding: 0 20px;
  }
`;

const SubTitle = styled.div`
  font-size: 20px;
  font-weight: 400;

  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

const Title = styled.div`
  margin-top: 5px;
  font-size: 35px;
  font-weight: 700;

  @media (max-width: 768px) {
    font-size: 25px;
  }
`;

type IntroductionProps = {
  profileImage: IGatsbyImageData;
};

const Introduction: FunctionComponent<IntroductionProps> = function ({ profileImage }) {
  return (
    // <Background>
    <div className="text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-800 border-dashed border-2">
      <Wrapper>
        <div className="flex w-full gap-4">
          <div className="flex-none">
            <ProfileImage profileImage={profileImage} />
          </div>
          <div className="flex-auto w-64">
            <SubTitle>개발블로그</SubTitle>
            <Title>공사중...</Title>
          </div>
          <div className="flex-auto w-32">메뉴자리1</div>
        </div>
      </Wrapper>
    </div>
    // </Background>
  );
};

export default Introduction;
