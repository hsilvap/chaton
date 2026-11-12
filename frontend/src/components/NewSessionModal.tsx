import { useRef, useState, type FormEvent } from "react";
import { Flex, Stack, Text } from "@chakra-ui/react";
import { SessionService } from "../../bindings/github.com/hsilvap/chaton";
import { Button, ListItem, Modal, TextInput } from "../ds";
import { basename, tildify } from "../paths";

type NewSessionModalProps = {
  open: boolean;
  onClose: () => void;
  recentDirs: string[];
  onCreate: (dir: string) => void;
};

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : String(err);

export function NewSessionModal({
  open,
  onClose,
  recentDirs,
  onCreate,
}: NewSessionModalProps) {
  const [path, setPath] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = () => {
    setPath("");
    setError(null);
    onClose();
  };

  const start = async (candidate = path) => {
    setBusy(true);
    try {
      const dir = await SessionService.ResolveDirectory(candidate);
      onCreate(dir);
      close();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const browse = async () => {
    const dir = await SessionService.PickDirectory();
    if (!dir) return;
    setPath(tildify(dir));
    setError(null);
    inputRef.current?.focus();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    start();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="new session"
      initialFocusRef={inputRef}
    >
      <form onSubmit={onSubmit}>
        <Stack gap="4">
          <Stack gap="1.5">
            <Text color="fg.muted" fontSize="xs">
              directory
            </Text>
            <Flex gap="2">
              <TextInput
                ref={inputRef}
                value={path}
                onChange={(e) => {
                  setPath(e.target.value);
                  setError(null);
                }}
                placeholder="~/Documents/Code/my-project"
                invalid={!!error}
                spellCheck={false}
                autoComplete="off"
              />
              <Button type="button" onClick={browse}>
                browse
              </Button>
            </Flex>
            {error && (
              <Text color="red.400" fontSize="xs">
                {error}
              </Text>
            )}
          </Stack>

          {recentDirs.length > 0 && (
            <Stack gap="1.5">
              <Text color="fg.muted" fontSize="xs">
                recent
              </Text>
              <Stack
                gap="0"
                maxH="200px"
                overflowY="auto"
                borderWidth="1px"
                borderColor="border"
                borderRadius="pane"
              >
                {recentDirs.map((dir) => {
                  const short = tildify(dir);
                  return (
                    <ListItem
                      key={dir}
                      type="button"
                      active={path === short || path === dir}
                      onClick={() => {
                        setPath(short);
                        setError(null);
                      }}
                      onDoubleClick={() => start(dir)}
                    >
                      <Text as="span">{basename(dir)}</Text>
                      <Text as="span" color="fg.muted" fontSize="xs">
                        {"  "}
                        {short}
                      </Text>
                    </ListItem>
                  );
                })}
              </Stack>
            </Stack>
          )}

          <Flex justify="flex-end" gap="2">
            <Button type="button" onClick={close}>
              cancel
            </Button>
            <Button type="submit" variant="solid" disabled={busy || !path}>
              start ↵
            </Button>
          </Flex>
        </Stack>
      </form>
    </Modal>
  );
}
