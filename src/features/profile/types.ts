/**
 * Profile feature types — Profile is owned here (spec glossary).
 * About/bio intentionally omitted per spec FR4 deviation — no profiles augment.
 * Cross-feature imports re-export from this file; never redefine.
 */
export type Profile = {
  id: number;
  name: string;
  avatar: string;
  phone: string;
};
