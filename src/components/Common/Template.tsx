import React, { FunctionComponent, ReactNode } from 'react';
// import GlobalStyle from 'components/Common/GlobalStyle'
import Footer from 'components/Common/Footer';
import { Helmet } from 'react-helmet';
import Header from 'components/Common/Header';
import { IGatsbyImageData } from 'gatsby-plugin-image';

import styled from 'styled-components';
import useTheme from '../../hooks/useTheme';

import { BsMoonFill, BsSun } from 'react-icons/bs';

type TemplateProps = {
  title: string;
  description: string;
  url: string;
  image: string;
  children: ReactNode;
  profileImage: IGatsbyImageData;
};

const Container = styled.main`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const Template: FunctionComponent<TemplateProps> = function ({
  title,
  description,
  url,
  image,
  children,
  profileImage,
}) {
  const [theme, themeToggler] = useTheme();

  return (
    <Container className={theme === 'dark' ? 'dark' : 'light'}>
      <Helmet>
        <html lang="ko" />
        <title>{title}</title>

        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html;charset=UTF-8" />

        {/* <meta property="og:type" content="website" /> */}
        {/* <meta property="og:title" content={title} /> */}
        {/* <meta property="og:description" content={description} /> */}
        {/* <meta property="og:image" content={image} /> */}
        {/* <meta property="og:url" content={url} /> */}
        {/* <meta property="og:site_name" content={title} /> */}

        {/* <meta name="twitter:card" content="summary" /> */}
        {/* <meta name="twitter:title" content={title} /> */}
        {/* <meta name="twitter:description" content={description} /> */}
        {/* <meta name="twitter:image" content={image} /> */}
        {/* TODO: twitter 해당 내용 확인하기 */}
        {/* <meta name="twitter:site" content="@사용자이름" /> */}
        {/* <meta name="twitter:creator" content="@사용자이름" /> */}

        <meta name="google-site-verification" content="VMkP0_r8pL9_xczIsGhPaHsuo55RNiskxagZq4gYP9c" />
      </Helmet>

      <div className="text-gray-900 dark:text-gray-200 bg-amber-100 dark:bg-gray-700 bg-opacity-30">
        <header className="sticky top-0 z-30 border-dashed border-2">
          <Header profileImage={profileImage} />
        </header>
        <main className="relative w-full border-dashed border-l-2 border-r-2 border-b-2">
          <div className="flex-1 flex flex-col sm:flex-row">
            <main className="flex-1 gray-500">
              {children}
              <Footer />
            </main>
            {/* 왼쪽 */}
            <nav className="order-first md:w-32"></nav>
            {/* 오른쪽 */}
            <aside className="md:w-32"></aside>
          </div>
        </main>

        <div style={{ position: 'fixed', right: '5px', bottom: '5px' }}>
          <button
            onClick={() => {
              themeToggler();
            }}
          >
            {theme === 'dark' ? <BsMoonFill size="2rem" /> : <BsSun size="2rem" />}
          </button>
        </div>
      </div>
    </Container>
  );
};

export default Template;
