// 소개글 구역에서 사용할 프로필 이미지
import React, { FunctionComponent } from 'react'
import styled from '@emotion/styled'


const ProfileImageWrapper = styled.img`
  width: 120px;
  height: 120px;
  margin-bottom: 30px;
  border-radius: 50%;
`

const ProfileImage: FunctionComponent = function () {
  return <ProfileImageWrapper src={'/avatar.png'} alt="Profile Image" />
}

export default ProfileImage