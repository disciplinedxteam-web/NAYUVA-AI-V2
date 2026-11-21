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
  intro: "You follow every discharged newborn from one screen. Pick a family on the left, talk with them in real time, and ask Sutra AI about any baby's records.",
  tutorialLabel: "Watch Care Team Tutorial",
  tutorialUrl: "https://www.youtube.com/watch?v=YaOMywsSfH4",
  converse: { title: "Converse", tagline: "Real-time chat with each family", points: [
    "Families listed on the left, with live unread counts",
    "Reply to a message, react, edit or delete your own",
    "Send photos, documents, audio or a camera picture",
    "Delivered and read ticks, pinned upcoming visits",
    "History of past visits and Svara check-ins",
  ] },
  sutra: { title: "Sutra AI", tagline: "Answers from the baby's reviewed records", points: [
    "Ask in any language; it replies in the same one",
    "Every answer links to the record it came from",
    "Schedule a visit with the calendar button",
    "Never diagnoses or gives medical advice",
  ] },
  steps: [
    "Choose a family from the left panel.",
    "Send a message, or reply to one of theirs.",
    "Open History to view a past document.",
    "Switch to Sutra AI and ask about the baby's last visit.",
  ],
};

function CareTeamGuide() {
  const navigate = useNavigate();
  return <JudgeGuide content={content} backTo="/" onContinue={() => void navigate({ to: "/care-team/$section", params: { section: "converse" } })} />;
}
