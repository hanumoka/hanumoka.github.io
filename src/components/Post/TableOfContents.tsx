// @ts-nocheck // TODO: 나중에 타입스크립트 
import React , {FunctionComponent} from 'react'

const TableOfContents: FunctionComponent = function ({toc}) {
    return (
        <div className="toc-container">
          <div className="toc-wrapper">
            <div className="toc-content">
              <div className="toc" dangerouslySetInnerHTML={{ __html: toc }} />
            </div>
            {/* <div className="toc-open-btn" onClick={onClickTOCOpen}></div> */}
          </div>
        </div>
      )
}

export default TableOfContents;
