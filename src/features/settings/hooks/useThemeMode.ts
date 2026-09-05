import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import type { ThemeMode } from "@/features/settings/types";
import type { AppDispatch, RootState } from "@/store";
import { setThemeMode } from "@/store/slices/themeSlice";
import { applyThemeMode } from "@/theme/unistyles";

/**
 * Deep seam for Theme Mode: persist via Redux + apply Unistyles runtime.
 * Ticket 12 Settings segmented control must use this — never call UnistylesRuntime directly.
 */
export function commitThemeMode(dispatch: AppDispatch, mode: ThemeMode): void {
  dispatch(setThemeMode(mode));
  applyThemeMode(mode);
}

export function useThemeMode(): {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
} {
  const dispatch = useDispatch<AppDispatch>();
  const mode = useSelector((s: RootState) => s.theme.mode);
  const setMode = useCallback(
    (next: ThemeMode) => {
      commitThemeMode(dispatch, next);
    },
    [dispatch]
  );
  return { mode, setMode };
}
