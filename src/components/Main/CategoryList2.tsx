// @ts-nocheck
import React, { FunctionComponent, ReactNode, useEffect } from 'react';
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
  margin: 100px auto 0;

  @media (max-width: 768px) {
    width: 100%;
    margin-top: 50px;
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
  useEffect(() => {
    // categoryList.array.forEach((x) => {
    //   console.log(JSON.stringify(x));
    // });
    console.log(JSON.stringify(categoryList)); // 배열이 아니라 객체 형태, TODO: 객체의 프로퍼티를 배열로 변경하고 정렬하자.
  }, [categoryList]);

  return (
    <div>
      <h1>tags 페이지</h1>
      {}
    </div>
    // <CategoryListWrapper>
    //   {Object.entries(categoryList).map(([name, count]) => (
    //     <>
    //       <CategoryItem to={`/?category=${name}`} active={false} key={name}>
    //         #{name}({count})
    //       </CategoryItem>
    //     </>
    //   ))}
    // </CategoryListWrapper>
  );
};

export default CategoryList2;
