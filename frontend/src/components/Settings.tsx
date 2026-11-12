import { useState } from "react";
import { Box, Stack, Text } from "@chakra-ui/react";
import { BorderButton, ListItem, Panel } from "../ds";

type SectionId = "skills" | "mcp" | "agents" | "presets" | "general";

const sections: { id: SectionId; label: string; description: string }[] = [
  {
    id: "skills",
    label: "skills",
    description: "Your skill library. Pick which ones a session loads.",
  },
  {
    id: "mcp",
    label: "mcp servers",
    description: "External tools a session can connect to.",
  },
  {
    id: "agents",
    label: "agents",
    description: "Subagents a session can delegate to.",
  },
  {
    id: "presets",
    label: "presets",
    description: "Saved bundles of skills, MCPs, agents, model and permissions.",
  },
  {
    id: "general",
    label: "general",
    description: "Theme, default model, paths.",
  },
];

type SettingsProps = {
  onClose: () => void;
};

export function Settings({ onClose }: SettingsProps) {
  const [sectionId, setSectionId] = useState<SectionId>("skills");
  const section = sections.find((s) => s.id === sectionId)!;

  return (
    <>
      <Box display="flex" flexShrink={0} w="260px" minW={0}>
        <Panel
          flex="1"
          title="settings"
          actions={
            <BorderButton onClick={onClose} aria-label="Close settings">
              esc
            </BorderButton>
          }
          bodyProps={{ px: 0 }}
        >
          <Stack gap="0">
            {sections.map((s) => (
              <ListItem
                key={s.id}
                active={s.id === sectionId}
                onClick={() => setSectionId(s.id)}
              >
                {s.id === sectionId ? "▸ " : "  "}
                {s.label}
              </ListItem>
            ))}
          </Stack>
        </Panel>
      </Box>

      <Box display="flex" flex="1" minW={0}>
        <Panel flex="1" title={section.label}>
          <Text color="fg.muted">{section.description}</Text>
        </Panel>
      </Box>
    </>
  );
}
