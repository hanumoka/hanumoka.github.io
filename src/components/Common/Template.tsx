import React, { FunctionComponent, ReactNode } from 'react';
// import GlobalStyle from 'components/Common/GlobalStyle'
import Footer from 'components/Common/Footer';
import { Helmet } from 'react-helmet';
import Introduction from 'components/Main/Introduction';
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

      <div className="text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-900 bg-opacity-30">
        <header className="sticky top-0 z-30">
          <Introduction profileImage={profileImage} />
        </header>
        <main className="relative w-full">
          <div className="flex-1 flex flex-col sm:flex-row">
            <main className="flex-1 bg-indigo-100">{children} </main>
            <nav className="order-first sm:w-32 bg-purple-200">Sidebar</nav>
            <aside className="sm:w-32 bg-yellow-100">Right Sidebar</aside>
          </div>
          <div className="fixed bottom-0 w-full">
            <button className="animate-pulse my-8 float-right px-5 py-2 bg-red-500 text-white text-sm font-bold tracking-wide rounded-full focus:outline-none">
              Back
            </button>
            <button className="animate-bounce my-8 ml-auto px-5 py-2 bg-red-500 text-white text-sm font-bold tracking-wide rounded-full focus:outline-none">
              Next(Quiz)
            </button>
            <button className="bottom-0 my-8 float-right px-5 py-2 bg-red-500 text-white text-sm font-bold tracking-wide rounded-full focus:outline-none">
              Next
            </button>
          </div>
          {/* {children} */}
        </main>
        <Footer />
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
