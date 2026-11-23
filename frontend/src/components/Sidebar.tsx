import { Box, Flex, Stack, Text } from "@chakra-ui/react";
import { BorderButton, ListItem, Panel, PixelKitten, Tooltip } from "../ds";
import type { Session } from "../types";
import { basename, tildify } from "../paths";
import { sessionPage } from "../pages";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  sessions: Session[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNewSession: () => void;
  onOpenSettings: () => void;
};

export function Sidebar({
  collapsed,
  onToggle,
  sessions,
  activeId,
  onSelect,
  onClose,
  onNewSession,
  onOpenSettings,
}: SidebarProps) {
  return (
    <Box
      display="flex"
      flexShrink={0}
      flexGrow={0}
      w={collapsed ? "36px" : "260px"}
      minW={0}
    >
      <Panel
        flex="1"
        title={collapsed ? undefined : "sessions"}
        actions={
          <>
            {!collapsed && (
              <BorderButton onClick={onNewSession} aria-label="New session">
                +
              </BorderButton>
            )}
            <BorderButton
              onClick={onToggle}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
            >
              {collapsed ? "»" : "«"}
            </BorderButton>
          </>
        }
        footer={
          <Tooltip content="Settings, mcp, agents, and more">
            <BorderButton
              onClick={onOpenSettings}
              aria-label="Settings"
              fontSize="xl"
            >
              ⚙
            </BorderButton>
          </Tooltip>
        }
        css={
          collapsed
            ? { "& > header, & > footer": { justifyContent: "center" } }
            : undefined
        }
        bodyProps={{ px: 0 }}
      >
        {collapsed ? (
          <Stack gap="1" align="center">
            {sessions.map((s) => (
              <Tooltip
                key={s.id}
                content={basename(s.path)}
                positioning={{ placement: "right" }}
              >
                <ListItem
                  active={s.id === activeId}
                  onClick={() => onSelect(s.id)}
                  aria-label={basename(s.path)}
                  w="auto"
                  p="1"
                >
                  <PixelKitten seed={s.id} size={20} />
                </ListItem>
              </Tooltip>
            ))}
          </Stack>
        ) : (
          (sessions.length === 0 ? (
            <Text color="fg.muted" px="2">
              ~ no sessions yet, hit +
            </Text>
          ) : (
            <Stack gap="0">
              {sessions.map((s, i) => {
                const active = s.id === activeId;
                return (
                  <Box key={s.id} position="relative">
                    <ListItem
                      active={active}
                      onClick={() => onSelect(s.id)}
                      title={s.path}
                      pr="6"
                    >
                      <Flex align="center" gap="2">
                        <Text
                          as="span"
                          display="none"
                          _teletext={{ display: "inline" }}
                        >
                          {sessionPage(i)}
                        </Text>
                        <PixelKitten seed={s.id} size={28} />
                        <Box minW={0}>
                          <Text truncate>{basename(s.path)}</Text>
                          <Text color="fg.muted" fontSize="xs" truncate>
                            {tildify(s.path)}
                          </Text>
                        </Box>
                      </Flex>
                    </ListItem>
                    <BorderButton
                      onClick={() => onClose(s.id)}
                      aria-label={`Close ${basename(s.path)}`}
                      position="absolute"
                      top="1.5"
                      right="2"
                      _teletext={active ? { color: "accent.fg" } : undefined}
                    >
                      ×
                    </BorderButton>
                  </Box>
                );
              })}
            </Stack>
          ))
        )}
      </Panel>
    </Box>
  );
}
