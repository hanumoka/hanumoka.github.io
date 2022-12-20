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
      <div className="fixed right-0 top-1px py-2 px-1 z-40">
        {!isOpen && (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 border border-blue-700 rounded"
            onClick={onClickToc}
          >
            TOC
          </button>
        )}

        <div
          ref={wrapperRef}
          className={`rounded-md text-gray-200 dark:text-gray-900 bg-gray-900 dark:bg-white top-20 right-0 w-[35vw] p-5 fixed h-3/4 z-40 ease-in-out duration-300 ${
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
