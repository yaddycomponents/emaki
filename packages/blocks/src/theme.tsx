import { type Theme, warmEditorial } from "@emaki/themes";
import {
  createContext,
  createElement,
  type ReactNode,
  useContext,
  useMemo,
} from "react";
import { makeStyles, type Styles } from "./styles";

/** The active theme. Defaults to warm-editorial so blocks render standalone. */
export const ThemeContext = createContext<Theme>(warmEditorial);

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export function useStyles(): Styles {
  const theme = useTheme();
  return useMemo(() => makeStyles(theme), [theme]);
}

export function ThemeProvider({
  theme,
  children,
}: {
  theme: Theme;
  children: ReactNode;
}) {
  return createElement(ThemeContext.Provider, { value: theme }, children);
}
