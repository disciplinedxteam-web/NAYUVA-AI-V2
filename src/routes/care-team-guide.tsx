import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { JudgeGuide, type GuideContent } from "@/components/guide/judge-guide";

export const Route = createFileRoute("/care-team-guide")({
  head: () => ({
    meta: [
      { title: "Care Team Guide for Judges — Nayuva AI" },
      { name: "description", content: "A short guide to testing Nayuva AI as a newborn care team: Converse with families and Sutra AI." },
      { property: "og:title", content: "Care Team Guide — Nayuva AI" },
      { property: "og:description", content: "What the care team can do in Nayuva AI and how to test it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CareTeamGuide,
});

const content: GuideContent = {
  eyebrow: "Note for judges · Care Team",
  title: "You are the hospital care team.",
  intro: "Continue as the care team. Choose a family, chat with their caregiver, and keep up with their baby's care.",
  tutorialLabel: "Watch Care Team Tutorial",
  tutorialUrl: "https://www.youtube.com/watch?v=YaOMywsSfH4",
  converse: { title: "Converse", tagline: "Real-time chat with each family", points: [
    "Choose a family on the left and send a message or voice note.",
    "Share photos and open past visits or Svara check-ins in History.",
  ] },
  sutra: { title: "Sutra AI", tagline: "Answers from the baby's reviewed records", points: [
    "Ask about the baby's records in your own language; open the linked sources.",
    "Use the calendar to approve a visit. Medical decisions stay with you.",
  ] },
  steps: [
    "Choose a family",
    "Send or reply to a message",
    "Open a document in History",
    "Ask Sutra about the last visit",
  ],
};

function CareTeamGuide() {
  const navigate = useNavigate();
  return <JudgeGuide content={content} backTo="/" onContinue={() => void navigate({ to: "/care-team/$section", params: { section: "converse" } })} />;
}
