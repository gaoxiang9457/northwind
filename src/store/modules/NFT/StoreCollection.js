import * as types from "../../types/NFT/collection";

import collectionApi from "@/api/nft/collection";
import commonApi from "@/api/common";
import utilsTools from "@utils/tool";
import { cloneDeep } from "lodash";
import NFT_CONSTANTS from "@constants/nft.js";
import Wallet from "@wallet";
import utilsFormat from "@utils/format";

const StoreCollection = {
  namespaced: true,
  moduleName: "StoreCollection",
  state: {
    groupList: null,
    change_confirm_visible: false,
    show_rules: [true, true],
    unsold_nft_data: [],
    unsold_box_data: [],
    detail_info: null,
    detail_type: null,
    sellingData: null,
    isLoading: true,
    purchaseData: [],
    sellRecordData: [],
    dialogParams: NFT_CONSTANTS.INIT_DIALOG_PARAMS,
    secondDialogParams: NFT_CONSTANTS.INIT_SECOND_DIALOG_PARAMS,
    soldDialogParams: NFT_CONSTANTS.INIT_SOLD_DIALOG_PARAMS,
    onSellIsLoading: false,
    purchaseQuery: {
      pageNum: 0,
      hasNext: true,
    },
    sellQuery: {
      pageNum: 0,
      hasNext: true,
    },
  },
  mutations: {
    [types.CHANGE_SOLD_DIALOG_PARAMS](state, payload) {
      state.soldDialogParams = Object.assign(
        {},
        state.soldDialogParams,
        payload
      );
    },
    [types.CHANGE_ON_SELL_IS_LOADING](state, payload) {
      state.onSellIsLoading = payload;
    },
    [types.SET_SALE_HISTORY_QUERY](state, payload) {
      state.sellQuery = payload;
    },
    [types.SET_PURCHASE_HISTORY_QUERY](state, payload) {
      state.purchaseQuery = payload;
    },
    [types.SET_SALE_HISTORY_DATA](state, payload) {
      const { data } = payload;
      state.sellRecordData = data;
      state.isLoading = false;
    },
    [types.SET_PURCHASE_HISTORY_DATA](state, payload) {
      const { data } = payload;
      state.purchaseData = data;
      state.isLoading = false;
    },
    [types.SET_SELLING_DATA](state, payload) {
      state.sellingData = payload;
      state.onSellIsLoading = false;
    },
    [types.SET_LOADING_STATUS](state, payload) {
      state.isLoading = payload;
    },
    [types.SET_DETAIL_TYPE](state, payload) {
      state.detail_type = payload;
    },
    [types.SET_DETAIL_INFO](state, payload) {
      state.detail_info = payload;
    },
    [types.SET_SHOW_RULES](state, payload) {
      state.show_rules = payload;
    },
    [types.SET_UNSOLD_NFT_DATA](state, data) {
      state.unsold_nft_data = data;
    },

    [types.SET_UNSOLD_BOX_DATA](state, data) {
      if (data && data.length) {
        state.unsold_box_data = state.unsold_box_data.concat(data);
      } else {
        state.unsold_box_data = [];
      }
    },
    [types.CHANGE_DIALOG_STATUS](state, payload) {
      state.dialogParams = Object.assign({}, state.dialogParams, payload);
    },
    [types.CHANGE_SECOND_DIALOG_STATUS](state, payload) {
      state.secondDialogParams = Object.assign(
        {},
        state.secondDialogParams,
        payload
      );
    },
  },
  getters: {
    selling_data: (state) => {
      const rules = state.show_rules;
      let list = cloneDeep(state.sellingData || []);
      if (list && list.length > 0) {
        if (rules[0] && !rules[1]) {
          list = list.filter((d) => d.type === "box");
        }
        if (!rules[0] && rules[1]) {
          list = list.filter((d) => d.type === "nft");
        }
        if (!rules[0] && !rules[1]) {
          list = [];
        }
      }
      return list;
    },
    unsold_data: (state) => {
      const reverseArr = cloneDeep(state.unsold_box_data).reverse();
      let list = [...state.unsold_nft_data, ...reverseArr];
      const rules = state.show_rules;
      if (rules[0] && !rules[1]) {
        // ??????box
        list = list.filter((d) => d.nft === false);
      }
      if (!rules[0] && rules[1]) {
        list = list.filter((d) => d.nft === true);
      }
      if (!rules[0] && !rules[1]) {
        list = [];
      }
      return list;
    },
    tab_list(state) {
      const list = [...state.unsold_nft_data, ...state.unsold_box_data];
      let len = list.length;
      return [
        {
          name: "?????????",
          num: len,
          key: 1,
          showCount: true,
        },
        {
          name: "?????????",
          num: (state.sellingData && state.sellingData.length) || 0,
          key: 2,
          showCount: true,
        },
        {
          name: "????????????",
          key: 3,
          showCount: false,
        },
        {
          name: "????????????",
          key: 4,
          showCount: false,
        },
      ];
    },
  },
  actions: {
    //???????????????????????????
    async getBoxDetail({ commit }, payload) {
      let res = await collectionApi.getBoxDetail(
        payload.boxToken,
        payload.payToken
      );
      if (res.code === 200) {
        if (payload.type === "list") {
          let bidData = {
            id: res.data.id,
            icon: res.data.boxTokenLogo,
            name: res.data.name,
            nftBody: res.data.nftBody,
            nftMeta: res.data.nftMeta,
            nft: false,
            sellType: "",
            type: "box",
            boxToken: payload.boxToken,
            address: res.data.boxToken,
            payToken: payload.payToken,
          };
          let list = [];
          if (payload.count > 1) {
            for (let i = 0; i < payload.count; i++) {
              list.push(bidData);
            }
          }
          if (list && list.length) {
            commit(types.SET_UNSOLD_BOX_DATA, list);
          } else {
            commit(types.SET_UNSOLD_BOX_DATA, [bidData]);
          }
        } else if (payload.type === "detail") {
          commit(types.SET_DETAIL_INFO, res.data);
          commit(types.SET_DETAIL_TYPE, "box");
        }
      }
    },

    //???????????????
    /* eslint-disable-next-line*/
    async getUnsoldBID({}, payload) {
      let list = [];
      if (payload.resourceList) {
        for (const [k, v] of Object.entries(payload.resourceList)) {
          payload.data.map((item) => {
            // ?????????????????????
            // ???????????????????????????????????????
            let matchString = item.boxToken.replace("::KikoCatBox", "");
            let boxToken = k.match(matchString);
            if (boxToken) {
              if (v.json.token) {
                list.push({
                  boxToken: boxToken[0] + "::KikoCatBox",
                  amount: String(v.json.token.value),
                  payToken: item.payToken,
                });
              }
            }
          });
        }
        return list;
      }
    },
    //?????????NFT
    /* eslint-disable-next-line*/
    async getUnsoldNft({}, payload) {
      let list = [];
      if (payload.resourceList) {
        for (let [k, v] of Object.entries(payload.resourceList)) {
          payload.data.map((item) => {
            let matchString = `${item.nftMeta}, ${item.nftBody}`;
            if (k.includes(matchString)) {
              const items = v.json.items;
              items.map(async (d) => {
                let obj = {
                  icon: utilsTools.hexCharCodeToStr(d["base_meta"]["image"]),
                  name: utilsTools.hexCharCodeToStr(d["base_meta"]["name"]),
                  address: k,
                  nftId: d.id,
                  nftMeta: item.nftMeta,
                  nftBody: item.nftBody,
                  id: d.id,
                  nft: true,
                  sellType: "",
                  payToken: item.payToken,
                  type: "nft",
                  isUnSoldNft: true,
                };
                list.push(obj);
              });
            }
          });
        }
        return list;
      }
      return [];
    },
    //?????????nft??????
    async getNftDetail({ commit }, payload) {
      const res = await collectionApi.getNftDetail(
        payload.nftMeta,
        payload.nftBody,
        payload.nftId,
        payload.payToken
      );
      if (res.code === 200) {
        commit(types.SET_DETAIL_INFO, res.data);
        commit(types.SET_DETAIL_TYPE, "nft");
      }
    },
    async groupList({ commit, dispatch }, payload) {
      commit(types.SET_LOADING_STATUS, true);
      console.time("===collection api request===");
      console.time("===collection contracts===");
      Promise.allSettled([
        collectionApi.groupList(),
        commonApi.getUserResourceList(payload),
      ]).then(async ([resGroupList, resResourceList]) => {
        if (
          resGroupList.status === "fulfilled" &&
          resGroupList.value.code === 200 &&
          resResourceList.status === "fulfilled" &&
          resResourceList.value.result
        ) {
          console.timeEnd("===collection contracts===");
          const resourceList = resResourceList.value.result.resources;
          const resNFT = await dispatch("getUnsoldNft", {
            userAddress: payload,
            data: resGroupList.value.data,
            resourceList,
          });
          if (resNFT && resNFT.length > 0) {
            commit(types.SET_UNSOLD_NFT_DATA, resNFT.reverse());
            commit(types.SET_LOADING_STATUS, false);
          }
          const resBlindBox = await dispatch("getUnsoldBID", {
            userAddress: payload,
            data: resGroupList.value.data,
            resourceList,
          });
          if (resBlindBox && resBlindBox.length > 0) {
            resBlindBox.map(async (item) => {
              console.log("resBlindBox=>item.amount", item.amount);
              if (Number(item.amount) > 0) {
                console.time("===box detail===");
                await dispatch("getBoxDetail", {
                  boxToken: item.boxToken,
                  payToken: item.payToken,
                  count: item.amount,
                  type: "list",
                });
                commit(types.SET_LOADING_STATUS, false);
                console.timeEnd("===box detail===");
              }
            });
          }
          setTimeout(() => {
            commit(types.SET_LOADING_STATUS, false);
          }, 1500);
        }
        console.timeEnd("===collection api request===");
      });
    },
    //????????????????????????
    async getSellingData({ commit }, userAddress) {
      commit(types.CHANGE_ON_SELL_IS_LOADING, true);
      const res = await collectionApi.getSellingData(userAddress);
      if (res.code === 200) {
        if (res.data && res.data.length) {
          res.data.reverse();
        }
        commit(types.SET_SELLING_DATA, res.data);
      }
    },
    //?????????????????????
    //?????????nft??????
    async getSellingNftDetail({ commit }, infoId) {
      const res = await collectionApi.getSellingNftDetail(infoId);
      if (res.code === 200) {
        commit(types.SET_DETAIL_INFO, res.data);
        commit(types.SET_DETAIL_TYPE, "nft");
      }
    },
    async getSellingBoxDetail({ commit }, payload) {
      const res = await collectionApi.getSellingBoxDetail(
        payload.groupId,
        payload.chainId
      );
      if (res.code === 200) {
        commit(types.SET_DETAIL_INFO, res.data);
        commit(types.SET_DETAIL_TYPE, "box");
      }
    },
    async getPurchaseHistory({ commit, state }, payload) {
      let pageNum = 1;
      if (payload.type === "change") {
        commit(types.SET_PURCHASE_HISTORY_QUERY, {
          pageNum,
        });
      } else if (payload.type === "click") {
        pageNum = state.purchaseQuery.pageNum;
        if (payload.direction === "prev") {
          if (pageNum <= 1) return;
          pageNum = pageNum - 1;
        }
        if (payload.direction === "next") {
          if (!state.purchaseQuery.hasNext) return;

          pageNum = pageNum + 1;
        }
      }
      const res = await collectionApi.getPurchaseHistory({
        address: payload.address,
        pageNum,
      });
      if (res.code === 200) {
        commit(types.SET_PURCHASE_HISTORY_DATA, {
          data: res.data,
        });
        commit(types.SET_PURCHASE_HISTORY_QUERY, {
          hasNext: res.hasNext,
          pageNum,
        });
      }
    },
    async getSalesHistory({ commit, state }, payload) {
      let pageNum = 1;
      if (payload.type === "change") {
        commit(types.SET_SALE_HISTORY_QUERY, {
          pageNum,
        });
      } else if (payload.type === "click") {
        pageNum = state.sellQuery.pageNum;
        if (payload.direction === "prev") {
          if (pageNum <= 1) return;
          pageNum = pageNum - 1;
        }
        if (payload.direction === "next") {
          if (!state.sellQuery.hasNext) return;
          pageNum = pageNum + 1;
        }
      }
      const res = await collectionApi.getSalesHistory({
        address: payload.address,
        pageNum,
      });
      if (res.code === 200) {
        commit(types.SET_SALE_HISTORY_DATA, {
          data: res.data,
        });
        commit(types.SET_SALE_HISTORY_QUERY, {
          hasNext: res.hasNext,
          pageNum,
        });
      }
    },
    /* eslint-disable-next-line*/
    async getOpenBoxIdByHash({}, payload) {
      const res = await utilsTools.getOpenBoxIdByHash({
        txnHash: payload.txnHash,
        boxToken: payload.boxToken,
      });
      console.log("====res===", res);
      if (res.result && res.result.length > 0) {
        const k = res.result.filter((d) =>
          d.type_tag.includes(payload.boxToken)
        );
        if (k && k.length) {
          const id = k[0].decode_event_data.id;
          return String(id);
        }
      }
    },
    /* eslint-disable */
    async openBlindBoxCall({ rootState, commit, dispatch }, payload) {
      commit(types.CHANGE_DIALOG_STATUS, {
        isShow: true,
        dialogText: utilsFormat.computedLangCtx("?????????"),
      });
      const boxTokenArr = payload.boxTokenArr;
      const params = {
        provider: rootState.StoreWallet.stcProvider,
        blindboxId: `${boxTokenArr[0]}::${boxTokenArr[1]}`,
        type: "OPEN",
      };
      console.time("===????????????===");
      console.time("===????????????gas??????===");
      const txnHash = await Wallet.openBlindBox(params);
      console.timeEnd("===????????????gas??????===");
      console.time("===??????????????????===");
      if (txnHash !== "error") {
        commit(types.CHANGE_DIALOG_STATUS, {
          phase1: "success",
        });
        utilsTools.pollingTxnInfo({ txnHash }).then((res) => {
          if (res === "Executed") {
            console.timeEnd("===??????????????????===");
            console.time("===????????????ID===");
            const boxToken = `${boxTokenArr[0]}::${boxTokenArr[1]}::BoxOpenEvent`;
            utilsTools
              .getOpenBoxIdByHash({ txnHash, boxToken })
              .then(async (id) => {
                console.timeEnd("===????????????ID===");
                console.time("===??????NFT===");
                const nftInfo = await collectionApi.getNftDetail(
                  payload.nftMeta,
                  payload.nftBody,
                  id
                );
                console.log("nftInfo", nftInfo.data);
                if (nftInfo.code === 200) {
                  commit(types.CHANGE_DIALOG_STATUS, {
                    phase2: "success",
                  });
                  setTimeout(() => {
                    commit(types.CHANGE_DIALOG_STATUS, {
                      title:
                        utilsFormat.computedLangCtx("??????").value +
                        " " +
                        nftInfo.data.name,
                      // TODO
                      // ??????load??????,???????????????
                      customImgUrl: nftInfo.data.imageLink, //
                      dialogStatus: "success",
                      dialogText: "",
                      successBtnText:
                        utilsFormat.computedLangCtx("?????????NFT??????"),
                      isBlindBox: false,
                    });
                  }, 500);
                  console.timeEnd("===??????NFT===");
                  console.timeEnd("===????????????===");
                }
              });
          } else {
            console.timeEnd("===????????????===");
            commit(types.CHANGE_DIALOG_STATUS, {
              dialogStatus: "failed",
              dialogText: utilsFormat.computedLangCtx("????????????"),
              customImgUrl: "",
            });
          }
        });
        // let timer = null;
        // timer = setInterval(async () => {
        //   console.count("?????????????????????");
        //   console.time("===collection??????boxId===");
        //   let id = await dispatch("getOpenBoxIdByHash", {
        //     txnHash,
        //     boxToken: `${boxTokenArr[0]}::${boxTokenArr[1]}::BoxOpenEvent`,
        //   });
        //   console.log("id", id);
        //   console.timeEnd("===collection??????boxId===");
        //   if (id) {
        //     console.timeEnd("===??????ID===");
        //     clearInterval(timer);
        //     console.time("===??????NFT===");
        //     const nftInfo = await collectionApi.getNftDetail(
        //       payload.nftMeta,
        //       payload.nftBody,
        //       id
        //     );
        //     if (nftInfo.code === 200) {
        //       console.log("nftInfo.data.", nftInfo.data);
        //       commit(types.CHANGE_DIALOG_STATUS, {
        //         phase2: "success",
        //       });
        //       setTimeout(() => {
        //         commit(types.CHANGE_DIALOG_STATUS, {
        //           title:
        //             utilsFormat.computedLangCtx("??????").value +
        //             " " +
        //             nftInfo.data.name,
        //           // TODO
        //           // ??????load??????,???????????????
        //           customImgUrl: nftInfo.data.imageLink, //
        //           dialogStatus: "success",
        //           dialogText: "",
        //           successBtnText: utilsFormat.computedLangCtx("?????????NFT??????"),
        //           isBlindBox: false,
        //         });
        //       }, 500);
        //       console.timeEnd("===??????NFT===");
        //       console.timeEnd("===????????????===");
        //     }
        //   }
        // }, 1000);
      } else {
        console.timeEnd("===????????????===");
        commit(types.CHANGE_DIALOG_STATUS, {
          dialogStatus: "failed",
          dialogText: utilsFormat.computedLangCtx("????????????"),
          customImgUrl: "",
        });
      }
    },
    async sellContractsCall({ rootState, commit, state }, payload) {
      commit(types.CHANGE_DIALOG_STATUS, {
        isShow: true,
        dialogText: utilsFormat.computedLangCtx("?????????"),
      });
      const { type, args, tyArgs } = payload;
      let params = Object.assign(
        {},
        {
          args,
          tyArgs,
          provider: rootState.StoreWallet.stcProvider,
          type: "SELL",
        }
      );
      console.time("===????????????===");
      console.time("===????????????gas??????===");
      let txnHash =
        type === "box"
          ? await Wallet.blindBoxContractCall(params)
          : type === "nft"
          ? await Wallet.nftContractCall(params)
          : "";
      console.timeEnd("===????????????gas??????===");
      if (txnHash !== "error") {
        commit(types.CHANGE_DIALOG_STATUS, {
          phase1: "success",
        });
        utilsTools.pollingTxnInfo({ txnHash }).then((res) => {
          if (res === "Executed") {
            commit(types.CHANGE_DIALOG_STATUS, {
              phase2: "success",
            });
            console.timeEnd("===????????????===");
            setTimeout(() => {
              commit(types.CHANGE_DIALOG_STATUS, {
                dialogStatus: "success",
                dialogText: utilsFormat.computedLangCtx("??????????????????"),
              });
            }, 5000);
          } else {
            console.timeEnd("===????????????===");
            commit(types.CHANGE_DIALOG_STATUS, {
              dialogStatus: "failed",
              dialogText: utilsFormat.computedLangCtx("??????????????????"),
            });
          }
        });
      } else {
        console.timeEnd("===????????????===");
        commit(types.CHANGE_DIALOG_STATUS, {
          dialogStatus: "failed",
          dialogText: utilsFormat.computedLangCtx("??????????????????"),
        });
      }
    },
    async cancelSellContractsCall({ rootState, commit }, payload) {
      let onSell;
      if (payload.type === "box") {
        const boxStatus = await collectionApi.getSellingBoxDetail(
          payload.groupId,
          payload.chainId
        );
        if (boxStatus.code === 200) {
          onSell = boxStatus.data.onSell;
        }
      } else if (payload.type === "nft") {
        const nftStatus = await collectionApi.getSellingNftDetail(
          payload.infoId
        );
        if (nftStatus.code === 200) {
          onSell = nftStatus.data.onSell;
        }
      }
      if (!onSell) {
        commit(types.CHANGE_SOLD_DIALOG_PARAMS, {
          isShow: true,
          text: utilsFormat.computedLangCtx("????????????"),
          subText: utilsFormat.computedLangCtx("??????????????????"),
          btnText: utilsFormat.computedLangCtx("??????"),
        });
        return;
      }
      commit(types.CHANGE_DIALOG_STATUS, {
        isShow: true,
        dialogText: utilsFormat.computedLangCtx("?????????"),
      });
      const { type, args, tyArgs } = payload;
      let params = Object.assign(
        {},
        {
          args,
          tyArgs,
          provider: rootState.StoreWallet.stcProvider,
          type: "OFFLINE",
        }
      );
      console.time("===collection:??????????????????===");
      console.time("===collection:??????????????????gas??????===");
      let txnHash =
        type === "box"
          ? await Wallet.blindBoxContractCall(params)
          : type === "nft"
          ? await Wallet.nftContractCall(params)
          : "";
      console.timeEnd("===collection:??????????????????gas??????===");
      if (txnHash !== "error") {
        commit(types.CHANGE_DIALOG_STATUS, {
          phase1: "success",
        });
        utilsTools.pollingTxnInfo({ txnHash }).then((res) => {
          if (res === "Executed") {
            commit(types.CHANGE_DIALOG_STATUS, {
              phase2: "success",
            });
            console.timeEnd("===collection:??????????????????======");
            setTimeout(() => {
              commit(types.CHANGE_DIALOG_STATUS, {
                dialogStatus: "success",
                dialogText: utilsFormat.computedLangCtx("??????????????????"),
              });
            }, 5000);
          } else {
            console.timeEnd("===collection:??????????????????======");
            commit(types.CHANGE_DIALOG_STATUS, {
              dialogStatus: "failed",
              dialogText: utilsFormat.computedLangCtx("??????????????????"),
            });
          }
        });
      } else {
        console.timeEnd("===collection:??????????????????===");
        commit(types.CHANGE_DIALOG_STATUS, {
          dialogStatus: "failed",
          dialogText: utilsFormat.computedLangCtx("??????????????????"),
        });
      }
    },
    async acceptBidContractsCall({ rootState, commit }, payload) {
      let onSell;
      if (payload.type === "box") {
        const boxStatus = await collectionApi.getSellingBoxDetail(
          payload.groupId,
          payload.chainId
        );
        if (boxStatus.code === 200) {
          onSell = boxStatus.data.onSell;
        }
      } else if (payload.type === "nft") {
        const nftStatus = await collectionApi.getSellingNftDetail(
          payload.infoId
        );
        if (nftStatus.code === 200) {
          onSell = nftStatus.data.onSell;
        }
      }
      if (!onSell) {
        commit(types.CHANGE_SOLD_DIALOG_PARAMS, {
          isShow: true,
          text: utilsFormat.computedLangCtx("????????????"),
          subText: utilsFormat.computedLangCtx("??????????????????"),
          btnText: utilsFormat.computedLangCtx("??????"),
        });
        return;
      }
      commit(types.CHANGE_DIALOG_STATUS, {
        isShow: true,
        dialogText: utilsFormat.computedLangCtx("???????????????"),
      });
      const { type, args, tyArgs } = payload;
      let params = Object.assign(
        {},
        {
          args,
          tyArgs,
          provider: rootState.StoreWallet.stcProvider,
          type: "ACCEPT_BID",
        }
      );
      console.time("===collection:??????????????????===");
      console.time("===collection:??????????????????gas??????===");
      let txnHash =
        type === "box"
          ? await Wallet.blindBoxContractCall(params)
          : type === "nft"
          ? await Wallet.nftContractCall(params)
          : "";
      console.timeEnd("===collection:??????????????????gas??????===");
      if (txnHash !== "error") {
        commit(types.CHANGE_DIALOG_STATUS, {
          phase1: "success",
        });
        utilsTools.pollingTxnInfo({ txnHash }).then((res) => {
          if (res === "Executed") {
            console.timeEnd("===collection:??????????????????===");
            commit(types.CHANGE_DIALOG_STATUS, {
              phase2: "success",
            });
            setTimeout(() => {
              commit(types.CHANGE_DIALOG_STATUS, {
                // dialogStatus: "success",
                // dialogText: utilsFormat.computedLangCtx("??????????????????"),
                dialogStatus: "success",
                dialogText: utilsFormat.computedLangCtx("????????????????????????", {
                  currency: payload.currency,
                  price: payload.price,
                }),
              });
            }, 5000);
          } else {
            console.timeEnd("===collection:??????????????????===");
            commit(types.CHANGE_DIALOG_STATUS, {
              dialogStatus: "failed",
              dialogText: utilsFormat.computedLangCtx("??????????????????"),
            });
          }
        });
      } else {
        console.timeEnd("===collection:??????????????????===");
        commit(types.CHANGE_DIALOG_STATUS, {
          dialogStatus: "failed",
          dialogText: utilsFormat.computedLangCtx("??????????????????"),
        });
      }
    },
    async updatePriceContractsCall({ rootState, commit }, payload) {
      let onSell;
      if (payload.type === "box") {
        const boxStatus = await collectionApi.getSellingBoxDetail(
          payload.groupId,
          payload.chainId
        );
        if (boxStatus.code === 200) {
          onSell = boxStatus.data.onSell;
        }
      } else if (payload.type === "nft") {
        const nftStatus = await collectionApi.getSellingNftDetail(
          payload.infoId
        );
        if (nftStatus.code === 200) {
          onSell = nftStatus.data.onSell;
        }
      }
      if (!onSell) {
        commit(types.CHANGE_SOLD_DIALOG_PARAMS, {
          isShow: true,
          text: utilsFormat.computedLangCtx("????????????"),
          subText: utilsFormat.computedLangCtx("??????????????????"),
          btnText: utilsFormat.computedLangCtx("??????"),
        });
        return;
      }
      commit(types.CHANGE_DIALOG_STATUS, {
        isShow: true,
        dialogText: utilsFormat.computedLangCtx("???????????????"),
      });
      const { type, args, tyArgs } = payload;
      const provider = rootState.StoreWallet.stcProvider;
      console.time("===collection:??????????????????===");
      console.time("===collection:??????????????????gas??????===");
      const txnHash =
        type === "box"
          ? await Wallet.blindBoxContractCall({
              provider,
              args,
              tyArgs,
              type: "CHANGE_PRICE",
            })
          : type === "nft"
          ? await Wallet.nftContractCall({
              provider,
              args,
              tyArgs,
              type: "CHANGE_PRICE",
            })
          : "";
      console.timeEnd("===collection:??????????????????gas??????===");
      if (txnHash !== "error") {
        commit(types.CHANGE_DIALOG_STATUS, {
          phase1: "success",
        });
        utilsTools.pollingTxnInfo({ txnHash }).then((res) => {
          if (res === "Executed") {
            console.timeEnd("===collection:??????????????????===");
            commit(types.CHANGE_DIALOG_STATUS, {
              phase2: "success",
            });
            setTimeout(() => {
              commit(types.CHANGE_DIALOG_STATUS, {
                dialogStatus: "success",
                dialogText: utilsFormat.computedLangCtx("??????????????????"),
                successBtnText: utilsFormat.computedLangCtx("??????"),
              });
            }, 5000);
          } else {
            console.timeEnd("===collection:??????????????????===");
            commit(types.CHANGE_DIALOG_STATUS, {
              dialogStatus: "failed",
              dialogText: utilsFormat.computedLangCtx("??????????????????"),
            });
          }
        });
      } else {
        console.timeEnd("===collection:??????????????????===");
        commit(types.CHANGE_DIALOG_STATUS, {
          dialogStatus: "failed",
          dialogText: utilsFormat.computedLangCtx("??????????????????"),
        });
      }
    },
  },
};

export default StoreCollection;
