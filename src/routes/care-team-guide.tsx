import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { JudgeGuide, type GuideContent } from "@/components/guide/judge-guide";

export const Route = createFileRoute("/care-team-guide")({
  head: () => ({
    meta: [
      { title: "Care Team Guide for Judges — Nayuva AI" },
      { name: "description", content: "A short guide to testing Nayuva AI as a newborn care team: Care Connect with families and Sutra AI." },
      { property: "og:title", content: "Care Team Guide — Nayuva AI" },
      { property: "og:description", content: "What the care team can do in Nayuva AI and how to test it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CareTeamGuide,
});

const content: GuideContent = {
  description: "A quick look at what you can do as the hospital care team.",
  variant: "care-team",
  converseLine: "Chat with each family",
  sutraLine: "Ask about a baby's records",
  points: [
    "Pick a family on the left to open their chat.",
    "Send messages, photos, files or voice notes.",
    "Open a family's Svara check-in and approve it in the chat.",
    "Ask Sutra AI about a baby's records, in any language.",
    "Book a visit from Sutra AI with a date and time.",
    "Every medical decision stays with you.",
  ],
  tutorialLine: "To understand the workflow better and see how everything works, watch the short tutorial.",
  tutorialLabel: "Watch Care Team Tutorial",
  tutorialUrl: "https://youtu.be/yXrBt4SVWv4",
  continueLabel: "Enter Care Team Dashboard",
};

function CareTeamGuide() {
  const navigate = useNavigate();
  return <JudgeGuide content={content} onContinue={() => void navigate({ to: "/care-team/$section", params: { section: "home" } })} />;
}
