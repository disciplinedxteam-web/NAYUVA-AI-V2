import { describe, expect, it } from 'vitest';
import { applyMessage } from '@/components/care/svara-voice';
import { formatMobile } from '@/components/care/svara-workspace';

describe('Svara live transcript', () => {
  it('streams Svara text chunks into one growing bubble', () => {
    let l = applyMessage([], { type: 'server.media.text_chunk', text: 'Hello ', status: 'pending' });
    l = applyMessage(l, { type: 'server.media.text_chunk', text: 'Meera', status: 'pending' });
    expect(l).toHaveLength(1);
    expect(l[0]!.content).toBe('Hello Meera');
  });
  it('replaces the caregiver typing bubble with what they said', () => {
    let l = applyMessage([], { type: 'server.event.user_speech_start' });
    l = applyMessage(l, { type: 'server.event.transcription', role: 'user', content: 'She fed four times' });
    expect(l).toEqual([{ role: 'user', content: 'She fed four times' }]);
  });
});

describe('phone number entry', () => {
  it('adds a dash after five digits', () => {
    expect(formatMobile('9880291301')).toBe('98802-91301');
    expect(formatMobile('98802')).toBe('98802');
  });
});

describe('Svara opening greeting', () => {
  it('shows the greeting first even when its words arrive after the caregiver replies', () => {
    let l = applyMessage([], { type: 'greeting_start' });
    l = applyMessage(l, { type: 'server.event.user_speech_start' });
    l = applyMessage(l, { type: 'server.event.transcription', role: 'user', content: 'Yes, now is fine' });
    l = applyMessage(l, { type: 'server.event.transcription', role: 'bot', content: "Hi, I'm Svara" });
    expect(l.map((x) => [x.role, x.content])).toEqual([['bot', "Hi, I'm Svara"], ['user', 'Yes, now is fine']]);
  });
});
