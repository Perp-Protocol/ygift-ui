import React from "react";
import { createDataTestId } from "../../../lib/create-data-testid";
import { Flex, Stack, Text, Button, VStack, Heading, HStack, Divider, useMediaQuery } from "@chakra-ui/react";
import { BigNumberish, ethers } from "ethers";
import { useGiftTransactionHistory } from "./useGiftTransactionHistory";
import { DateTime } from "luxon";
import { formatAddress } from "../../../lib/format-address";
import { erc20TokensData } from "../../CreateGift/Erc20Select";
import { useEns } from "../../../lib/use-ens";

export const componentDataTestId = createDataTestId("TransactionHistory");

export const dataTestIds = {};

export type TransactionModel = {
  date: number;
  minter: string;
  recipient: string;
  message?: string;
  amount?: BigNumberish;
  event: "Minted" | "Collected" | "Tipped" | "Transferred";
};

const Transaction: React.FC<TransactionModel & { isSmallMobileBreakpoint?: boolean; tokenContractAddress?: string }> = (
  props
) => {
  const { ensName: minterName } = useEns(props.minter, true);
  const { ensName: recipientName } = useEns(props.recipient, true);

  return (
    <HStack key={props.date} spacing={4} flexWrap={props.isSmallMobileBreakpoint ? "wrap" : "inherit"}>
      <Flex alignSelf="flex-start">
        <Text
          color="#013A6D"
          {...{
            fontFamily: "Roboto",
            fontStyle: "normal",
            fontWeight: "bold",
            fontSize: "16px",
            lineHeight: "137.88%",
          }}
          minWidth={["auto", "auto", "auto", "150px"]}
          textAlign="left"
        >
          {DateTime.fromSeconds(props.date).toHTTP()}
        </Text>
      </Flex>
      <VStack
        spacing={2}
        minWidth={["auto", "auto", "auto", "340px"]}
        alignSelf="flex-start"
        alignItems="flex-start"
        ml={props.isSmallMobileBreakpoint ? `0 !important` : "inherit"}
      >
        <VStack alignItems="flex-start">
          <Text
            color="#0065D0"
            {...{
              fontFamily: "Roboto",
              fontStyle: "normal",
              fontWeight: "normal",
              fontSize: "12px",
              lineHeight: "137.88%",
            }}
            textAlign="left"
          >{`${props.event} by`}</Text>
          <Text
            color="#013A6D"
            {...{
              fontFamily: "Roboto",
              fontStyle: "normal",
              fontWeight: "normal",
              fontSize: "16px",
              lineHeight: "137.88%",
            }}
          >
            {minterName}
          </Text>
        </VStack>
        {props.event === "Tipped" && (
          <VStack alignItems="flex-start">
            <Text
              color="#0065D0"
              {...{
                fontFamily: "Roboto",
                fontStyle: "normal",
                fontWeight: "normal",
                fontSize: "12px",
                lineHeight: "137.88%",
              }}
              textAlign="left"
            >
              Message
            </Text>
            <Text
              color="#809EBD"
              {...{
                fontFamily: "Roboto",
                fontStyle: "normal",
                fontWeight: "normal",
                fontSize: "16px",
                lineHeight: "137.88%",
              }}
              textAlign="left"
            >
              {props.message}
            </Text>
          </VStack>
        )}
      </VStack>
      <VStack spacing={2} width={["auto", "340px"]} alignSelf="flex-start" alignItems="flex-start">
        <VStack alignItems="flex-start">
          <Text
            color="#0065D0"
            {...{
              fontFamily: "Roboto",
              fontStyle: "normal",
              fontWeight: "normal",
              fontSize: "12px",
              lineHeight: "137.88%",
            }}
          >{`${props.event === "Transferred" ? "Transferred" : "Gifted"} to`}</Text>
          <Text
            color="#013A6D"
            {...{
              fontFamily: "Roboto",
              fontStyle: "normal",
              fontWeight: "normal",
              fontSize: "16px",
              lineHeight: "137.88%",
            }}
          >
            {recipientName}
          </Text>
        </VStack>
        {props.amount && (
          <VStack alignItems="flex-start">
            <Text
              color="#0065D0"
              {...{
                fontFamily: "Roboto",
                fontStyle: "normal",
                fontWeight: "normal",
                fontSize: "12px",
                lineHeight: "137.88%",
              }}
            >
              Amount
            </Text>
            <Text
              color="#013A6D"
              {...{
                fontFamily: "Roboto",
                fontStyle: "normal",
                fontWeight: "normal",
                fontSize: "16px",
                lineHeight: "137.88%",
              }}
            >
              {erc20TokensData.find(
                (token) => token.address.toLowerCase() === props.tokenContractAddress?.toLowerCase()
              )?.symbol === "None"
                ? "None"
                : `${ethers.utils.formatUnits(
                    props.amount,
                    erc20TokensData.find(
                      (token) => token.address.toLowerCase() === props.tokenContractAddress?.toLowerCase()
                    )?.decimals
                  )} $${
                    erc20TokensData.find(
                      (token) => token.address.toLowerCase() === props.tokenContractAddress?.toLowerCase()
                    )?.symbol
                  }`}
            </Text>
          </VStack>
        )}
      </VStack>
    </HStack>
  );
};

interface IProps {
  id: string;
  tokenContractAddress: string;
}

const TransactionHistory: React.FunctionComponent<IProps> = (props) => {
  const { transactionHistory } = useGiftTransactionHistory(props.id);
  console.log(transactionHistory);
  const [isSmallMobileBreakpoint] = useMediaQuery(`(max-width: 430px)`);

  if (transactionHistory?.length) {
    return (
      <VStack minHeight="400px" alignItems="flex-start" spacing={"24px"} py={"32px"} px={"24px"} overflowY="scroll">
        <Heading
          as="h3"
          {...{
            fontFamily: "Roboto",
            fontStyle: "normal",
            fontWeight: "bold",
            fontSize: "24px",
            lineHeight: "126.39%",
            color: "#013A6D",
          }}
        >
          Gift History
        </Heading>
        {transactionHistory.map((transaction, index) =>
          index !== transactionHistory.length - 1 ? (
            <React.Fragment key={`${transaction?.date}-${index}`}>
              <Transaction
                key={`${transaction?.date}-${index}`}
                {...transaction}
                tokenContractAddress={props.tokenContractAddress}
                isSmallMobileBreakpoint={isSmallMobileBreakpoint}
              ></Transaction>
              <Divider></Divider>
            </React.Fragment>
          ) : (
            <Transaction
              key={`${transaction?.date}-${index}`}
              {...transaction}
              tokenContractAddress={props.tokenContractAddress}
              isSmallMobileBreakpoint={isSmallMobileBreakpoint}
            ></Transaction>
          )
        )}
      </VStack>
    );
  }
  return null;
};

export { TransactionHistory };
