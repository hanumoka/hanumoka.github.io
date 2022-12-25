// @ts-nocheck // TODO: 나중에 타입스크립트
import React, { FunctionComponent, useRef } from 'react';
import './TableOfContents.css';
import useOutsideAlerter from 'hooks/useOutsideAlerter';

const TableOfContents: FunctionComponent = function ({ toc }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const onClickToc = () => {
    setIsOpen((prev) => !prev);
  };

  const closeToc = () => {
    setIsOpen((prev) => {
      if (prev === true) {
        return false;
      }
    });
  };

  const wrapperRef = useRef(null);
  useOutsideAlerter(wrapperRef, closeToc);

  return (
    <div>
      {/* <div className="fixed bottom-10 w-full"></div> */}
      <div className="fixed right-0 top-1px py-2 px-1 z-40 bottom-10">
        {!isOpen && (
          <button
            className="animate-pulse my-8 float-right px-5 py-2 bg-red-500 text-white text-sm font-bold tracking-wide rounded-full focus:outline-none"
            onClick={onClickToc}
          >
            TOC
          </button>
        )}
        <div
          ref={wrapperRef}
          className={`rounded-md text-gray-200 dark:text-gray-900 bg-gray-900 dark:bg-white top-20 right-0 w-[25vw] p-5 fixed h-3/4 z-40 ease-in-out duration-300 ${
            isOpen ? 'translate-x-0 ' : 'translate-x-full'
          }`}
        >
          <br />
          <div className="toc-container">
            <div className="toc-wrapper">
              <div className="toc-content">
                <aside className="border-l-4">
                  <div className="toc" dangerouslySetInnerHTML={{ __html: toc }} />
                </aside>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableOfContents;
