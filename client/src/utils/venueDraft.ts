const getDraftKey = (userId: string) => `venue_draft_${userId}`;

export const saveDraft = (userId: string, values: unknown): void =>
  sessionStorage.setItem(getDraftKey(userId), JSON.stringify(values));

export const loadDraft = <T>(userId: string): T | null => {
  const raw = sessionStorage.getItem(getDraftKey(userId));
  return raw ? (JSON.parse(raw) as T) : null;
};

export const clearDraft = (userId: string): void => sessionStorage.removeItem(getDraftKey(userId));
