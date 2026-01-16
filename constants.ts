
import { ProgramType } from './types';

export const PROGRAM_DEFINITIONS: Record<ProgramType, {
  label: string;
  description: string;
  idealProfile: {
    strengths: string[];
    personality: string;
  };
  risksToWatch: string[];
}> = {
  [ProgramType.INBOUND_SUPPORT]: {
    label: "Inbound Customer Care",
    description: "The core of BPO. Candidates handle incoming queries via phone, focusing on resolving issues, answering questions, and maintaining customer sentiment.",
    idealProfile: {
      strengths: ["High Empathy", "De-escalation", "Patience", "Clear Communication"],
      personality: "Helper / Problem Solver"
    },
    risksToWatch: ["Low resilience to angry customers", "Burnout risk", "Sounding robotic"]
  },
  [ProgramType.OUTBOUND_SALES]: {
    label: "Outbound Sales & Collections",
    description: "High-energy roles involving proactive calling to sell products, set appointments, or recover debts. Requires thick skin and drive.",
    idealProfile: {
      strengths: ["Persuasion", "Resilience (Handling Rejection)", "Goal-Oriented", "High Energy"],
      personality: "Hunter / Achiever"
    },
    risksToWatch: ["Aggressiveness", "Lack of empathy", "Non-compliance with scripts", "Pushiness"]
  },
  [ProgramType.TECH_SUPPORT]: {
    label: "Technical Support (Tier 1)",
    description: "Troubleshooting hardware, software, or connectivity issues. Requires the ability to explain complex steps simply.",
    idealProfile: {
      strengths: ["Logical Reasoning", "Tech Literacy", "Instructional Clarity", "Problem Solving"],
      personality: "Analyzer / Teacher"
    },
    risksToWatch: ["Condescension/Arrogance", "Using too much jargon", "Getting lost in details"]
  },
  [ProgramType.BACK_OFFICE]: {
    label: "Back Office & Data Ops",
    description: "Non-voice tasks such as data entry, content moderation, claims processing, or annotation.",
    idealProfile: {
      strengths: ["Attention to Detail", "Speed/Accuracy", "Reliability", "Focus"],
      personality: "Processor / Detail-Oriented"
    },
    risksToWatch: ["Poor verbal skills (if moved to voice)", "Boredom with repetition", "Low engagement"]
  }
};
