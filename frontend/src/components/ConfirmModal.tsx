import { useRef } from "react";
import { Flex, Stack, Text } from "@chakra-ui/react";
import { Button, Modal } from "../ds";

type ConfirmModalProps = {
  title: string;
  lines: string[];
  confirmLabel: string;
  onAnswer: (ok: boolean) => void;
};

export function ConfirmModal({
  title,
  lines,
  confirmLabel,
  onAnswer,
}: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  return (
    <Modal
      open
      onClose={() => onAnswer(false)}
      title={title}
      width="420px"
      initialFocusRef={confirmRef}
    >
      <Stack gap="4">
        <Stack gap="1">
          <Text color="fg.muted">This will stop:</Text>
          {lines.map((line, i) => (
            <Text key={i}>• {line}</Text>
          ))}
        </Stack>
        <Flex justify="flex-end" gap="2">
          <Button type="button" onClick={() => onAnswer(false)}>
            cancel
          </Button>
          <Button
            ref={confirmRef}
            type="button"
            variant="solid"
            onClick={() => onAnswer(true)}
          >
            {confirmLabel} ↵
          </Button>
        </Flex>
      </Stack>
    </Modal>
  );
}
