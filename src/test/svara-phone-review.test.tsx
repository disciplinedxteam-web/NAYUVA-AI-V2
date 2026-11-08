import { act, fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prepare: vi.fn(), phone: vi.fn(), poll: vi.fn(), confirm: vi.fn(), persist: vi.fn(), summarize: vi.fn(), navigate: vi.fn(),
}));
vi.mock('@tanstack/react-start', () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@/lib/care.functions', () => ({ prepareSvaraSession: mocks.prepare, saveSvaraPhone: mocks.phone, getSvaraCallStatus: mocks.poll, confirmSvaraSession: mocks.confirm, saveSvaraTranscript: mocks.persist, summarizeSvaraSession: mocks.summarize }));
vi.mock('@/components/care/svara-animation', () => ({ SvaraAnimation: () => null }));
vi.mock('@/components/care/card-generation', () => ({ CardGeneration: () => <div role="status">Writing document</div> }));
vi.mock('@/components/care/lekha-document', () => ({ LekhaDocument: ({ card, onEdit, onApprove }: { card: { topics: { finding: string }[] }; onEdit: (i: number, value: string) => void; onApprove: () => void }) => <div><input aria-label="Finding" value={card.topics[0]?.finding} onChange={e => onEdit(0, e.target.value)} /><button onClick={onApprove}>Approve & Send to Care Team</button></div> }));
vi.mock('@/components/care/completion-screen', () => ({ CompletionScreen: () => <div>Sent successfully</div> }));
import { SvaraWorkspace } from '@/components/care/svara-workspace';

const draft = JSON.stringify({ topics: [{ title: 'Feeding', finding: 'Four feeds', status: 'Normal', quote: 'four' }, { title: 'Urine', finding: 'Six wet nappies', status: 'Normal', quote: 'six' }], priority: 'Routine' });
async function placeCall() {
  fireEvent.click(screen.getByRole('button', { name: /Get a phone call/ }));
  fireEvent.change(screen.getByRole('textbox', { name: '10-digit mobile number' }), { target: { value: '9876543210' } });
  fireEvent.click(screen.getByRole('checkbox'));
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Call me now' })); });
}
describe('phone document review handoff', () => {
  beforeEach(() => {
    vi.useFakeTimers(); vi.resetAllMocks();
    mocks.prepare.mockResolvedValue({ sessionId: 'synthetic-session', profileId: 'synthetic-baby', babyName: 'Synthetic Baby', context: {} });
    mocks.phone.mockResolvedValue({ status: 'call_placed' });
    mocks.confirm.mockResolvedValue({ ok: true });
  });
  afterEach(() => { cleanup(); vi.useRealTimers(); });
  it('keeps a qualifying phone draft unsent through animation and editing until explicit approval', async () => {
    const onSaved = vi.fn();
    mocks.poll.mockResolvedValue({ status: 'in_progress', callStatus: 'completed', draft: null, failure: null });
    render(<SvaraWorkspace due={false} onSaved={onSaved} />);
    await placeCall();
    expect(mocks.phone).toHaveBeenCalledWith({ data: { sessionId: 'synthetic-session', phone: '+919876543210', consent: true } });
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(screen.getByRole('status').textContent).toBe('Writing document');
    expect(mocks.confirm).not.toHaveBeenCalled(); expect(onSaved).not.toHaveBeenCalled();
    mocks.poll.mockResolvedValue({ status: 'awaiting_confirmation', callStatus: 'completed', draft, failure: null });
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    fireEvent.change(screen.getByRole('textbox', { name: 'Finding' }), { target: { value: 'Five feeds' } });
    expect(mocks.confirm).not.toHaveBeenCalled();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Approve & Send to Care Team' })); });
    expect(JSON.parse(mocks.confirm.mock.calls[0]?.[0].data.summary).topics[0].finding).toBe('Five feeds');
    expect(mocks.confirm).toHaveBeenCalledTimes(1); expect(onSaved).toHaveBeenCalledTimes(1);
  });
  it('keeps polling while the webhook is still generating the phone draft', async () => {
    mocks.poll.mockResolvedValue({ status: 'in_progress', callStatus: 'completed', draft: null, failure: null });
    render(<SvaraWorkspace due={false} onSaved={vi.fn()} />); await placeCall();
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(mocks.poll.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(mocks.confirm).not.toHaveBeenCalled();
    mocks.poll.mockResolvedValue({ status: 'awaiting_confirmation', callStatus: 'completed', draft, failure: null });
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(screen.getByRole('textbox', { name: 'Finding' }).getAttribute('value')).toBe('Four feeds');
    expect(mocks.confirm).not.toHaveBeenCalled();
  });
  it('does not generate or submit a document for an insufficient phone conversation', async () => {
    mocks.poll.mockResolvedValue({ status: 'incomplete', callStatus: 'completed_no_transcript', draft: null, failure: 'no_caregiver_transcript' });
    render(<SvaraWorkspace due={false} onSaved={vi.fn()} />); await placeCall();
    await act(async () => { await vi.advanceTimersByTimeAsync(12000); });
    expect(screen.queryByRole('button', { name: 'Approve & Send to Care Team' })).toBeNull();
    expect(mocks.confirm).not.toHaveBeenCalled(); expect(mocks.summarize).not.toHaveBeenCalled();
  });
  it('detects call completion within one second without waiting for AI or sending a card', async () => {
    mocks.poll.mockResolvedValue({ status: 'in_progress', callStatus: 'in_progress', draft: null, failure: null });
    render(<SvaraWorkspace due={false} onSaved={vi.fn()} />); await placeCall();
    const before = mocks.poll.mock.calls.length;
    mocks.poll.mockResolvedValue({ status: 'in_progress', callStatus: 'completed', draft: null, failure: null });
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(mocks.poll.mock.calls.length).toBeGreaterThan(before);
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Call me now' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Approve & Send to Care Team' })).toBeNull();
  });
  it('does not overlap slow status requests', async () => {
    let resolvePoll: ((value: { status: string; callStatus: string; draft: null; failure: null }) => void) | undefined;
    mocks.poll.mockImplementation(() => new Promise(resolve => { resolvePoll = resolve; }));
    render(<SvaraWorkspace due={false} onSaved={vi.fn()} />); await placeCall();
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(mocks.poll).toHaveBeenCalledTimes(1);
    await act(async () => { resolvePoll?.({ status: 'in_progress', callStatus: 'in_progress', draft: null, failure: null }); });
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(mocks.poll).toHaveBeenCalledTimes(2);
  });
});