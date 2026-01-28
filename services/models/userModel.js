export const ROLES = ['parent', 'family', 'kid'];

export function normalizeUser(input) {
  return {
    userId: input.userId,
    householdId: input.householdId,
    role: input.role
  };
}
