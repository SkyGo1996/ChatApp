import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import type { AppDispatch, RootState } from "@/store";
import {
  blockContact,
  isContactBlocked,
  unblockContact,
} from "@/store/slices/blockedSlice";

/**
 * Deep seam for client-only Block flag per Contact.
 * Ticket 11 Profile sheet + Chat guard must use this — never read MMKV directly.
 */
export function useBlock(contactId: string | number): {
  isBlocked: boolean;
  block: () => void;
  unblock: () => void;
} {
  const dispatch = useDispatch<AppDispatch>();
  const isBlocked = useSelector((s: RootState) =>
    isContactBlocked(s.blocked, contactId)
  );
  const block = useCallback(() => {
    dispatch(blockContact(contactId));
  }, [dispatch, contactId]);
  const unblock = useCallback(() => {
    dispatch(unblockContact(contactId));
  }, [dispatch, contactId]);
  return { isBlocked, block, unblock };
}
