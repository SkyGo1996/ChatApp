import { client } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";

import type { Profile } from "@/features/profile/types";

/** Raw user shape from GET /users/:id — only a subset is exposed as Profile. */
type ApiUser = {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar: string;
  phone: string;
  website: string;
  address: { street: string; city: string; zipcode: string };
};

function toProfile(user: ApiUser): Profile {
  return {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    phone: user.phone,
  };
}

/**
 * Fetch a Contact's profile.
 * Does not use GET /profiles — v1 shows Name/Avatar/Phone only (no bio).
 */
export async function fetchProfile(
  contactId: string | number
): Promise<Profile> {
  const { data } = await client.get<ApiUser>(
    endpoints.profile.detail(contactId)
  );
  return toProfile(data);
}
