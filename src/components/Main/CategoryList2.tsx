// @ts-nocheck
import React, { FunctionComponent, ReactNode, useEffect, useMemo } from 'react';
import styled from '@emotion/styled';
import { Link } from 'gatsby';

export type CategoryList2Props = {
  categoryList: {
    [key: string]: number;
  };
};

type CategoryItemProps = {
  active: boolean;
};

type GatsbyLinkProps = {
  children: ReactNode;
  className?: string;
  to: string;
} & CategoryItemProps;

const CategoryListWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 768px;
  margin: 50px 50px 0;

  @media (max-width: 768px) {
    width: 100%;
    margin-top: 25px;
    padding: 0 20px;
  }
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CategoryItem = styled(({ active, ...props }: GatsbyLinkProps) => <Link {...props} />)<CategoryItemProps>`
  margin-right: 20px;
  padding: 5px 0;
  font-size: 18px;
  font-weight: ${({ active }) => (active ? '800' : '400')};
  cursor: pointer;

  &:last-of-type {
    margin-right: 0;
  }

  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

const descending = (a: string, b: string) => {
  var a = a.toString();
  var b = b.toString();
  return b.localeCompare(a);
};

const CategoryList2: FunctionComponent<CategoryList2Props> = function ({ categoryList }) {
  const tags = useMemo(() => {
    return Object.entries(categoryList)
      .map((tag) => {
        return { name: tag[0].toUpperCase(), count: tag[1] };
      })
      .sort((a, b) => {
        return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
      })
      .sort((a, b) => {
        if (a.name === 'ALL') return -1;
        else return 1;
      });
  }, [categoryList]);

  // useEffect(() => {
  //   let tags = Object.entries(categoryList)
  //     .map((tag) => {
  //       return { name: tag[0].toUpperCase(), count: tag[1] };
  //     })
  //     .sort((a, b) => {
  //       return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  //     })
  //     .sort((a, b) => {
  //       if (a.name === 'ALL') return -1;
  //       else return 1;
  //     });
  //   console.log(JSON.stringify(tags));
  // }, [categoryList]);

  return (
    <>
      {/* <p className="text-4xl">Tags</p> */}
      <div>
        <CategoryListWrapper>
          {tags
            .filter((tag) => tag.name === 'ALL')
            .map((tag) => (
              <CategoryItem to={`/?category=${tag.name}`} active={false} key={tag.name}>
                #{tag.name}({tag.count})
              </CategoryItem>
            ))}
        </CategoryListWrapper>
      </div>
      <div>
        <CategoryListWrapper>
          {tags
            .filter((tag) => tag.name !== 'ALL' && /^[a-z|A-Z]+$/.test(tag.name))
            .map((tag) => (
              <CategoryItem to={`/?category=${tag.name}`} active={false} key={tag.name}>
                #{tag.name}({tag.count})
              </CategoryItem>
            ))}
        </CategoryListWrapper>
      </div>
      <div>
        <CategoryListWrapper>
          {tags
            .filter((tag) => tag.name !== 'ALL' && /^[ㄱ-ㅎ|가-힣]+$/.test(tag.name))
            .map((tag) => (
              <CategoryItem to={`/?category=${tag.name}`} active={false} key={tag.name}>
                #{tag.name}({tag.count})
              </CategoryItem>
            ))}
        </CategoryListWrapper>
      </div>
      <div>
        <CategoryListWrapper>
          {tags
            .filter((tag) => tag.name !== 'ALL' && !/^[a-z|A-Z|ㄱ-ㅎ|가-힣]+$/.test(tag.name))
            .map((tag) => (
              <CategoryItem to={`/?category=${tag.name}`} active={false} key={tag.name}>
                #{tag.name}({tag.count})
              </CategoryItem>
            ))}
        </CategoryListWrapper>
      </div>
    </>
  );
};

export default CategoryList2;
