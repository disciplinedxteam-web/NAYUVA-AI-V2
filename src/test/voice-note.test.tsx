import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useVoiceNote } from '@/components/converse/use-voice-note';

class Recorder {
  static isTypeSupported() { return true; }
  state = 'inactive'; mimeType = 'audio/webm';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  start() { this.state = 'recording'; }
  stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new Blob(['audio-data']) }); this.onstop?.(); }
}
function setup() {
  const stopTrack = vi.fn();
  vi.stubGlobal('MediaRecorder', Recorder);
  const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] });
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
  return { stopTrack, getUserMedia };
}
afterEach(() => { vi.unstubAllGlobals(); });
describe('Converse voice messages', () => {
  it('produces an audio draft only after stopping, without dictation or automatic sending', async () => {
    setup(); const ready = vi.fn(), error = vi.fn();
    const { result } = renderHook(() => useVoiceNote(ready, error));
    await act(() => result.current.start());
    expect(result.current.recording).toBe(true); expect(ready).not.toHaveBeenCalled();
    act(() => result.current.stop());
    await waitFor(() => expect(ready).toHaveBeenCalledOnce());
    const file: unknown = ready.mock.calls[0]?.[0];
    expect(file).toBeInstanceOf(File);
    if (!(file instanceof File)) throw new Error('Missing audio draft');
    expect(file.type).toBe('audio/webm'); expect(file.name).toBe('Voice message.webm');
    expect(error).not.toHaveBeenCalled();
  });
  it('discarding a recording releases the microphone and creates no draft', async () => {
    const { stopTrack } = setup(); const ready = vi.fn();
    const { result } = renderHook(() => useVoiceNote(ready, vi.fn()));
    await act(() => result.current.start()); act(() => result.current.stop(true));
    expect(ready).not.toHaveBeenCalled(); expect(stopTrack).toHaveBeenCalledOnce(); expect(result.current.recording).toBe(false);
  });
  it('leaving the chat stops capture and never creates a draft for another profile', async () => {
    const { stopTrack } = setup(); const ready = vi.fn();
    const { result, unmount } = renderHook(() => useVoiceNote(ready, vi.fn()));
    await act(() => result.current.start()); unmount();
    expect(ready).not.toHaveBeenCalled(); expect(stopTrack).toHaveBeenCalled();
  });
});