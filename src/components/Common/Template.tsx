import React, { FunctionComponent, ReactNode, useCallback } from 'react'
import GlobalStyle from 'components/Common/GlobalStyle'
import Footer from 'components/Common/Footer'
import { Helmet } from 'react-helmet'

import styled, { ThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from '../../styles/theme';
import useTheme from 'hooks/useTheme';
import {CiDark} from 'react-icons/ci';
import {MdDarkMode} from 'react-icons/md';


type TemplateProps = {
  title: string
  description: string
  url: string
  image: string
  children: ReactNode
}

const Container = styled.main`
  display: flex;
  flex-direction: column;
  height: 100vh;
`

const FloatingBtn = styled.div`
  position: fixed; //포인트!
  line-height: 63px;
  bottom: 40px; //위치
  right: 40px;  //위치
  width: 50px;  
  height: 50px;
  border-radius: 50%;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 100;
`;

const Template: FunctionComponent<TemplateProps> = function ({
  title,
  description,
  url,
  image,
  children,
}) {

  const [theme, themeToggler] = useTheme();
  const themeMode = theme === 'light' ? lightTheme : darkTheme;

  console.log("theme:"+ theme);

  const changeTheme = useCallback(() => {
    console.log(theme);
    themeToggler(); // TODO: 이거 뭐지?
  }, [themeToggler, theme]);

  // const changeTheme = () => {
  //   alert("테마 버튼");
  //   console.log(theme);
  //   themeToggler();
  // }
  

  return (
    <Container>
      <Helmet>
        <title>{title}</title>

        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html;charset=UTF-8" />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:url" content={url} />
        <meta property="og:site_name" content={title} />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
        {/* TODO: twitter 해당 내용 확인하기 */}
        <meta name="twitter:site" content="@사용자이름" />
        <meta name="twitter:creator" content="@사용자이름" />

        <meta name="google-site-verification" content="VMkP0_r8pL9_xczIsGhPaHsuo55RNiskxagZq4gYP9c" />

        <html lang="ko" />
      </Helmet>
      <ThemeProvider theme={themeMode}>
        <FloatingBtn onClick={changeTheme}>
          {theme === 'light' ? (<CiDark style={{ fontSize: "50px"}} />) : (<MdDarkMode style={{ fontSize: "50px"}} /> )}
        </FloatingBtn>
        <GlobalStyle />

        {children}
        <Footer />
      </ThemeProvider>
    </Container>
  )
}

export default Template;

// const ThemeToggleButton = styled.button`
//  width: 200px;
//  height: 200px;
//  position: absolute;
//  top: 50%;
//  left: 50%:
//  transform: transition(-50%, -50%);
//  color: ${({ theme }) => theme.color.fontColor };
//  background-color: ${({ theme }) => theme.color.backgroundColor };
// `;