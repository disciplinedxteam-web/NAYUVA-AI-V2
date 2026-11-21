import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { JudgeGuide, type GuideContent } from "@/components/guide/judge-guide";

export const Route = createFileRoute("/caregiver-guide")({
  head: () => ({
    meta: [
      { title: "Caregiver Guide for Judges — Nayuva AI" },
      { name: "description", content: "A short guide to testing Nayuva AI as a parent at home: Converse with the care team, Sutra AI and Svara check-ins." },
      { property: "og:title", content: "Caregiver Guide — Nayuva AI" },
      { property: "og:description", content: "What families can do in Nayuva AI and how to test it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CaregiverGuide,
});

const content: GuideContent = {
  eyebrow: "Note for judges · Caregiver",
  title: "You are a parent, at home with a newborn.",
  intro: "Your chat with the baby's care team opens straight away. Sutra AI answers questions from your baby's records, and Svara checks in with you every day.",
  tutorialLabel: "Watch Caregiver Tutorial",
  tutorialUrl: "https://www.youtube.com/watch?v=TpY-vBkjNAc&list=PLdVklvLc6Jsk&index=5",
  converse: { title: "Converse", tagline: "A direct line to the care team", points: [
    "Message the care team any day, in your language",
    "Share photos, documents, audio or a camera picture",
    "Approved check-in cards and visits appear in the chat",
    "Call buttons for the care team and emergency numbers",
  ] },
  sutra: { title: "Sutra AI", tagline: "Answers about your own baby", points: [
    "Ask anything about check-ins, visits and documents",
    "Answers link back to the record they came from",
    "Daily Svara check-in: talk on the website or get a call",
    "Never diagnoses or gives medical advice",
  ] },
  steps: [
    "Send a message to the care team.",
    "Switch to Sutra AI and ask about the next visit.",
    "Start today's Svara check-in on the website.",
    "Review the health card and send it to the care team.",
  ],
};

function CaregiverGuide() {
  const navigate = useNavigate();
  return <JudgeGuide content={content} backTo="/caregiver-entry" onContinue={() => void navigate({ to: "/caregiver/$section", params: { section: "home" } })} />;
}
