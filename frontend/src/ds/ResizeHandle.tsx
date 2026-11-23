import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { Box } from "@chakra-ui/react";

type ResizeHandleProps = {
  direction: "horizontal" | "vertical";
  thickness?: string;
  onResizeStart: () => void;
  onResize: (fraction: number) => void;
  onResizeEnd: () => void;
};

const KEY_STEP = 0.05;

export function ResizeHandle({
  direction,
  thickness = "gap",
  onResizeStart,
  onResize,
  onResizeEnd,
}: ResizeHandleProps) {
  const horizontal = direction === "horizontal";
  const size = `{spacing.${thickness}}`;
  const drag = useRef<{ from: number; span: number } | null>(null);

  const axis = (e: { clientX: number; clientY: number }) =>
    horizontal ? e.clientX : e.clientY;
  const extent = (el: Element | null) => {
    const r = el?.getBoundingClientRect();
    return (horizontal ? r?.width : r?.height) ?? 0;
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = e.currentTarget;
    const span =
      extent(el.previousElementSibling) + extent(el.nextElementSibling);
    if (span === 0) return;
    el.setPointerCapture(e.pointerId);
    drag.current = { from: axis(e), span };
    onResizeStart();
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    onResize((axis(e) - drag.current.from) / drag.current.span);
  };

  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    onResizeEnd();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const back = horizontal ? "ArrowLeft" : "ArrowUp";
    const forward = horizontal ? "ArrowRight" : "ArrowDown";
    if (e.key !== back && e.key !== forward) return;
    e.preventDefault();
    onResizeStart();
    onResize(e.key === forward ? KEY_STEP : -KEY_STEP);
    onResizeEnd();
  };

  return (
    <Box
      role="separator"
      aria-orientation={horizontal ? "vertical" : "horizontal"}
      tabIndex={0}
      flexShrink={0}
      w={horizontal ? size : "full"}
      h={horizontal ? "full" : size}
      cursor={horizontal ? "col-resize" : "row-resize"}
      touchAction="none"
      outline="none"
      position="relative"
      _after={{
        content: '""',
        position: "absolute",
        inset: horizontal ? "0 calc(50% - 1px)" : "calc(50% - 1px) 0",
        bg: "transparent",
        transition: "background 120ms",
      }}
      _hover={{ _after: { bg: "border.active" } }}
      _focusVisible={{ _after: { bg: "border.active" } }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    />
  );
}
