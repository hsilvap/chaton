import { useEffect, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { PixelKitten } from "../ds";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "2-digit",
  month: "short",
});

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

type TeletextHeaderProps = {
  page: number;
};

export function TeletextHeader({ page }: TeletextHeaderProps) {
  const now = useNow();

  return (
    <Flex
      as="header"
      align="center"
      gap="3"
      px="gap"
      pt="gap"
      flexShrink={0}
      textTransform="uppercase"
      fontSize="md"
      lineHeight="1"
    >
      <Text>P{page}</Text>
      <Flex align="center" gap="2" bg="accent" color="accent.fg" px="2" py="1">
        <PixelKitten seed="chaton" size={16} />
        <Text>chaton</Text>
      </Flex>
      <Box flex="1" h="2" bg="border" />
      <Text color="fg.muted">{dateFormat.format(now).replace(",", "")}</Text>
      <Text color="tele.yellow">{timeFormat.format(now)}</Text>
    </Flex>
  );
}
