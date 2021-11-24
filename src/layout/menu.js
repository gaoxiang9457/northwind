export default [
  {
    label: "首页",
    path: "/",
  },
  {
    label: "兑换",
    path: "/swap",
  },
  {
    label: "流动性",
    path: "/liquidity",
  },
  {
    label: "NFT",
    children: [
      {
        label: "盲盒",
        path: "/nftblindbox",
      },
      {
        label: "市场",
        path: "/nftmarket",
      },
      {
        label: "我的NFT",
        path: {
          name: "nftcollection",
          params: {
            tabIndex: "1",
          },
        },
      },
      {
        label: "平台回购",
        path: "/nftbuyback",
      },
      {
        label: "NFT挖矿",
        path: "/nftmining",
      },
    ],
  },
  {
    label: "行情",
    path: "/info",
  },
  {
    label: "Farms",
    children: [
      {
        label: "交易挖矿",
        path: "/swapfarms",
      },
      {
        label: "流动性挖矿",
        path: "/liquidityfarms",
      },
    ],
  },
];
