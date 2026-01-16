
import { InterviewSession, InterviewRecommendation, CandidateProfile, InterviewState, QuestionScore, SummaryForCompany, FeedbackForCandidate, Program, ProgramType, Application, ApplicationStatus, ImprovementInsight, CoachingOffer, FeedbackSummary, FeedbackAnalysis, TranscriptItem, NextQuestionOutput, AlignmentInput, AlignmentOutput, TurnSegment } from '../types';
import { PROGRAM_DEFINITIONS } from '../constants';

// Warm-up Speech (Not part of recorded transcript analysis)
export const WARMUP_SPEECH = "Hi there! I'm Serenity. I'm here to help you find your next role. Don't worry, this isn't a test, and there are no trick questions. Just relax, take your time, and be yourself. Click the button whenever you're ready to start.";

// INTERVIEW FLOW CONFIGURATION
// Defines the sequence of competencies to assess
const INTERVIEW_FLOW = [
  { slot: 'Q1',  key: 'INTRO',                phase: 'intro',       time: 0 },
  { slot: 'Q2',  key: 'CV_WALKTHROUGH',       phase: 'cv',          time: 60 },
  { slot: 'Q3',  key: 'RECENT_ROLE_DETAILS',  phase: 'cv',          time: 60 },
  { slot: 'Q4',  key: 'CUSTOMER_EXPOSURE',    phase: 'cv',          time: 60 },
  { slot: 'Q5',  key: 'TOOLS_SYSTEMS',        phase: 'cv',          time: 60 },
  { slot: 'Q6',  key: 'GAP_OR_TRANSITION',    phase: 'cv',          time: 60 }, // Conditional
  { slot: 'Q7',  key: 'SCENARIO_TECH',        phase: 'scenario',    time: 90 },
  { slot: 'Q8',  key: 'SCENARIO_ANGRY',       phase: 'scenario',    time: 90 },
  { slot: 'Q9',  key: 'POLICY_COMPLIANCE',    phase: 'scenario',    time: 90 },
  { slot: 'Q10', key: 'STRESS_PRESSURE',      phase: 'reliability', time: 75 },
  { slot: 'Q11', key: 'SCHEDULE_RELIABILITY', phase: 'reliability', time: 60 },
  { slot: 'Q12', key: 'COACHABILITY',         phase: 'closing',     time: 60 }
];

// QUESTION BANK
// 3 Variants per competency to ensure rotation
const QUESTION_BANK: Record<string, Array<{id: string, text: string}>> = {
  INTRO: [
    { id: 'Q1_V1', text: "Great. I'm going to ask you a few questions about your experience to find the best match for you. Let's start with your background." },
    { id: 'Q1_V2', text: "Thanks for joining me. I'd love to learn about your skills and experience to see where you'd fit best. Shall we start with your work history?" },
    { id: 'Q1_V3', text: "Welcome. To help us find the perfect program for you, I have a few questions about your career so far. Let's begin with your background." }
  ],
  CV_WALKTHROUGH: [
    { id: 'Q2_V1', text: "Please walk me through your work history starting with your most recent role." },
    { id: 'Q2_V2', text: "Could you give me a brief overview of your professional background, starting from the present and working backwards?" },
    { id: 'Q2_V3', text: "I've got your CV here, but I'd love to hear it in your own words. Can you summarize your recent work history for me?" }
  ],
  RECENT_ROLE_DETAILS: [
    { id: 'Q3_V1', text: "In your most recent role at [MOST_RECENT_COMPANY], what were your day-to-day responsibilities?" },
    { id: 'Q3_V2', text: "Thinking about your time at [MOST_RECENT_COMPANY], what were the main tasks you handled on a typical day?" },
    { id: 'Q3_V3', text: "At [MOST_RECENT_COMPANY], what did a standard shift look like for you, and what were your key duties?" }
  ],
  CUSTOMER_EXPOSURE: [
    { id: 'Q4_V1', text: "How often did you interact with customers, and through which channels—phone, chat, email, or in person?" },
    { id: 'Q4_V2', text: "What was the volume of customer interaction in that role, and did you mostly use voice, chat, or email?" },
    { id: 'Q4_V3', text: "Did you spend most of your day speaking with customers? If so, was it face-to-face or over the phone?" }
  ],
  TOOLS_SYSTEMS: [
    { id: 'Q5_V1', text: "What tools or systems did you use regularly—like CRMs, ticketing tools, or any software?" },
    { id: 'Q5_V2', text: "Are you comfortable with technical tools? Which specific software or CRM platforms have you used before?" },
    { id: 'Q5_V3', text: "Walk me through the technology stack you used. Any experience with ticketing systems or complex databases?" }
  ],
  // Q6 IS SPECIAL - Handled conditionally in logic, but we define the banks here
  GAP_QUESTIONS: [
    { id: 'Q6_GAP_V1', text: "I noticed a gap in your employment around [DATE]. Could you share how you spent that time?" },
    { id: 'Q6_GAP_V2', text: "It looks like you had some time off around [DATE]. What were you focusing on during that period?" },
    { id: 'Q6_GAP_V3', text: "Could you tell me a little bit about the break in your work history around [DATE]?" }
  ],
  TRANSITION_QUESTIONS: [
    { id: 'Q6_TRANS_V1', text: "Why are you looking to leave your current or most recent position now?" },
    { id: 'Q6_TRANS_V2', text: "What is motivating you to look for a new opportunity at this stage in your career?" },
    { id: 'Q6_TRANS_V3', text: "What are you looking for in your next role that you aren't getting in your current one?" }
  ],
  SCENARIO_TECH: [
    { id: 'Q7_V1', text: "Here is a scenario. A customer says: ‘My internet hasn’t been working since yesterday.’ What would you say and do first?" },
    { id: 'Q7_V2', text: "Imagine a customer calls in saying, 'I can't connect to the wifi and I have work to do.' Walk me through your first few steps." },
    { id: 'Q7_V3', text: "Roleplay with me for a second. I call you and say 'My service is completely down.' How do you start the troubleshooting process?" }
  ],
  SCENARIO_ANGRY: [
    { id: 'Q8_V1', text: "Imagine a customer is angry and says they were charged incorrectly. There's no rush—what would you say first, and why?" },
    { id: 'Q8_V2', text: "A customer calls in yelling about an overcharge on their bill. How do you de-escalate the situation?" },
    { id: 'Q8_V3', text: "You receive a call from a very frustrated customer who believes we made a billing error. How do you handle their anger?" }
  ],
  POLICY_COMPLIANCE: [
    { id: 'Q9_V1', text: "A customer asks you to do something against policy and says ‘another agent did it for me before.’ How do you handle it?" },
    { id: 'Q9_V2', text: "If a customer pushes you to bend the rules because 'everyone else does it', how do you respond while maintaining the policy?" },
    { id: 'Q9_V3', text: "How would you handle a situation where a customer demands a refund that clearly violates company policy?" }
  ],
  STRESS_PRESSURE: [
    { id: 'Q10_V1', text: "Thinking back, tell me about a time you worked under pressure or handled a difficult situation. What did you do?" },
    { id: 'Q10_V2', text: "Call centers can be fast-paced. Can you describe a time you had to handle high pressure or a heavy workload?" },
    { id: 'Q10_V3', text: "Tell me about a stressful day at work you've had recently. How did you manage your stress levels?" }
  ],
  SCHEDULE_RELIABILITY: [
    { id: 'Q11_V1', text: "Call centre roles require punctuality and consistency. How do you make sure you stay on time and focused during long shifts?" },
    { id: 'Q11_V2', text: "Reliability is key for us. What systems or habits do you use to ensure you are always on time and ready for work?" },
    { id: 'Q11_V3', text: "How do you manage your schedule to ensure you don't miss shifts, even when life gets busy?" }
  ],
  COACHABILITY: [
    { id: 'Q12_V1', text: "Last question. What part of customer service do you find most challenging, and what would you like to improve?" },
    { id: 'Q12_V2', text: "We believe in continuous learning. What is one area of your professional skillset you are actively trying to improve?" },
    { id: 'Q12_V3', text: "Finally, if you looked back at your last performance review, what was one area identified for growth?" }
  ]
};

// Helper to summarize the last answer (Mock heuristics for MVP)
const summarizeLastAnswer = (answerTranscript: string) => {
  // If the frontend sent a placeholder for video mode
  if (answerTranscript === '[AUDIO_RESPONSE]') {
    // Randomly simulate issues for demonstration purposes (15% chance of being too short)
    const isShort = Math.random() < 0.15;
    return {
      needs_followup: isShort,
      detected_issues: isShort ? ['too_short'] : []
    };
  }

  const words = answerTranscript.trim().split(/\s+/).length;
  const issues: string[] = [];
  
  if (words < 15) issues.push('too_short'); // Reduced threshold slightly
  
  return {
    needs_followup: issues.length > 0,
    detected_issues: issues
  };
};

// Core Adaptive Controller Logic
const getNextPrompt = (
  profile: CandidateProfile | undefined, 
  state: InterviewState, 
  lastTurnSummary: { needs_followup: boolean, detected_issues: string[] }
): { next_question: NextQuestionOutput | null, updated_state: InterviewState } => {
  
  const updatedState = { ...state };
  
  // 1. Time Limits
  if (state.time_elapsed_minutes >= 43) {
    if (state.phase !== 'closing_timeout' && state.phase !== 'complete') {
      return {
        next_question: {
          id: 'Q_CLOSE_TIMEOUT',
          text: "It looks like we're out of time. Thank you for your patience and effort today. We'll review what we've covered, and if there's a potential match, we'll reach out to you. Thank you again.",
          phase: 'closing',
          type: 'closing',
          expected_answer_length_seconds: 5
        },
        updated_state: { ...updatedState, phase: 'closing_timeout' }
      };
    }
    return { next_question: null, updated_state: { ...updatedState, phase: 'complete' } };
  }

  // 2. Decide if we should follow up
  // Rules: Only after a master question, Max 1 per master, Max 6 total
  const canFollowUp = 
    state.last_question_type === 'master' && 
    state.followups_used < 6;

  if (lastTurnSummary.needs_followup && canFollowUp) {
    updatedState.followups_used += 1;
    updatedState.last_question_type = 'followup';
    // Do NOT increment master index
    
    const issue = lastTurnSummary.detected_issues[0];
    const text = issue === 'too_short' 
      ? "That's a good start. Could you tell me a little more details about that?"
      : "That's helpful context. Can you give me a specific example to help me understand better?";

    return {
      next_question: {
        id: `${state.last_question_id}_FU`,
        text: text,
        phase: state.phase || 'interview',
        type: 'followup',
        expected_answer_length_seconds: 45
      },
      updated_state: updatedState
    };
  }

  // 3. Next Master Question
  if (updatedState.current_master_index >= INTERVIEW_FLOW.length) {
    // Script exhausted
    if (state.phase !== 'complete') {
       return {
         next_question: {
           id: 'Q_CLOSE_DONE',
           text: "That concludes our interview. Thank you so much for your time today. We will now review your responses and profile. If there is a good match for one of our open roles, a member of the team will be in touch with next steps. Have a wonderful day.",
           phase: 'closing',
           type: 'closing',
           expected_answer_length_seconds: 0
         },
         updated_state: { ...updatedState, phase: 'complete' }
       };
    }
    return { next_question: null, updated_state: updatedState };
  }

  const flowStep = INTERVIEW_FLOW[updatedState.current_master_index];
  let selectedQuestion: { id: string, text: string };

  // Logic for Q6 Conditional
  if (flowStep.key === 'GAP_OR_TRANSITION') {
    const hasSignificantGap = profile?.gap_analysis?.gaps?.some(g => (g.gap_months || 0) >= 2);
    if (hasSignificantGap) {
      const gap = profile?.gap_analysis?.gaps?.find(g => (g.gap_months || 0) >= 2);
      const dateStr = gap?.gap_start_date ? `around ${gap.gap_start_date}` : "in your history";
      
      const variants = QUESTION_BANK.GAP_QUESTIONS;
      selectedQuestion = { ...variants[Math.floor(Math.random() * variants.length)] };
      selectedQuestion.text = selectedQuestion.text.replace('[DATE]', dateStr);
    } else {
      const variants = QUESTION_BANK.TRANSITION_QUESTIONS;
      selectedQuestion = { ...variants[Math.floor(Math.random() * variants.length)] };
    }
  } else {
    // Normal Selection from Bank
    const variants = QUESTION_BANK[flowStep.key];
    if (!variants) {
       // Fallback for safety
       selectedQuestion = { id: `${flowStep.slot}_ERROR`, text: "Could you tell me more about your experience?" };
    } else {
       selectedQuestion = { ...variants[Math.floor(Math.random() * variants.length)] };
    }
  }

  // Text Substitutions for Q3 (Recent Company)
  if (flowStep.key === 'RECENT_ROLE_DETAILS') {
    const companyName = profile?.totals?.most_recent_company || "your most recent company";
    selectedQuestion.text = selectedQuestion.text.replace(/\[MOST_RECENT_COMPANY\]/g, companyName);
  }

  // Update State for next turn
  updatedState.current_master_index += 1;
  updatedState.last_question_id = selectedQuestion.id;
  updatedState.last_question_type = 'master';
  updatedState.phase = flowStep.phase;
  updatedState.master_questions_asked = [...(state.master_questions_asked || []), selectedQuestion.id];

  return {
    next_question: {
      id: selectedQuestion.id,
      text: selectedQuestion.text,
      phase: flowStep.phase,
      type: 'master',
      expected_answer_length_seconds: flowStep.time
    },
    updated_state: updatedState
  };
};

/**
 * MOCK AI SCORING & ORCHESTRATION SERVICE
 */
export const aiService = {
  
  async orchestrateInterview(
    profile: CandidateProfile | undefined,
    transcript: Array<{ role: 'system' | 'user'; content: string, timestamps?: { start_sec: number, end_sec: number } }>,
    currentState?: InterviewState
  ): Promise<{
    next_question: NextQuestionOutput | null;
    updated_state: InterviewState;
  }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Initialize State
    const state: InterviewState = currentState || {
      current_master_index: 0,
      master_questions_asked: [],
      followups_used: 0,
      time_elapsed_minutes: 0,
      flags: [],
      last_question_id: null,
      last_question_type: null, 
      phase: 'intro'
    };

    // Robust fallbacks
    if (state.current_master_index === undefined) state.current_master_index = 0;
    if (state.followups_used === undefined) state.followups_used = 0;

    // Analyze Last Turn
    const lastUserMsg = transcript.length > 0 && transcript[transcript.length - 1].role === 'user' 
        ? transcript[transcript.length - 1] 
        : null;

    let summary = { needs_followup: false, detected_issues: [] as string[] };
    
    // Only analyze if there was a previous user message
    if (lastUserMsg) {
      summary = summarizeLastAnswer(lastUserMsg.content);
    }

    // Get Next Prompt using Controller
    return getNextPrompt(profile, state, summary);
  },

  async postProcessInterview({ 
    candidateProfile, 
    questionsAsked, 
    audioMetricsSummary 
  }: { 
    candidateProfile?: CandidateProfile, 
    questionsAsked: Array<{question_id: string, text: string, start_sec: number, end_sec: number}>, 
    audioMetricsSummary?: any 
  }) {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2500));

    // 1. GENERATE "REAL" TRANSCRIPT FROM MOCK AUDIO (DEMO HACK)
    // Updated to handle dynamic Question IDs by checking the Slot Prefix (Q1_, Q2_, etc.)
    const getMockAnswer = (qId: string) => {
      // Helper to check prefix
      const is = (prefix: string) => qId.startsWith(prefix);

      if (is('Q1_')) return "Yes, I am ready to begin the interview.";
      if (is('Q2_')) return "I've been working in customer service for about two years. My most recent role was at Retail Inc where I helped customers find products and handled checkout.";
      if (is('Q3_')) return "I was responsible for greeting customers, processing payments, and handling returns. I also restocked shelves and ensured the store was clean.";
      if (is('Q4_')) return "I interacted with customers constantly, mostly in person but sometimes over the phone to check stock.";
      if (is('Q5_')) return "I used the Point of Sale system daily. I also used a tablet for inventory checks.";
      // Q6 is Gap or Transition
      if (is('Q6_')) return "I was looking for better growth opportunities. I felt I had learned everything I could in my previous role.";
      
      if (is('Q7_')) return "First, I would apologize for the inconvenience. Then I would verify their account details and check if there are any known outages in their area before troubleshooting.";
      if (is('Q8_')) return "I would stay calm and listen to their frustration. I would say 'I understand why that is frustrating, let me check your account immediately'.";
      if (is('Q9_')) return "I would explain the policy politely but firmly. I might say 'I apologize, but for security reasons I cannot do that'. I would follow the official procedure.";
      if (is('Q10_')) return "During the holiday season, it was very busy. I handled the stress by focusing on one customer at a time and taking deep breaths.";
      if (is('Q11_')) return "I am very reliable. I always set multiple alarms and plan my commute ahead of time to ensure I am punctual.";
      if (is('Q12_')) return "I sometimes struggle with upselling, but I am eager to learn new techniques and improve my sales skills.";

      return "I would handle that situation by listening to the customer, understanding their needs, and providing a solution that follows company policy.";
    };

    // 2. SCORING HEURISTICS
    let totalScore = 0;
    const scores = {
      communication_clarity: 0,
      speaking_coherence_proxy: 0.85, 
      empathy: 0,
      de_escalation: 0,
      process_compliance: 0,
      stress_handling: 0,
      reliability: 0,
      sales_potential: 0,
      coachability: 0,
      cv_alignment: 0.9
    };

    // Process each turn
    let cvWalkthroughWordCount = 0;
    questionsAsked.forEach(q => {
      const answer = getMockAnswer(q.question_id);
      const is = (prefix: string) => q.question_id.startsWith(prefix);
      
      const lAnswer = answer.toLowerCase();
      const words = answer.split(' ').length;

      // Track CV explanation depth for CV alignment score
      if (is('Q2_') || is('Q3_')) {
          cvWalkthroughWordCount += words;
      }

      // Comm Clarity: Reward length
      if (words > 20) scores.communication_clarity += 0.1;

      // Empathy
      if (['sorry', 'apologize', 'understand', 'frustrating'].some(k => lAnswer.includes(k))) {
        scores.empathy += 0.2;
      }
      
      // Process
      if (['policy', 'verify', 'check', 'procedure', 'first'].some(k => lAnswer.includes(k))) {
        scores.process_compliance += 0.2;
      }

      // Reliability
      if (['time', 'alarm', 'schedule', 'plan'].some(k => lAnswer.includes(k))) {
        scores.reliability += 0.25;
      }

      // De-escalation
      if (['calm', 'listen', 'solution'].some(k => lAnswer.includes(k))) {
        scores.de_escalation += 0.2;
      }
      
      // Coachability
      if (['learn', 'improve', 'feedback'].some(k => lAnswer.includes(k))) {
        scores.coachability += 0.3;
      }
    });

    // Normalize Scores (Clamp 0.1 - 1.0)
    const normalize = (val: number, max: number = 1.0) => Math.min(1.0, Math.max(0.2, val));
    
    scores.communication_clarity = normalize(scores.communication_clarity, 1.2); 
    scores.empathy = normalize(scores.empathy, 0.8);
    scores.process_compliance = normalize(scores.process_compliance, 0.8);
    scores.de_escalation = normalize(scores.de_escalation, 0.6);
    scores.reliability = normalize(scores.reliability, 0.5);
    scores.coachability = normalize(scores.coachability, 0.6);
    scores.sales_potential = 0.6; 
    scores.stress_handling = 0.75; 

    // Adjust CV alignment based on verbosity of CV answers
    scores.cv_alignment = cvWalkthroughWordCount > 40 ? 0.9 : 0.55;

    // Calculate Weighted Overall
    const overallScore = (
      (scores.communication_clarity * 0.20) +
      (scores.speaking_coherence_proxy * 0.10) +
      (scores.empathy * 0.15) +
      (scores.de_escalation * 0.10) +
      (scores.process_compliance * 0.15) +
      (scores.stress_handling * 0.10) +
      (scores.reliability * 0.10) +
      (scores.sales_potential * 0.05) +
      (scores.coachability * 0.05)
    ) * 100;

    // 3. RECOMMENDATION LOGIC
    const riskFlags: string[] = [];
    if (scores.communication_clarity < 0.5) riskFlags.push("Communication Clarity Risk");
    if (scores.process_compliance < 0.5) riskFlags.push("Process Compliance Risk");
    if (scores.reliability < 0.5) riskFlags.push("Reliability Risk");

    let rec = InterviewRecommendation.NOT_RECOMMENDED_YET;
    if (overallScore >= 75 && riskFlags.length === 0) {
      rec = InterviewRecommendation.HIRE_READY;
    } else if (overallScore >= 60) {
      rec = InterviewRecommendation.INTERVIEW_RECOMMENDED;
    }

    // 4. Role Fit Analysis (Transparent & Supportive)
    let primaryFit = "General Support";
    let strengthSummary = "You demonstrated solid professional skills suitable for many roles.";
    let growthSummary = "Continued practice in structured responses will help.";

    if (scores.sales_potential > 0.65) {
        primaryFit = "Outbound Sales";
        strengthSummary = "Your energy and resilience suggest you would thrive in goal-oriented environments.";
    } else if (scores.process_compliance > 0.7 && scores.communication_clarity > 0.7) {
        primaryFit = "Technical Support";
        strengthSummary = "Your logical approach and clear explanations make you a strong candidate for troubleshooting roles.";
    } else if (scores.empathy > 0.7) {
        primaryFit = "Customer Care Specialist";
        strengthSummary = "Your natural empathy and patience are your biggest assets for handling customer inquiries.";
    }

    if (overallScore < 60) {
       growthSummary = "Focusing on using the STAR method (Situation, Task, Action, Result) in your answers could significantly improve your clarity.";
    } else if (riskFlags.length > 0) {
       growthSummary = "Paying extra attention to punctuality and policy details will help open up more senior opportunities.";
    } else {
       growthSummary = "You are well-positioned. To advance further, consider highlighting your leadership or specialized technical experience.";
    }

    // 5. UPSELL TRIGGER LOGIC (Max 2 Offers)
    const potentialOffers: CoachingOffer[] = [];

    // Trigger 1: Communication Coaching
    if (scores.speaking_coherence_proxy < 0.7 || scores.empathy < 0.6) {
        potentialOffers.push({
            type: 'COMMUNICATION_COACHING',
            priority: 'high',
            reason: "Polishing your delivery and empathy markers can significantly boost your interview score.",
            expected_benefit: "Potential +15% Score Boost"
        });
    }

    // Trigger 2: Interview Prep
    if (overallScore >= 60 && overallScore < 75 && scores.communication_clarity < 0.75) {
        potentialOffers.push({
            type: 'INTERVIEW_PREP',
            priority: 'high',
            reason: "You are very close to being Hire Ready. Structured practice could bridge the gap.",
            expected_benefit: "Unlock 'Hire Ready' Status"
        });
    }

    // Trigger 3: CV Rewrite
    if (scores.cv_alignment < 0.6 || (overallScore < 60 && scores.process_compliance > 0.7)) {
        potentialOffers.push({
            type: 'CV_REWRITE',
            priority: 'medium',
            reason: "Your experience is great, but your resume might not fully showcase your skills to recruiters.",
            expected_benefit: "Better Program Matching"
        });
    }

    // Trigger 4: Job Readiness
    if (riskFlags.includes("Reliability Risk") || scores.stress_handling < 0.6) {
        potentialOffers.push({
            type: 'JOB_READINESS',
            priority: 'medium',
            reason: "BPOs value reliability highly. Learn how to demonstrate this trait effectively.",
            expected_benefit: "Remove Profile Risks"
        });
    }

    const finalOffers = potentialOffers.slice(0, 2);

    // 6. CONSTRUCT OUTPUT
    return {
      scores: {
        communication: scores.communication_clarity,
        coherence: scores.speaking_coherence_proxy,
        empathy: scores.empathy,
        deescalation: scores.de_escalation,
        process: scores.process_compliance,
        stress: scores.stress_handling,
        reliability: scores.reliability,
        sales: scores.sales_potential,
        coachability: scores.coachability
      },
      overallScore: Math.round(overallScore),
      riskFlags,
      recommendation: rec,
      aiConfidence: 0.85,
      summaryForCompany: {
        short_overview: `Candidate demonstrates ${overallScore > 75 ? 'strong' : 'adequate'} potential for BPO roles.`,
        strengths: ["Clear speech", "Good empathy markers", "Process awareness"],
        risks: riskFlags,
        recommended_followup_questions: riskFlags.length > 0 ? ["Tell me about a time you had to follow a strict policy."] : [],
        recommended_program_types: [ProgramType.INBOUND_SUPPORT, ProgramType.TECH_SUPPORT]
      },
      feedbackForCandidate: {
        positive: ["You spoke clearly and at a good pace.", "You showed empathy in scenario questions."],
        improve: ["Try to use more specific examples from past jobs.", "Focus on customer benefits when selling ideas."],
        role_fit_analysis: {
          primary_fit: primaryFit,
          strengths_summary: strengthSummary,
          growth_areas_summary: growthSummary
        },
        detailed_insights: [],
        coaching_offers: finalOffers
      },
      generatedTranscript: questionsAsked.map(q => ({
        role: 'system',
        content: q.text
      }))
    };
  },

  async parseCV(file: File): Promise<{ text: string, profile: CandidateProfile }> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const mockProfile: CandidateProfile = {
      headline: "Customer Support",
      summary: "Experienced support agent.",
      skills: ['Customer Service', 'English'],
      languages: ['English'],
      certifications: [],
      work_history: [],
      education: [],
      gap_analysis: { gaps: [], job_hopping_risk: "low" },
      totals: { total_years_experience_estimate: 2, total_customer_service_years_estimate: 2, most_recent_role_title: "Agent", most_recent_company: "BPO Inc" },
      extraction_quality: { confidence: 0.95, missing_fields: [] }
    };
    return { text: "CV Content", profile: mockProfile };
  },

  async rankPrograms(profile: CandidateProfile, interview: InterviewSession, programs: Program[]): Promise<Array<Partial<Application>>> {
    return programs.map(p => {
        const explanations: string[] = [];
        const risks: string[] = [];
        let score = 0; // Start at 0, max 100.

        // 1. Program Type Fit (Max 30 pts)
        let typeScore = 0;
        
        // Check strengths & Scores
        if (p.type === ProgramType.INBOUND_SUPPORT) {
            if (interview.scores.empathy >= 0.7) { typeScore += 10; explanations.push("Matched because: High Empathy score (top 30%)."); }
            if (interview.scores.communication >= 0.7) { typeScore += 10; explanations.push("Matched because: Clear communication style."); }
            if (interview.scores.deescalation >= 0.6) { typeScore += 10; explanations.push("Matched because: Proven de-escalation skills."); }
        } else if (p.type === ProgramType.OUTBOUND_SALES) {
             if (interview.scores.sales >= 0.6) { typeScore += 15; explanations.push("Matched because: Sales potential detected in interview."); }
             if (interview.scores.stress >= 0.7) { typeScore += 15; explanations.push("Matched because: High resilience under pressure."); }
        } else if (p.type === ProgramType.TECH_SUPPORT) {
             if (profile.skills.some(s => /tech|support|it|helpdesk/i.test(s))) { typeScore += 15; explanations.push("Matched because: Technical background found in CV."); }
             if (interview.scores.process >= 0.7) { typeScore += 15; explanations.push("Matched because: Strong process adherence."); }
        } else if (p.type === ProgramType.BACK_OFFICE) {
             if (interview.scores.reliability >= 0.8) { typeScore += 15; explanations.push("Matched because: High reliability score."); }
             if (profile.skills.some(s => /data|typing|admin/i.test(s))) { typeScore += 15; explanations.push("Matched because: Admin skills present."); }
        }
        
        // Clamp type score
        typeScore = Math.min(30, typeScore);
        if (typeScore > 0) score += typeScore;


        // 2. Skills Match (Max 40 pts)
        // Must Haves (Weight higher)
        const candSkillsLower = profile.skills.map(s => s.toLowerCase());
        const mustHaves = p.mustHaveSkills.map(s => s.trim().toLowerCase()).filter(s => s);
        
        if (mustHaves.length > 0) {
            const matchedMust = mustHaves.filter(mh => candSkillsLower.some(cs => cs.includes(mh) || mh.includes(cs)));
            const mustHaveRatio = matchedMust.length / mustHaves.length;
            const points = Math.round(mustHaveRatio * 30);
            score += points;
            
            if (mustHaveRatio === 1) explanations.push("Matched because: Has all required skills.");
            else if (mustHaveRatio > 0.5) explanations.push(`Matched because: Has ${matchedMust.length}/${mustHaves.length} required skills.`);
            else risks.push(`Missing key skills: ${mustHaves.filter(mh => !matchedMust.includes(mh)).join(', ')}`);
        } else {
            score += 30; // No requirements = full points for this section
        }

        // Nice to Haves (Max 10 pts)
        const niceHaves = p.niceToHaveSkills.map(s => s.trim().toLowerCase()).filter(s => s);
        if (niceHaves.length > 0) {
            const matchedNice = niceHaves.filter(nh => candSkillsLower.some(cs => cs.includes(nh) || nh.includes(cs)));
            if (matchedNice.length > 0) {
                const points = Math.min(10, matchedNice.length * 5); // 5 pts each, max 10
                score += points;
                explanations.push(`Bonus: Has relevant skills (${matchedNice.join(', ')}).`);
            }
        }

        // 3. Base Interview Performance (Max 30 pts)
        const interviewPoints = Math.round(interview.overallScore * 0.3);
        score += interviewPoints;

        // 4. Deal Breakers & Risks (Penalties)
        // Check explicit deal breakers from Program against Interview/Profile
        if (p.dealBreakers && p.dealBreakers.length > 0) {
             const breakers = p.dealBreakers.map(s => s.toLowerCase());
             // Check against risk flags
             const interviewRisks = (interview.riskFlags || []).map(r => r.toLowerCase());
             
             breakers.forEach(breaker => {
                 // Simple keyword matching for MVP
                 if (interviewRisks.some(r => r.includes(breaker))) {
                     score -= 50;
                     risks.push(`Deal Breaker Triggered: Candidate flagged for ${breaker}.`);
                 }
                 // Check job hopping
                 if (breaker.includes("hopping") && profile.gap_analysis.job_hopping_risk === 'high') {
                     score -= 50;
                     risks.push("Deal Breaker Triggered: High Job Hopping Risk detected.");
                 }
             });
        }

        // Final Clamp
        score = Math.max(0, Math.min(99, score));

        // Tier
        let tier: 'strong' | 'medium' | 'stretch' = 'stretch';
        if (score >= 80) tier = 'strong';
        else if (score >= 60) tier = 'medium';

        return {
          programId: p.id,
          matchScore: score,
          matchTier: tier,
          status: ApplicationStatus.SUGGESTED,
          matchBreakdown: {
              must_have_overlap: 0, // calculated implicitly above, keeping type simple
              nice_to_have_overlap: 0,
              readiness_boost: 0,
              program_type_fit: typeScore,
              why_this_match: explanations,
              risks_for_this_program: risks
          }
      };
    });
  },

  async analyzeFeedback(summary: FeedbackSummary): Promise<FeedbackAnalysis> {
    return {
        top_issues: [],
        script_change_proposals: [],
        scoring_rubric_adjustments: []
    };
  },

  async segmentTurns(inputs: AlignmentInput): Promise<AlignmentOutput> {
    return {
        turns: [],
        alignment_quality: { confidence: 1, issues: [] }
    };
  }
};
