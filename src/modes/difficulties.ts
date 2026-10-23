export const difficulties = [{ id: 'advanced', name: 'Advanced' }] as const;

export type DifficultyId = (typeof difficulties)[number]['id'];
