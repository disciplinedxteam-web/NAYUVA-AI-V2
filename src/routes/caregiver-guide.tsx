import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { JudgeGuide, type GuideContent } from "@/components/guide/judge-guide";

export const Route = createFileRoute("/caregiver-guide")({
  head: () => ({
    meta: [
      { title: "Caregiver Guide for Judges — Nayuva AI" },
      { name: "description", content: "A short guide to testing Nayuva AI as a parent at home: Care Connect with the care team, Sutra AI and Svara check-ins." },
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
  description: "A quick look at what you can do as a parent at home with a newborn.",
  variant: "caregiver",
  converseLine: "Chat with your care team",
  sutraLine: "Ask about your baby",
  points: [
    "Chat with your baby's care team at any time.",
    "Send photos, files or voice notes.",
    "Do a daily check-in with Svara on the website or by phone.",
    "Check your Health Card, then send it to the care team.",
    "Ask Sutra AI about your baby's visits and check-ins.",
    "Sutra AI never gives medical advice.",
  ],
  tutorialLine: "To understand the workflow better and see how everything works, watch the short tutorial.",
  tutorialLabel: "Watch Caregiver Tutorial",
  tutorialUrl: "https://www.youtube.com/watch?v=TpY-vBkjNAc&list=PLdVklvLc6Jsk&index=5",
  continueLabel: "Enter Caregiver Dashboard",
};

function CaregiverGuide() {
  const navigate = useNavigate();
  return <JudgeGuide content={content} onContinue={() => void navigate({ to: "/caregiver/$section", params: { section: "home" } })} />;
}
