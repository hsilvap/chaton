import type { ReactElement, ReactNode } from "react";
import { Portal, Tooltip as ChakraTooltip } from "@chakra-ui/react";

type TooltipProps = Omit<ChakraTooltip.RootProps, "children"> & {
  content: ReactNode;
  children: ReactElement;
};

export function Tooltip({ content, children, ...rootProps }: TooltipProps) {
  return (
    <ChakraTooltip.Root openDelay={300} closeDelay={0} {...rootProps}>
      <ChakraTooltip.Trigger asChild>{children}</ChakraTooltip.Trigger>
      <Portal>
        <ChakraTooltip.Positioner>
          <ChakraTooltip.Content
            bg="bg.panel"
            color="fg"
            fontFamily="body"
            fontSize="xs"
            borderWidth="1px"
            borderColor="border"
            borderRadius="pane"
            shadow="none"
            px="2"
            py="1"
          >
            {content}
          </ChakraTooltip.Content>
        </ChakraTooltip.Positioner>
      </Portal>
    </ChakraTooltip.Root>
  );
}
