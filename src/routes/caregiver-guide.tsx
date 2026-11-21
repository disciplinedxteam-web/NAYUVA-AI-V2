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
  intro: "Continue as the caregiver you selected. Your own baby's chat and records are ready for you.",
  tutorialLabel: "Watch Caregiver Tutorial",
  tutorialUrl: "https://www.youtube.com/watch?v=TpY-vBkjNAc&list=PLdVklvLc6Jsk&index=5",
  converse: { title: "Converse", tagline: "A direct line to the care team", points: [
    "Send the care team a message, voice note or photo in your own language.",
    "View past documents in History and use the phone button to call.",
  ] },
  sutra: { title: "Sutra AI", tagline: "Answers about your own baby", points: [
    "Ask about your baby's visits and check-ins; open the linked sources.",
    "Talk to Svara, review your health card, then send it. AI gives no medical advice.",
  ] },
  steps: [
    "Message your care team",
    "Ask Sutra about the next visit",
    "Talk to Svara on the website",
    "Review and send your card",
  ],
};

function CaregiverGuide() {
  const navigate = useNavigate();
  return <JudgeGuide content={content} backTo="/caregiver-entry" onContinue={() => void navigate({ to: "/caregiver/$section", params: { section: "home" } })} />;
}
