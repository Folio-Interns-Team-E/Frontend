export type PlanTier = "free" | "plus" | "pro";

export type PlanLimits = {
  members: number;
  leads: number;
  ai_actions_monthly: number;
  emails_monthly: number;
  active_sequences: number;
  proposals_monthly: number;
};

export const PLANS: Array<{
  tier: PlanTier;
  name: string;
  price: number;
  description: string;
  popular?: boolean;
  limits: PlanLimits;
  features: string[];
}> = [
  {
    tier: "free",
    name: "Free",
    price: 0,
    description: "For individuals testing a complete sales workflow.",
    limits: {
      members: 3,
      leads: 100,
      ai_actions_monthly: 25,
      emails_monthly: 50,
      active_sequences: 1,
      proposals_monthly: 3,
    },
    features: [
      "Up to 3 users",
      "100 leads",
      "25 AI assistant actions per month",
      "50 sent emails per month",
      "1 active sequence",
      "3 proposals per month",
      "Gmail and Google Calendar",
    ],
  },
  {
    tier: "plus",
    name: "Plus",
    price: 30_000,
    description: "For small Pakistani sales teams running regular outbound campaigns.",
    popular: true,
    limits: {
      members: 5,
      leads: 5_000,
      ai_actions_monthly: 1_000,
      emails_monthly: 2_000,
      active_sequences: 20,
      proposals_monthly: 100,
    },
    features: [
      "Up to 5 users",
      "5,000 leads",
      "1,000 AI assistant actions per month",
      "2,000 sent emails per month",
      "20 active sequences",
      "100 proposals per month",
      "Team analytics and roles",
    ],
  },
  {
    tier: "pro",
    name: "Pro",
    price: 60_000,
    description: "For established teams needing higher volume and tighter controls.",
    limits: {
      members: 15,
      leads: 25_000,
      ai_actions_monthly: 5_000,
      emails_monthly: 10_000,
      active_sequences: 100,
      proposals_monthly: 500,
    },
    features: [
      "Up to 15 users",
      "25,000 leads",
      "5,000 AI assistant actions per month",
      "10,000 sent emails per month",
      "100 active sequences",
      "500 proposals per month",
      "Manager controls and priority support",
    ],
  },
];

export function formatPkr(value: number) {
  return value === 0 ? "Free" : `PKR ${new Intl.NumberFormat("en-PK").format(value)}`;
}
