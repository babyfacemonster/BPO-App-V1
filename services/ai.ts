
import { InterviewSession, InterviewRecommendation, CandidateProfile, InterviewState, QuestionScore, SummaryForCompany, FeedbackForCandidate, Program, ProgramType, Application, ApplicationStatus, ImprovementInsight, CoachingOffer, FeedbackSummary, FeedbackAnalysis, TranscriptItem, NextQuestionOutput, AlignmentInput, AlignmentOutput, TurnSegment } from '../types';
import { PROGRAM_DEFINITIONS } from '../constants';

// Warm-up Speech (Not part of recorded transcript analysis)
export const WARMUP_SPEECH = "Hi there! I'm Serenity. I'm here to help you find your next role. Don't worry, this isn't a test, and there are no trick questions. Just relax, take your time, and be yourself. Click the button whenever you're ready to start.";

// Master Script Configuration with Confidence Framing
const MASTER_SCRIPT = [
  {"id":"Q1_INTRO","text":"Great. I'm going to ask you a few questions about your experience to find the best match for you. Let's start with your background.","phase":"intro"},
  {"id":"Q2_CV_WALKTHROUGH","text":"Please walk me through your work history starting with your most recent role.","phase":"cv"},
  {"id":"Q3_RECENT_ROLE_DETAILS","text":"In your most recent role at [MOST_RECENT_COMPANY], what were your day-to-day responsibilities?","phase":"cv"},
  {"id":"Q4_CUSTOMER_EXPOSURE","text":"How often did you interact with customers, and through which channels—phone, chat, email, or in person?","phase":"cv"},
  {"id":"Q5_TOOLS_SYSTEMS","text":"What tools or systems did you use regularly—like CRMs, ticketing tools, or any software?","phase":"cv"},
  {"id":"Q6_GAP_OR_TRANSITION","text":"CONDITIONAL","phase":"cv"},
  {"id":"Q7_SCENARIO_TECH_SUPPORT","text":"Here is a scenario. Take your time with this one. A customer says: ‘My internet hasn’t been working since yesterday.’ What would you say and do first?","phase":"scenario"},
  {"id":"Q8_SCENARIO_ANGRY_BILLING","text":"Imagine a customer is angry and says they were charged incorrectly. There's no rush—what would you say first, and why?","phase":"scenario"},
  {"id":"Q9_POLICY_COMPLIANCE","text":"A customer asks you to do something against policy and says ‘another agent did it for me before.’ How do you handle it?","phase":"scenario"},
  {"id":"Q10_STRESS_PRESSURE","text":"Thinking back, tell me about a time you worked under pressure or handled a difficult situation. What did you do?","phase":"reliability"},
  {"id":"Q11_SCHEDULE_RELIABILITY","text":"Call centre roles require punctuality and consistency. How do you make sure you stay on time and focused during long shifts?","phase":"reliability"},
  {"id":"Q12_COACHABILITY_CLOSING","text":"Last question. What part of customer service do you find most challenging, and what would you like to improve?","phase":"closing"}
];

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
  masterScript: typeof MASTER_SCRIPT, 
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
  if (updatedState.current_master_index >= masterScript.length) {
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

  const scriptItem = masterScript[updatedState.current_master_index];
  let textToAsk = scriptItem.text;

  // Substitutions
  if (scriptItem.id === 'Q3_RECENT_ROLE_DETAILS') {
    const companyName = profile?.totals?.most_recent_company || "your most recent company";
    textToAsk = textToAsk.replace('[MOST_RECENT_COMPANY]', companyName);
  }

  // Conditionals (Q6)
  if (scriptItem.id === 'Q6_GAP_OR_TRANSITION') {
    const hasSignificantGap = profile?.gap_analysis?.gaps?.some(g => (g.gap_months || 0) >= 2);
    if (hasSignificantGap) {
      const gap = profile?.gap_analysis?.gaps?.find(g => (g.gap_months || 0) >= 2);
      const dateStr = gap?.gap_start_date ? `around ${gap.gap_start_date}` : "in your history";
      textToAsk = `I see a gap in your employment ${dateStr}. Could you tell me a bit about that time?`;
    } else {
      textToAsk = "Why are you looking to leave your current or most recent position now?";
    }
  }

  // Update State for next turn
  updatedState.current_master_index += 1;
  updatedState.last_question_id = scriptItem.id;
  updatedState.last_question_type = 'master';
  updatedState.phase = scriptItem.phase;
  updatedState.master_questions_asked = [...(state.master_questions_asked || []), scriptItem.id];

  return {
    next_question: {
      id: scriptItem.id,
      text: textToAsk,
      phase: scriptItem.phase,
      type: 'master',
      expected_answer_length_seconds: 75
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
    return getNextPrompt(MASTER_SCRIPT, profile, state, summary);
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
    const getMockAnswer = (qId: string) => {
      const answers: Record<string, string> = {
        'Q1_INTRO': "Yes, I am ready to begin the interview.",
        'Q2_CV_WALKTHROUGH': "I've been working in customer service for about two years. My most recent role was at Retail Inc where I helped customers find products and handled checkout.",
        'Q3_RECENT_ROLE_DETAILS': "I was responsible for greeting customers, processing payments, and handling returns. I also restocked shelves and ensured the store was clean.",
        'Q4_CUSTOMER_EXPOSURE': "I interacted with customers constantly, mostly in person but sometimes over the phone to check stock.",
        'Q5_TOOLS_SYSTEMS': "I used the Point of Sale system daily. I also used a tablet for inventory checks.",
        'Q7_SCENARIO_TECH_SUPPORT': "First, I would apologize for the inconvenience. Then I would verify their account details and check if there are any known outages in their area before troubleshooting.",
        'Q8_SCENARIO_ANGRY_BILLING': "I would stay calm and listen to their frustration. I would say 'I understand why that is frustrating, let me check your account immediately'.",
        'Q9_POLICY_COMPLIANCE': "I would explain the policy politely but firmly. I might say 'I apologize, but for security reasons I cannot do that'. I would follow the official procedure.",
        'Q10_STRESS_PRESSURE': "During the holiday season, it was very busy. I handled the stress by focusing on one customer at a time and taking deep breaths.",
        'Q11_SCHEDULE_RELIABILITY': "I am very reliable. I always set multiple alarms and plan my commute ahead of time to ensure I am punctual.",
        'Q12_COACHABILITY_CLOSING': "I sometimes struggle with upselling, but I am eager to learn new techniques and improve my sales skills."
      };
      return answers[qId] || "I would handle that situation by listening to the customer, understanding their needs, and providing a solution that follows company policy.";
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
      
      const lAnswer = answer.toLowerCase();
      const words = answer.split(' ').length;

      // Track CV explanation depth for CV alignment score
      if (q.question_id === 'Q2_CV_WALKTHROUGH' || q.question_id === 'Q3_RECENT_ROLE_DETAILS') {
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
    // Condition: Coherence proxy is low OR Empathy is low
    if (scores.speaking_coherence_proxy < 0.7 || scores.empathy < 0.6) {
        potentialOffers.push({
            type: 'COMMUNICATION_COACHING',
            priority: 'high',
            reason: "Polishing your delivery and empathy markers can significantly boost your interview score.",
            expected_benefit: "Potential +15% Score Boost"
        });
    }

    // Trigger 2: Interview Prep (Close to Hire Ready)
    // Condition: Overall score is within striking distance (60-74) AND Communication is the bottleneck
    if (overallScore >= 60 && overallScore < 75 && scores.communication_clarity < 0.75) {
        potentialOffers.push({
            type: 'INTERVIEW_PREP',
            priority: 'high',
            reason: "You are very close to being Hire Ready. Structured practice could bridge the gap.",
            expected_benefit: "Unlock 'Hire Ready' Status"
        });
    }

    // Trigger 3: CV Rewrite
    // Condition: CV Alignment score low OR Low overall score but high process compliance (candidate knows their stuff but can't sell it)
    if (scores.cv_alignment < 0.6 || (overallScore < 60 && scores.process_compliance > 0.7)) {
        potentialOffers.push({
            type: 'CV_REWRITE',
            priority: 'medium',
            reason: "Your experience is great, but your resume might not fully showcase your skills to recruiters.",
            expected_benefit: "Better Program Matching"
        });
    }

    // Trigger 4: Job Readiness / Soft Skills
    // Condition: Reliability Risk detected or Stress Handling low
    if (riskFlags.includes("Reliability Risk") || scores.stress_handling < 0.6) {
        potentialOffers.push({
            type: 'JOB_READINESS',
            priority: 'medium',
            reason: "BPOs value reliability highly. Learn how to demonstrate this trait effectively.",
            expected_benefit: "Remove Profile Risks"
        });
    }

    // Select Top 2 Offers
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
