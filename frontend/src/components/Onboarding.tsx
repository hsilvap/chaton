import { useState, type FormEvent } from "react";
import { Flex, Stack, Text } from "@chakra-ui/react";
import { UserService } from "../../bindings/github.com/hsilvap/chaton";
import { Button, Panel, PixelKitten, TextInput } from "../ds";
import type { User } from "../types";
import { errorMessage } from "../errors";

type OnboardingProps = {
  onDone: (user: User) => void;
};

export function Onboarding({ onDone }: OnboardingProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      onDone(await UserService.Onboard(name, email));
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const field = (
    label: string,
    value: string,
    set: (v: string) => void,
    props: { type?: string; placeholder: string; autoFocus?: boolean },
  ) => (
    <Stack gap="1.5">
      <Text color="fg.muted" fontSize="xs">
        {label}
      </Text>
      <TextInput
        value={value}
        onChange={(e) => {
          set(e.target.value);
          setError(null);
        }}
        spellCheck={false}
        autoComplete="off"
        {...props}
      />
    </Stack>
  );

  return (
    <Flex flex="1" align="center" justify="center" p="frame">
      <Panel title="welcome to chaton" w="full" maxW="420px" flex="0 0 auto">
        <form onSubmit={onSubmit}>
          <Stack gap="4" p="2">
            <Flex align="center" gap="3">
              <PixelKitten seed="chaton" size={40} />
              <Text color="fg.muted">Tell chaton who you are.</Text>
            </Flex>
            {field("preferred name", name, setName, {
              placeholder: "how should chaton call you",
              autoFocus: true,
            })}
            {field("email", email, setEmail, {
              type: "email",
              placeholder: "you@example.com",
            })}
            {error && (
              <Text color="red.400" fontSize="xs">
                {error}
              </Text>
            )}
            <Flex justify="flex-end">
              <Button
                type="submit"
                variant="solid"
                disabled={busy || !name.trim() || !email.trim()}
              >
                start ↵
              </Button>
            </Flex>
          </Stack>
        </form>
      </Panel>
    </Flex>
  );
}
