import React, { useCallback, useContext, useEffect, useState } from "react";
import { createDataTestId } from "../../lib/create-data-testid";
import { Button, VStack, Input, FormControl, FormLabel, FormErrorMessage } from "@chakra-ui/react";
import { useTipFormManagement } from "./useTipFormManagement";
import { useFormik } from "formik";
import { BigNumber, ethers } from "ethers";
import { CurrentAddressContext, ProviderContext, SignerContext } from "../../hardhat/HardhatContext";
import { erc20Abi, yGiftContractAddress } from "../CreateGift";
import { erc20TokensData } from "../CreateGift/Erc20Select";

export const componentDataTestId = createDataTestId("Tip");

export const params = ["_tokenId", "_amount", "_msg"];

interface IProps {
  tokenId: string;
  tokenContractAddress: string;
  isOpen: boolean;
}

const Tip: React.FunctionComponent<IProps> = ({ tokenId, isOpen, tokenContractAddress }) => {
  const management = useTipFormManagement(tokenId);
  const [provider] = useContext(ProviderContext);
  const [signer] = useContext(SignerContext);
  const [currentAddress] = useContext(CurrentAddressContext);
  const formik = useFormik(management);

  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [maxAmount, setMaxAmount] = useState<number>(0);
  const [erc20Contract, setErc20Contract] = useState<ethers.Contract | undefined>(undefined);
  const [isApproving, setIsApproving] = useState<boolean>(false);

  useEffect(() => {
    const fetch = async () => {
      if (tokenContractAddress === "") {
        setMaxAmount(0);
      }
      // Resolve ens for _token
      const resolvedToken =
        (tokenContractAddress.length > 3 && (await provider?.resolveName(tokenContractAddress))) ||
        tokenContractAddress;
      if (!ethers.utils.isAddress(resolvedToken)) {
        return;
      }
      if (signer && tokenContractAddress) {
        console.log(tokenContractAddress);
        const erc20Contract = new ethers.Contract(resolvedToken, erc20Abi, provider).connect(signer);
        setErc20Contract(erc20Contract);

        const filter = erc20Contract?.filters.Approval(currentAddress, yGiftContractAddress);
        const events = await erc20Contract.queryFilter(filter);
        console.log(events);
        setIsApproved(events?.length > 0);

        if (events?.length > 0) {
          const balance = await erc20Contract.balanceOf(currentAddress);
          console.log(balance?.toString());
          setMaxAmount(balance);
        }
      }
    };
    fetch();
  }, [tokenContractAddress, currentAddress, provider, signer, isOpen]);

  const erc20Approve = useCallback(() => {
    setIsApproving(true);
    const fetch = async () => {
      if (erc20Contract && signer) {
        try {
          erc20Contract.connect(signer);
          const tx = (erc20Contract as any).approve(yGiftContractAddress, BigNumber.from(2).pow(256).sub(1));
          const approveTx = await tx;
          await approveTx?.wait();
          setIsApproved(true);
          setIsApproving(false);
        } catch (e) {
          console.error(e);
          setIsApproving(false);
        }
      }
    };

    fetch();
  }, [erc20Contract, signer]);

  return (
    <form onSubmit={formik.handleSubmit}>
      <VStack spacing={2}>
        {params.map((param, index) => {
          if (param === "_tokenId") {
            return null;
          }
          return (
            <FormControl key={param} isInvalid={Boolean(formik.errors[index] && formik.touched[index])}>
              {maxAmount && param === "_amount" ? (
                <FormLabel textAlign="center" htmlFor="_amount">
                  {`Max: $${
                    erc20TokensData.find((token) => token.address.toLowerCase() === tokenContractAddress.toLowerCase())
                      ?.symbol
                  } ${ethers.utils.formatUnits(
                    maxAmount,
                    erc20TokensData.find((token) => token.address.toLowerCase() === tokenContractAddress?.toLowerCase())
                      ?.decimals
                  )}`}
                </FormLabel>
              ) : null}
              <FormLabel htmlFor={param}>
                {param === "_amount"
                  ? `$${
                      erc20TokensData.find(
                        (token) => token.address.toLowerCase() === tokenContractAddress.toLowerCase()
                      )?.symbol
                    } Amount`
                  : "Message"}
              </FormLabel>
              <Input
                key={param}
                data-testid={param}
                id={index.toString()}
                name={index.toString()}
                onChange={formik.handleChange}
                type={param === "_amount" ? "number" : "text"}
                value={formik.values[index]?.toString()}
                max={
                  param === "_amount"
                    ? ethers.utils.formatUnits(
                        maxAmount,
                        erc20TokensData.find(
                          (token) => token.address.toLowerCase() === tokenContractAddress?.toLowerCase()
                        )?.decimals
                      )
                    : undefined
                }
                min={param === "_amount" ? "0" : undefined}
                step={param === "_amount" ? "0.0001" : undefined}
              />
              <FormErrorMessage>{formik.errors[index]}</FormErrorMessage>
            </FormControl>
          );
        })}

        <Button
          data-testid={"submit"}
          type={isApproved ? "submit" : "button"}
          disabled={formik.isSubmitting || isApproving}
          onClick={() => {
            !isApproved && erc20Approve();
          }}
          isLoading={isApproving}
        >
          {isApproved ? "Tip" : "Approve"}
        </Button>
      </VStack>
    </form>
  );
};

export { Tip };
