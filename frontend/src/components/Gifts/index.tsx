import React, { useContext } from "react";
import { createDataTestId } from "../../lib/create-data-testid";
import { Flex, Stack, Text, Button, Wrap, WrapItem, Center, VStack, Heading } from "@chakra-ui/react";
import { yGiftContext } from "../../hardhat/HardhatContext";
import { Gift, GiftModel } from "./Gift";
import { useRouter } from "next/router";

export const params = [];

interface IProps {
  gifts: [GiftModel & { message?: string }];
}

const NoGifts: React.FC = () => {
  const router = useRouter();
  return (
    <Center width="100%" height="100%" py={"30vh"}>
      <VStack spacing={4}>
        <Heading as="h2" fontFamily="Roboto" fontWeight="bold" fontSize="40px">
          You don't have any gifts
        </Heading>
        <Button
          borderColor="#0065D0"
          borderRadius="32px"
          variant="outline"
          _hover={{ border: "1px solid grey", background: "transprent" }}
          color="#0065D0"
          fontFamily="Roboto"
          fontSize="16px"
          minWidth="200px"
          height={"56px"}
          onClick={() => {
            router.push("/create-gift");
          }}
        >
          Send a gift
        </Button>
      </VStack>
    </Center>
  );
};
const Gifts: React.FunctionComponent<IProps> = (props) => {
  return (
    <Wrap spacing={"24px"} px={6} justify="center">
      {props?.gifts?.length ? (
        props.gifts.map((gift) => (
          <WrapItem>
            <Gift {...gift}></Gift>
          </WrapItem>
        ))
      ) : (
        <NoGifts></NoGifts>
      )}
    </Wrap>
  );
};

export { Gifts };
