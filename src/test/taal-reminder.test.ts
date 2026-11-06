import { describe, expect, it } from 'vitest';
import { taalReminder } from '@/components/care/taal-workspace';
describe('Taal WhatsApp reminder', () => {
  it('names the doctor and the real missed counts', () => {
    const t = taalReminder({ caregiver: 'Priya', baby: 'Gaurav', metrics: { checkinsDue: 5, checkinsCompleted: 2, appointmentsDue: 1, appointmentsCompleted: 0 } });
    expect(t).toContain('Dr. Ananya Rao');
    expect(t).toContain('missed 3 Svara check-ins and 1 appointment');
  });
});
