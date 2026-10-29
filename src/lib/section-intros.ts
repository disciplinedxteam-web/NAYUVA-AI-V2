export type SectionIntroCopy = { title: string; description: string };

export const sectionIntros: Record<'care-team' | 'caregiver', Record<string, SectionIntroCopy>> = {
  'care-team': {
    updates: { title: 'Review Newborn Health Updates', description: "Review structured Health Cards from caregivers' Svara check-ins. Send clinical notes or schedule follow-ups based on the updates received." },
    milan: { title: 'Manage Follow-Up Appointments', description: "Schedule online or in-person follow-up appointments, track upcoming visits, and manage caregivers' rescheduling requests." },
    lekha: { title: 'Document Clinical Consultations', description: 'Document in-person consultations with AI. Record the appointment live or dictate what was discussed afterward to generate a structured consultation record for your review.' },
    sutra: { title: 'Explore Newborn Care History', description: 'Select a newborn and ask about their care history, including past check-ins, consultations, follow-ups, and previous appointment discussions.' },
    taal: { title: 'Monitor Caregiver Engagement', description: 'Track caregiver participation in Svara check-ins and follow-ups. Identify active, overdue, or unresponsive caregivers who may need outreach.' },
    'care-plan': { title: 'Personalize Newborn Care Plans', description: 'Create or update personalized Care Plans for each newborn, defining the topics and questions Svara covers during daily check-ins.' },
  },
  caregiver: {
    svara: { title: "Share Your Baby's Daily Updates", description: "Share updates about your baby through a voice conversation with Svara. Start a check-in and answer questions personalized to your baby's Care Plan." },
    lekha: { title: "Revisit Your Baby's Consultations", description: "View your baby's consultation records and revisit what was discussed during previous appointments, all in one place." },
    milan: { title: "Manage Your Baby's Appointments", description: 'View upcoming appointments, join scheduled online consultations, or request a change in appointment time.' },
    sutra: { title: "Explore Your Baby's Care History", description: "Ask about your baby's care history, including previous check-ins, appointments, and consultation discussions." },
  },
};

export const introFor = (role: string, section: string): SectionIntroCopy | undefined =>
  (sectionIntros as Record<string, Record<string, SectionIntroCopy>>)[role]?.[section];

export const introKey = (role: string, section: string) => `nayuva-intro-ack:${role}:${section}`;
