"use strict";(self.webpackChunkgatsby_starter_default=self.webpackChunkgatsby_starter_default||[]).push([[190],{7818:function(t,e,n){n.r(e),n.d(e,{default:function(){return d}});var a=n(7294),r=n(3366),i=n(2875),u=n(1082),o=n(3431),c=["active"];var l=(0,i.Z)("div",{target:"e1s36k7p1"})({name:"304v6a",styles:"display:flex;flex-wrap:wrap;width:768px;margin:50px 50px 0;@media (max-width: 768px){width:100%;margin-top:25px;padding:0 20px;}"}),m=(0,i.Z)((function(t){t.active;var e=(0,r.Z)(t,c);return(0,o.tZ)(u.Link,e)}),{target:"e1s36k7p0"})("margin-right:20px;padding:5px 0;font-size:18px;font-weight:",(function(t){return t.active?"800":"400"}),";cursor:pointer;&:last-of-type{margin-right:0;}@media (max-width: 768px){font-size:15px;}"),f=function(t){var e=t.categoryList,n=(0,a.useMemo)((function(){return Object.entries(e).map((function(t){return{name:t[0],count:t[1]}})).sort((function(t,e){return t.name<e.name?-1:t.name>e.name?1:0})).sort((function(t,e){return"ALL"===t.name?-1:1}))}),[e]);return(0,o.tZ)(a.Fragment,null,(0,o.tZ)("div",null,(0,o.tZ)(l,null,n.filter((function(t){return"ALL"===t.name})).map((function(t){return(0,o.tZ)(m,{to:"/?category="+t.name,active:!1,key:t.name},"#",t.name,"(",t.count,")")})))),(0,o.tZ)("div",null,(0,o.tZ)(l,null,n.filter((function(t){return"ALL"!==t.name&&/^[a-z|A-Z]+$/.test(t.name)})).map((function(t){return(0,o.tZ)(m,{to:"/?category="+t.name,active:!1,key:t.name},"#",t.name,"(",t.count,")")})))),(0,o.tZ)("div",null,(0,o.tZ)(l,null,n.filter((function(t){return"ALL"!==t.name&&/^[ㄱ-ㅎ|가-힣]+$/.test(t.name)})).map((function(t){return(0,o.tZ)(m,{to:"/?category="+t.name,active:!1,key:t.name},"#",t.name,"(",t.count,")")})))),(0,o.tZ)("div",null,(0,o.tZ)(l,null,n.filter((function(t){return"ALL"!==t.name&&!/^[a-z|A-Z|ㄱ-ㅎ|가-힣]+$/.test(t.name)})).map((function(t){return(0,o.tZ)(m,{to:"/?category="+t.name,active:!1,key:t.name},"#",t.name,"(",t.count,")")})))))},s=n(2203),p=n(2774),d=function(t){var e=t.location.search,n=t.data,r=n.site.siteMetadata,i=r.title,u=r.description,c=r.siteUrl,l=n.allMarkdownRemark.edges,m=n.file,d=m.childImageSharp.gatsbyImageData,g=m.publicURL,Z=s.parse(e),y="string"==typeof Z.category&&Z.category?Z.category:"All",v=(0,a.useMemo)((function(){return l.reduce((function(t,e){return e.node.frontmatter.categories.forEach((function(e){void 0===t[e]?t[e]=1:t[e]++})),t.All++,t}),{All:0})}),[]),x=a.useState(!1),h=x[0],L=x[1];return a.useEffect((function(){L(!0)}),[]),h?(0,o.tZ)("div",null,(0,o.tZ)(p.Z,{title:i,description:u,url:c,image:g,profileImage:d},(0,o.tZ)(f,{selectedCategory:y,categoryList:v}))):null}}}]);
//# sourceMappingURL=component---src-pages-tags-tsx-ad88b9101cff5ba87ec3.js.map