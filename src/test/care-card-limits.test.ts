import { describe, expect, it } from 'vitest';
import { careCardSchema, documentTopics, normalizeCard } from '@/lib/care-card';

describe('document card rules', () => {
  it('accepts findings longer than 80 characters so Approve & Sign does not fail', () => {
    const finding = 'Feeding 8–10 times a day, latch improved since last visit, mother reports mild nipple soreness on the left side';
    expect(finding.length).toBeGreaterThan(80);
    expect(careCardSchema.safeParse({ topics: [{ title: 'Feeding', finding, status: 'Normal', quote: '' }], priority: 'Routine' }).success).toBe(true);
  });
  it('keeps the concluding summary paragraph', () => {
    expect(normalizeCard({ topics: [{ title: 'Cord', finding: 'Dry', status: 'Normal' }], priority: 'Routine', summary: 'Cord care is on track.' }).summary).toBe('Cord care is on track.');
  });
  it('omits undiscussed topics from printed documents', () => {
    const c = normalizeCard({ topics: [{ title: 'Sleep', finding: '', status: 'Not discussed' }, { title: 'Cord', finding: 'Dry', status: 'Normal' }], priority: 'Review Needed' });
    expect(documentTopics(c).map((t) => t.title)).toEqual(['Cord']);
  });
});
