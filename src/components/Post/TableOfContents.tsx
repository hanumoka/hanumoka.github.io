// @ts-nocheck // TODO: 나중에 타입스크립트
import React, { FunctionComponent } from 'react';

const TableOfContents: FunctionComponent = function ({ toc }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const onClickToc = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div>
      <div class="fixed right-0 top-0 py-2 px-14">
        <button
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 border border-blue-700 rounded"
          onClick={onClickToc}
        >
          TOC 버튼
        </button>
        <div className={isOpen ? 'visible' : 'collapse'}>
          <div dangerouslySetInnerHTML={{ __html: toc }} />
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
