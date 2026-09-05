/**
 * Test-only MSW user fixtures for conversations feature tests.
 * Do not import from production code.
 */

export function makeUser(id: number) {
  return {
    id,
    name: `User ${id}`,
    username: `user${id}`,
    email: `user${id}@example.com`,
    avatar: `https://i.pravatar.cc/150?img=${id}`,
    phone: "+1-555-0100",
    website: "https://example.com",
    address: { street: "1 St", city: "Town", zipcode: "00000" },
  };
}
