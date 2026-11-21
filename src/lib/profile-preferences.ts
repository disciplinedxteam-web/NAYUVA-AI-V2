export type ProfilePrefs = { photo: string; name: string; relationship: string; designation: string; registration: string; reminders: string };

// Never read the old role-wide caregiver key: its contents have no trustworthy owner.
export function profilePreferenceKey(role: string, profileId?: string) {
  return role === 'care-team' ? 'nayuva-profile-care-team' : profileId ? `nayuva-profile-caregiver-${profileId}` : null;
}

export function profileDefaults(name: string, relationship = 'Mother'): ProfilePrefs {
  return { photo: '', name, relationship, designation: 'Paediatrician', registration: '', reminders: 'WhatsApp' };
}

export function readProfilePrefs(storage: Pick<Storage, 'getItem'>, role: string, profileId?: string): Partial<ProfilePrefs> {
  const key = profilePreferenceKey(role, profileId);
  if (!key) return {};
  try {
    const parsed: unknown = JSON.parse(storage.getItem(key) ?? '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const result: Partial<ProfilePrefs> = {};
    for (const field of ['photo', 'name', 'relationship', 'designation', 'registration', 'reminders'] as const) {
      const value = (parsed as Record<string, unknown>)[field];
      if (typeof value === 'string') result[field] = value;
    }
    return result;
  } catch { return {}; }
}