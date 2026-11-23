import type { ReactNode, RefObject } from "react";
import { Dialog, Portal } from "@chakra-ui/react";
import { BorderButton } from "./BorderButton";
import { Panel } from "./Panel";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
  width?: string;
  children: ReactNode;
};

export function Modal({
  open,
  onClose,
  title,
  initialFocusRef,
  width = "560px",
  children,
}: ModalProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => !e.open && onClose()}
      initialFocusEl={
        initialFocusRef ? () => initialFocusRef.current : undefined
      }
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.700" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="transparent"
            shadow="none"
            borderRadius="0"
            w={width}
            maxW="calc(100vw - 32px)"
            pt="titleRoom"
          >
            <Panel
              title={
                <Dialog.Title
                  as="span"
                  fontSize="inherit"
                  fontWeight="inherit"
                  lineHeight="inherit"
                >
                  {title}
                </Dialog.Title>
              }
              actions={
                <BorderButton onClick={onClose} aria-label="Close">
                  esc
                </BorderButton>
              }
              bodyProps={{ p: "3" }}
            >
              {children}
            </Panel>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
