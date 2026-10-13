import { describe, expect, it } from 'vitest';
import { normalizeCard, parseCard } from '@/lib/care-card';

describe('structured care card', () => {
  it('never defaults a missing category to Routine', () => {
    expect(normalizeCard({ topics: [{ title: 'Feeding', finding: 'Feeding well', status: 'Normal' }] }).priority).toBe('Review Needed');
  });
  it('a Routine card with a concern becomes Review Needed', () => {
    expect(normalizeCard({ priority: 'Routine', topics: [{ title: 'Stool', finding: 'No stool two days', status: 'concern' }] }).priority).toBe('Review Needed');
  });
  it('keeps Priority Review from the model', () => {
    expect(normalizeCard({ priority: 'Priority Review', topics: [{ title: 'Breathing', finding: 'Fast breathing', status: 'Concern' }] }).priority).toBe('Priority Review');
  });
  it('rejects a card with no topics', () => {
    expect(() => normalizeCard({ priority: 'Routine', topics: [] })).toThrow();
  });
  it('reads plain-text summaries as not a card', () => {
    expect(parseCard('Caregiver said all fine')).toBeNull();
  });
});
