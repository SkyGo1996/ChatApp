import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * Client-only Block map: contactId → blocked.
 * Presence of `true` means the Contact is Blocked (glossary: Block, not mute/ban).
 */
export type BlockedState = {
  blockedIds: Record<string, true>;
};

const initialState: BlockedState = {
  blockedIds: {},
};

const blockedSlice = createSlice({
  name: "blocked",
  initialState,
  reducers: {
    blockContact: (state, action: PayloadAction<string | number>) => {
      state.blockedIds[String(action.payload)] = true;
    },
    unblockContact: (state, action: PayloadAction<string | number>) => {
      delete state.blockedIds[String(action.payload)];
    },
  },
});

export const { blockContact, unblockContact } = blockedSlice.actions;

/** Whether a Contact is Blocked. Stringifies ids so route params and API numbers match. */
export function isContactBlocked(
  state: BlockedState,
  contactId: string | number
): boolean {
  return state.blockedIds[String(contactId)] === true;
}

export default blockedSlice.reducer;
