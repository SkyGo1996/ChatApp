import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

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
export default blockedSlice.reducer;
