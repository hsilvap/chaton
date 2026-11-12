import type { ReactNode } from "react";
import {
  createSlotRecipeContext,
  type HTMLChakraProps,
  type RecipeVariantProps,
} from "@chakra-ui/react";
import { panelRecipe } from "../theme/recipes/panel";

type PanelVariants = RecipeVariantProps<typeof panelRecipe>;

const { withProvider, withContext } = createSlotRecipeContext({
  recipe: panelRecipe,
});

const Root = withProvider<
  HTMLElement,
  HTMLChakraProps<"section"> & PanelVariants
>("section", "root");
const Header = withContext<HTMLElement, HTMLChakraProps<"header">>(
  "header",
  "header",
);
const Footer = withContext<HTMLElement, HTMLChakraProps<"footer">>(
  "footer",
  "footer",
);
const Title = withContext<HTMLSpanElement, HTMLChakraProps<"span">>(
  "span",
  "title",
);
const Actions = withContext<HTMLSpanElement, HTMLChakraProps<"span">>(
  "span",
  "actions",
);
const Body = withContext<HTMLDivElement, HTMLChakraProps<"div">>("div", "body");

type PanelProps = Omit<HTMLChakraProps<"section">, "title"> &
  PanelVariants & {
    title?: ReactNode;
    actions?: ReactNode;
    footer?: ReactNode;
    bodyProps?: HTMLChakraProps<"div">;
  };

export function Panel({
  title,
  actions,
  footer,
  bodyProps,
  children,
  ...rootProps
}: PanelProps) {
  return (
    <Root className="group" {...rootProps}>
      {(title || actions) && (
        <Header>
          {title ? <Title>{title}</Title> : <span />}
          {actions && <Actions>{actions}</Actions>}
        </Header>
      )}
      <Body {...bodyProps}>{children}</Body>
      {footer && (
        <Footer>
          <Actions>{footer}</Actions>
        </Footer>
      )}
    </Root>
  );
}

export const PanelParts = { Root, Header, Footer, Title, Actions, Body };
