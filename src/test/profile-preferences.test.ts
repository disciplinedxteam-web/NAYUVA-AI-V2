import { describe, expect, it } from 'vitest';
import { profileDefaults, profilePreferenceKey, readProfilePrefs } from '@/lib/profile-preferences';

describe('caregiver profile isolation', () => {
  it('keeps photos separate for two caregiver profiles', () => {
    const entries: Record<string, string> = { 'nayuva-profile-caregiver-a': JSON.stringify({ photo: 'photo-a' }), 'nayuva-profile-caregiver-b': JSON.stringify({ photo: 'photo-b' }) };
    const storage = { getItem: (key: string) => entries[key] ?? null };
    expect(readProfilePrefs(storage, 'caregiver', 'a').photo).toBe('photo-a');
    expect(readProfilePrefs(storage, 'caregiver', 'b').photo).toBe('photo-b');
    expect(readProfilePrefs(storage, 'caregiver', 'c').photo).toBeUndefined();
  });
  it('never adopts another caregiver’s old shared name or picture', () => {
    const storage = { getItem: (key: string) => key === 'nayuva-profile-caregiver' ? JSON.stringify({ name: 'Sudha', photo: 'previous-photo' }) : null };
    const prefs = { ...profileDefaults('David', 'Father'), ...readProfilePrefs(storage, 'caregiver', 'charvi') };
    expect(prefs.name).toBe('David'); expect(prefs.photo).toBe(''); expect(prefs.relationship).toBe('Father');
    expect(readProfilePrefs(storage, 'caregiver')).toEqual({});
  });
  it('preserves the existing care-team preference key', () => {
    expect(profilePreferenceKey('care-team')).toBe('nayuva-profile-care-team');
  });
});