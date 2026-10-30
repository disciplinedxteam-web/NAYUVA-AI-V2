import { describe, expect, it } from 'vitest';
import { splitSutraSources, sutraSpeechLanguage, sutraGuidance } from '@/lib/sutra-domain';
describe('Sutra replies', () => {
  it('moves the SOURCES line out of the answer', () => {
    const r = splitSutraSources('The last visit was on **21 Oct**.\n\nSOURCES: a1b2c3d4-0000, c9f8e7d6-1111');
    expect(r.body).toBe('The last visit was on **21 Oct**.');
    expect(r.sources).toEqual(['a1b2c3d4-0000', 'c9f8e7d6-1111']);
  });
  it('reads stored source markers and strips inline bracket citations', () => {
    const r = splitSutraSources('Plan created [Care Plan · 21 Oct].\n\n[[sources:e12345678]]');
    expect(r.body).toBe('Plan created.');
    expect(r.sources).toEqual(['e12345678']);
  });
  it('has no sources when none were used', () => { expect(splitSutraSources('I could not find that yet.').sources).toEqual([]); });
  it('removes emojis', () => { expect(splitSutraSources('All good 😊').body).toBe('All good'); });
  it('speaks Hindi script in Hindi and Tamil in Tamil', () => {
    expect(sutraSpeechLanguage('पिछली मुलाकात 21 अक्टूबर को थी')).toBe('hi-IN');
    expect(sutraSpeechLanguage('கடைசி சந்திப்பு')).toBe('ta-IN');
    expect(sutraSpeechLanguage('The last visit')).toBe('en-IN');
  });
  it('forbids emojis and requires language mirroring', () => {
    expect(sutraGuidance).toMatch(/Never use emojis/);
    expect(sutraGuidance).toMatch(/SAME language/);
  });
});
