// @ts-nocheck // TODO: 나중에 타입스크립트
import React, { FunctionComponent } from 'react';
import './TableOfContents.css';

const TableOfContents: FunctionComponent = function ({ toc }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const onClickToc = () => {
    setIsOpen((prev) => !prev);
  };

  console.log('-------------- toc -------------------');
  console.log(toc);

  return (
    <div>
      <div className="fixed right-0 top-0 py-2 px-14 z-20">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 border border-blue-700 rounded"
          onClick={onClickToc}
        >
          TOC 버튼
        </button>
        <div
          className={`rounded-md text-gray-200 dark:text-gray-900 bg-gray-900 dark:bg-white top-20 right-0 w-[35vw] p-5 fixed h-3/4 z-40 ease-in-out duration-300 ${
            isOpen ? 'translate-x-0 ' : 'translate-x-full'
          }`}
        >
          {/* <h3 className="mt-20 text-4xl font-semibold text-white">I am a sidebar</h3> */}
          {/* <h2>Toc</h2> */}
          <br />
          <div className="toc-container">
            <div className="toc-wrapper">
              <div className="toc-content">
                <div className="toc" dangerouslySetInnerHTML={{ __html: toc }} />
              </div>
              {/* <div className="toc-open-btn" onClick={onClickTOCOpen}></div> */}
            </div>
          </div>
          {/* <div>{toc}</div> */}
        </div>
      </div>
      <div>
        {/* <div
          className={
            ' fixed overflow-hidden z-10 bg-gray-900 bg-opacity-25 inset-0 transform ease-in-out ' +
            (isOpen
              ? ' transition-opacity opacity-100 duration-500 translate-x-0  '
              : ' transition-all delay-500 opacity-0 translate-x-full  ')
          }
        >
          toc 본문
        </div> */}
        {/* <div className="toc-open-btn" onClick={onClickTOCOpen}></div> */}
      </div>
      {/* <div class="fixed bottom-0 w-full">
        <button class="animate-pulse my-8 float-right px-5 py-2 bg-red-500 text-white text-sm font-bold tracking-wide rounded-full focus:outline-none">
          Back
        </button>
        <button class="animate-bounce my-8 ml-auto px-5 py-2 bg-red-500 text-white text-sm font-bold tracking-wide rounded-full focus:outline-none">
          Next(Quiz)
        </button>
        <button class="bottom-0 my-8 float-right px-5 py-2 bg-red-500 text-white text-sm font-bold tracking-wide rounded-full focus:outline-none">
          Next
        </button>
      </div> */}
    </div>
  );
};

export default TableOfContents;
