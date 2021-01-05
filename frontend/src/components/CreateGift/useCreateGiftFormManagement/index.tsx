import { useCallback, useContext, useState } from "react";
import { CurrentAddressContext, ProviderContext, yGiftContext } from "../../../hardhat/HardhatContext";
import { YGift } from "../../../hardhat/typechain/YGift";
import { DateTime, Duration } from "luxon";
import { BigNumber, ethers } from "ethers";
import { useRouter } from "next/router";
import { erc20TokensData } from "../Erc20Select";

export function useCreateGiftFormManagement() {
  const [currentAddress] = useContext(CurrentAddressContext);
  const [provider] = useContext(ProviderContext);
  const [yGift] = useContext(yGiftContext);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [giftCreatedId, setGiftCreatedId] = useState("");
  const _start = Math.floor(DateTime.local().toSeconds());
  const dayInSeconds = 86400;
  const Router = useRouter();

  const submitHandler = async (params: Parameters<YGift["mint"]>) => {
    console.log(params);
    return new Promise(async (resolve) => {
      // Convert ether to gwei
      console.log(params[2]);
      params[2] = ethers.utils.parseUnits(
        params[2].toString(),
        erc20TokensData.find((token) => token.address.toLowerCase() === params[1].toLowerCase())?.decimals
      );
      console.log(params[2]);
      // Resolve ens for _to and _token
      params[0] = (await provider?.resolveName(params[0])) || params[0];
      params[1] = (await provider?.resolveName(params[1])) || params[1];
      // Convert days to seconds
      console.log(params[7]);
      params[6] = _start + dayInSeconds * Number(params[6]);

      try {
        const gasLimit = await yGift?.instance?.estimateGas.mint.apply(null, params as any);
        const tx = yGift?.instance?.mint.apply(null, params.concat({ gasLimit: gasLimit?.add("80000") }) as any);
        const createGiftTx = await tx;
        await createGiftTx?.wait();
        setHasSubmitted(true);
        const giftMintedSentEventFilter = yGift?.instance?.filters?.GiftMinted(
          String(currentAddress),
          null,
          null,
          null
        );
        if (giftMintedSentEventFilter) {
          const logs = await provider?.getLogs({ ...giftMintedSentEventFilter, fromBlock: 0 });
          const giftsMinted = logs.map((log) => yGift?.instance?.interface?.parseLog(log)?.args);
          if (giftsMinted?.[giftsMinted.length - 1]) {
            console.log(giftsMinted);
            const giftMinted = giftsMinted?.[giftsMinted.length - 1];
            setGiftCreatedId(giftMinted?.[2]);
          }
        }
        // const parsedLogs = result?.logs.map((log) => yGift?.instance?.interface?.parseLog(log)?.args);
        // console.log(parsedLogs);
        resolve(true);
      } catch (e) {
        console.error(e);
        Router.push("/error");
        resolve(false);
      }
    });
  };
  const onSubmit = useCallback(submitHandler, [yGift, provider, currentAddress, Router]);
  // _to: string, _token: string, _amount: BigNumberish, _name: string, _msg: string, _url: string, _start: BigNumberish, _duration: BigNumberish,
  const initialValues: Parameters<YGift["mint"]> = ["", "", "", "", "", "", "", ""];
  return {
    onSubmit,
    initialValues,
    hasSubmitted,
    giftCreatedId,
  };
}
