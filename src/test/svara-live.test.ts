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

describe('Svara live transcript turns', () => {
  it('shows no scripted text before Svara speaks', () => {
    const l = applyMessage([], { type: 'greeting_start' });
    expect(l).toEqual([{ role: 'bot', content: '', live: true, pending: true }]);
  });
  it('gives Svara a new bubble for her reply after the caregiver speaks', () => {
    let l = applyMessage([], { type: 'greeting_start' });
    l = applyMessage(l, { type: 'server.event.transcription', role: 'bot', content: "Hi, I'm Svara from Nayuva AI." });
    l = applyMessage(l, { type: 'server.event.user_speech_start' });
    l = applyMessage(l, { type: 'server.event.transcription', role: 'user', content: 'We are fine' });
    l = applyMessage(l, { type: 'server.event.text_chunk', text: 'Glad to hear that.' });
    l = applyMessage(l, { type: 'server.event.transcription', role: 'bot', content: 'Glad to hear that.' });
    expect(l.map((x) => [x.role, x.content])).toEqual([['bot', "Hi, I'm Svara from Nayuva AI."], ['user', 'We are fine'], ['bot', 'Glad to hear that.']]);
  });
});
