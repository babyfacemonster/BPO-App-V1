import { InterviewSession, InterviewRecommendation, CandidateProfile, InterviewState, QuestionScore, SummaryForCompany, FeedbackForCandidate, Program, ProgramType, Application, ApplicationStatus, ImprovementInsight, CoachingOffer, FeedbackSummary, FeedbackAnalysis, TranscriptItem, NextQuestionOutput, AlignmentInput, AlignmentOutput, TurnSegment } from '../types';

// Feature flags
const USE_REAL_AI = false; 

// Master Script Configuration
const MASTER_SCRIPT = [
  {"id":"Q1_INTRO","text":"Hi, I’m Serenity’s AI interviewer. This is a recorded interview to help match you to call centre roles. Please answer honestly. Are you ready to begin?","phase":"intro"},
  {"id":"Q2_CV_WALKTHROUGH","text":"Please walk me through your work history starting with your most recent role.","phase":"cv"},
  {"id":"Q3_RECENT_ROLE_DETAILS","text":"In your most recent role at [MOST_RECENT_COMPANY], what were your day-to-day responsibilities?","phase":"cv"},
  {"id":"Q4_CUSTOMER_EXPOSURE","text":"How often did you interact with customers, and through which channels—phone, chat, email, or in person?","phase":"cv"},
  {"id":"Q5_TOOLS_SYSTEMS","text":"What tools or systems did you use regularly—like CRMs, ticketing tools, or any software?","phase":"cv"},
  {"id":"Q6_GAP_OR_TRANSITION","text":"CONDITIONAL","phase":"cv"},
  {"id":"Q7_SCENARIO_TECH_SUPPORT","text":"A customer says: ‘My internet hasn’t been working since yesterday.’ What would you say and do first?","phase":"scenario"},
  {"id":"Q8_SCENARIO_ANGRY_BILLING","text":"A customer is angry and says they were charged incorrectly. What would you say first, and why?","phase":"scenario"},
  {"id":"Q9_POLICY_COMPLIANCE","text":"A customer asks you to do something against policy and says ‘another agent did it for me before.’ How do you handle it?","phase":"scenario"},
  {"id":"Q10_STRESS_PRESSURE","text":"Tell me about a time you worked under pressure or handled a difficult situation. What did you do?","phase":"reliability"},
  {"id":"Q11_SCHEDULE_RELIABILITY","text":"Call centre roles require punctuality and consistency. How do you make sure you stay on time and focused during long shifts?","phase":"reliability"},
  {"id":"Q12_COACHABILITY_CLOSING","text":"What part of customer service do you find most challenging, and what would you like to improve?","phase":"closing"}
];

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

    // 1. Initialize or Recover State
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

    // Robust fallbacks for state properties
    if (state.current_master_index === undefined) state.current_master_index = 0;
    if (state.followups_used === undefined) state.followups_used = 0;
    if (!state.master_questions_asked) state.master_questions_asked = [];
    if (state.time_elapsed_minutes === undefined) state.time_elapsed_minutes = 0;

    // 2. Analyze Last Turn (Inputs)
    const lastUserMsg = transcript.length > 0 && transcript[transcript.length - 1].role === 'user' 
        ? transcript[transcript.length - 1] 
        : null;

    let answerDuration = 0;
    let isShortAnswer = false;
    let isVague = false;
    let silenceLong = false; // Mock detection
    
    if (lastUserMsg) {
       // Estimate duration
       if (lastUserMsg.timestamps && lastUserMsg.timestamps.end_sec && lastUserMsg.timestamps.start_sec) {
           answerDuration = lastUserMsg.timestamps.end_sec - lastUserMsg.timestamps.start_sec;
       } else {
           // Fallback estimate: 150 wpm -> 2.5 words per sec
           const words = lastUserMsg.content.split(' ').length;
           answerDuration = words / 2.5;
       }

       if (answerDuration < 12) isShortAnswer = true;
       
       // Heuristic vagueness check
       const content = lastUserMsg.content.toLowerCase();
       if (content.length > 20 && !content.includes("example") && !content.includes("because") && !content.includes("specifically")) {
           // 20% random chance of vagueness for demo if no specific keywords found
           if (Math.random() > 0.8) isVague = true; 
       }
    }

    // 3. Controller Logic
    let nextQ: NextQuestionOutput | null = null;
    let updatedIndex = state.current_master_index;
    let updatedFollowups = state.followups_used;
    let updatedLastQId = state.last_question_id;
    let updatedLastQType = state.last_question_type;
    let updatedPhase = state.phase;

    // Time Control
    const HARD_STOP_MINUTES = 43; // Trigger closing immediately
    const RUSH_MODE_THRESHOLD = 28; // Stop follow-ups

    // Update time: Add ~1 min per turn average if not real-time
    const turnOverhead = (answerDuration + 15) / 60; 
    const currentTime = state.time_elapsed_minutes + (lastUserMsg ? turnOverhead : 0);

    // A. HARD STOP CHECK
    if (currentTime >= HARD_STOP_MINUTES) {
        if (state.phase !== 'closing_timeout' && state.phase !== 'complete') {
             nextQ = {
                id: 'Q_CLOSE_TIMEOUT',
                type: 'closing',
                text: "I'm afraid we are out of time. Thank you for your responses today. We will be in touch shortly.",
                phase: 'closing',
                expected_answer_length_seconds: 5,
                stop_listening_when: { silence_seconds: 2.0, max_answer_seconds: 10 },
                targets: ['Professionalism'],
                why: "Hard time limit reached."
             };
             updatedPhase = 'closing_timeout';
        } else {
             // Already timed out and asking to close, stop returning questions
             nextQ = null;
        }
    } else {
        // B. STANDARD FLOW
        
        // RUSH MODE: If late (>= 28m) AND fewer than 3 master questions remain?
        // Let's implement strict rush logic: If >= 28m, disable followups.
        const rushMode = currentTime >= RUSH_MODE_THRESHOLD;

        // FOLLOW-UP ELIGIBILITY
        // 1. Must be after a MASTER question
        // 2. Max 6 total followups
        // 3. Not in rush mode
        const canFollowup = 
            state.last_question_type === 'master' && 
            updatedFollowups < 6 &&
            !rushMode;

        let triggerFollowup = false;
        let followupReason = "";

        if (canFollowup) {
            if (isShortAnswer || silenceLong) { 
                triggerFollowup = true; 
                followupReason = "Answer too short / silence"; 
            } else if (isVague) { 
                triggerFollowup = true; 
                followupReason = "Answer too vague"; 
            }
        }

        if (triggerFollowup) {
             // --- GENERATE FOLLOW-UP ---
             const text = isShortAnswer 
                ? "Could you tell me a little more about that?" 
                : "Can you give me a specific example to help me understand better?";
             
             nextQ = {
                id: `${state.last_question_id}_FU`,
                type: 'followup',
                text: text,
                phase: state.phase || 'interview',
                expected_answer_length_seconds: 45,
                stop_listening_when: { silence_seconds: 3.0, max_answer_seconds: 60 },
                targets: ['Detail', 'Clarity'],
                why: followupReason
             };
             updatedFollowups++;
             updatedLastQType = 'followup';
             // Index does NOT increment
        } else {
            // --- NEXT MASTER QUESTION ---
            
            if (updatedIndex < MASTER_SCRIPT.length) {
                const scriptItem = MASTER_SCRIPT[updatedIndex];
                let textToAsk = scriptItem.text;

                // CONDITIONAL HANDLING
                if (scriptItem.id === 'Q3_RECENT_ROLE_DETAILS') {
                    const companyName = profile?.totals?.most_recent_company || "your most recent company";
                    textToAsk = textToAsk.replace('[MOST_RECENT_COMPANY]', companyName);
                }

                if (scriptItem.id === 'Q6_GAP_OR_TRANSITION') {
                    // Check for gap >= 2 months
                    const hasSignificantGap = profile?.gap_analysis?.gaps?.some(g => (g.gap_months || 0) >= 2);
                    
                    if (hasSignificantGap) {
                        const gap = profile?.gap_analysis?.gaps?.find(g => (g.gap_months || 0) >= 2);
                        const dateStr = gap?.gap_start_date ? `around ${gap.gap_start_date}` : "in your history";
                        textToAsk = `I see a gap in your employment ${dateStr}. Could you tell me a bit about that time?`;
                    } else {
                        textToAsk = "Why are you looking to leave your current or most recent position now?";
                    }
                }

                nextQ = {
                    id: scriptItem.id,
                    type: 'master',
                    text: textToAsk,
                    phase: scriptItem.phase,
                    expected_answer_length_seconds: 75,
                    stop_listening_when: { silence_seconds: 3.0, max_answer_seconds: 120 },
                    targets: ['Core Competency'],
                    why: "Master script sequence"
                };

                updatedPhase = scriptItem.phase;
                updatedIndex++; // Advance index
                updatedLastQId = scriptItem.id;
                updatedLastQType = 'master';
                
                // Track asked ID
                const askedList = [...(state.master_questions_asked || [])];
                if (!askedList.includes(scriptItem.id)) askedList.push(scriptItem.id);
                state.master_questions_asked = askedList;

            } else {
                // --- SCRIPT EXHAUSTED ---
                if (state.phase !== 'complete') {
                    nextQ = {
                        id: 'Q_CLOSE_DONE',
                        type: 'closing',
                        text: "That covers all my questions. Thank you for your time and honesty today. We'll be reviewing your application shortly.",
                        phase: 'closing',
                        expected_answer_length_seconds: 0,
                        stop_listening_when: { silence_seconds: 2.0, max_answer_seconds: 10 },
                        targets: ['Professionalism'],
                        why: "Interview complete"
                    };
                    updatedPhase = 'complete';
                } else {
                    nextQ = null; // Truly done
                }
            }
        }
    }

    const updatedState: InterviewState = {
      ...state,
      current_master_index: updatedIndex,
      master_questions_asked: state.master_questions_asked,
      followups_used: updatedFollowups,
      time_elapsed_minutes: currentTime,
      last_question_id: updatedLastQId,
      last_question_type: updatedLastQType,
      phase: updatedPhase as any
    };

    return {
      next_question: nextQ,
      updated_state: updatedState
    };
  },

  async processVideoResponse(
    questionId: string,
    rawBlob: any // Mock Blob
  ): Promise<TranscriptItem> {
    // Simulate STT processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockResponses = [
        "So, in my last role, I had to deal with this exact issue. I usually start by listening to the customer fully.",
        "That is a great question. I believe reliability comes from having a structured routine.",
        "I would apologize sincerely and then check the system for any known outages immediately.",
        "I'm actually quite comfortable with sales. I used to upsell warranties at my retail job."
    ];
    const content = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    const duration = 15 + Math.random() * 45; 
    
    return {
        role: 'user',
        content: content,
        timestamps: {
            start_sec: 0,
            end_sec: parseFloat(duration.toFixed(1))
        },
        quality_flags: Math.random() > 0.8 ? ['background_noise'] : [],
        video_url: 'mock_video_url.mp4'
    };
  },

  async scoreSingleAnswer(
    profile: CandidateProfile | undefined,
    question: { id: string; text: string },
    answer: string,
    audioMetrics?: { speaking_rate_wpm: number; pause_ratio: number; filler_word_rate: number }
  ): Promise<QuestionScore> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const lAnswer = answer.toLowerCase();
    const lQuestion = question.text.toLowerCase();

    // Determine Relevance
    const isDeescalation = lQuestion.includes("angry") || lQuestion.includes("yelling") || lQuestion.includes("frustrated");
    const isReliability = lQuestion.includes("time") || lQuestion.includes("shift") || lQuestion.includes("reliable");
    const isSales = lQuestion.includes("sell") || lQuestion.includes("offer") || lQuestion.includes("upgrade");
    const isCoachability = lQuestion.includes("feedback") || lQuestion.includes("criticism");
    const isStress = lQuestion.includes("stress") || lQuestion.includes("pressure");
    const isCV = lQuestion.includes("role") || lQuestion.includes("experience") || lQuestion.includes("history");
    const isProcess = lQuestion.includes("policy") || lQuestion.includes("procedure");

    // Base Metrics
    const wordCount = answer.split(/\s+/).length;
    
    let commScore = 0.85; 
    if (wordCount < 10) commScore -= 0.3;
    if (audioMetrics) {
        if (audioMetrics.filler_word_rate > 0.05) commScore -= 0.15;
    }
    commScore = Math.max(0.1, Math.min(1.0, commScore));

    let coherenceScore = 0.9;
    if (audioMetrics) {
        if (audioMetrics.speaking_rate_wpm < 110 || audioMetrics.speaking_rate_wpm > 180) coherenceScore -= 0.15;
    }

    const positiveQuotes: string[] = [];
    const concernQuotes: string[] = [];

    // Empathy
    let empathyScore: number | null = null;
    if (isDeescalation) {
        const keywords = ['sorry', 'apologize', 'understand', 'hear you'];
        const matches = keywords.filter(k => lAnswer.includes(k));
        empathyScore = matches.length > 0 ? 0.85 : 0.4;
        if (matches.length > 0) positiveQuotes.push("Demonstrated empathy.");
    }

    // Round
    const round = (n: number | null) => n === null ? null : Number(Math.max(0.1, Math.min(1.0, n)).toFixed(2));

    return {
      question_id: question.id,
      dimension_scores: {
        communication_clarity: round(commScore),
        speaking_coherence_proxy: round(coherenceScore),
        empathy: round(empathyScore),
        de_escalation: isDeescalation ? round(0.75) : null,
        process_compliance: isProcess ? round(0.7) : null,
        stress_handling: isStress ? round(0.75) : null,
        reliability: isReliability ? round(0.8) : null,
        sales_potential: isSales ? round(0.6) : null,
        coachability: isCoachability ? round(0.8) : null,
        cv_alignment: isCV ? round(0.9) : null
      },
      evidence: { positive_quotes: positiveQuotes, concern_quotes: concernQuotes },
      notes: [],
      ai_confidence: 0.88
    };
  },

  async scoreInterview(session: InterviewSession): Promise<{
    scores: InterviewSession['scores'];
    overallScore: number;
    recommendation: InterviewRecommendation;
    summaryForCompany: SummaryForCompany;
    feedbackForCandidate: FeedbackForCandidate;
  }> {
    // FINAL AI EVALUATOR LOGIC (Mock)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 1. Analyze Transcript Heuristics
    const fullTranscript = session.transcript.map(t => t.content).join(" ");
    const wordCount = fullTranscript.split(/\s+/).length;
    
    const countKeywords = (text: string, keywords: string[]) => {
      const lower = text.toLowerCase();
      return keywords.filter(k => lower.includes(k)).length;
    };

    // Calculate Scores based on transcript content
    // Communication (0.20): Base on length and structure
    const commScore = Math.min(1.0, Math.max(0.3, wordCount > 200 ? 0.85 : 0.5));
    
    // Empathy (0.15): Look for sorry, understand, feel
    const empathyCount = countKeywords(fullTranscript, ['sorry', 'understand', 'apologize', 'feel', 'frustrating']);
    const empathyScore = Math.min(1.0, 0.4 + (empathyCount * 0.15));

    // Reliability (0.10): Look for time, schedule, always
    const relCount = countKeywords(fullTranscript, ['time', 'schedule', 'always', 'ensure', 'plan']);
    const relScore = Math.min(1.0, 0.5 + (relCount * 0.1));

    // Sales (0.05)
    const salesCount = countKeywords(fullTranscript, ['buy', 'offer', 'benefit', 'upgrade', 'value']);
    const salesScore = Math.min(1.0, 0.4 + (salesCount * 0.15));

    const scores = {
        communication: Number(commScore.toFixed(2)),
        coherence: 0.85, // Default proxy
        empathy: Number(empathyScore.toFixed(2)),
        deescalation: 0.75, // Default
        process: 0.8, // Default
        stress: 0.7, // Default
        reliability: Number(relScore.toFixed(2)),
        sales: Number(salesScore.toFixed(2)),
        coachability: 0.85 // Default
    };

    // 2. Weighted Overall Score
    const weightedSum = 
      (scores.communication * 0.20) +
      (scores.coherence * 0.10) +
      (scores.empathy * 0.15) +
      (scores.deescalation * 0.10) +
      (scores.process * 0.15) +
      (scores.stress * 0.10) +
      (scores.reliability * 0.10) +
      (scores.sales * 0.05) +
      (scores.coachability * 0.05);
    
    const overallScore = Math.round(weightedSum * 100);

    // 3. Risk Flags
    const risks: string[] = [];
    if (scores.communication < 0.50) risks.push("Critical Risk: Communication clarity is below standard.");
    if (scores.process < 0.50) risks.push("Process Risk: Indicated disregard for procedures.");
    if (scores.reliability < 0.50) risks.push("Reliability Risk: Responses suggest potential attendance issues.");
    if (scores.stress < 0.45) risks.push("Burnout Risk: Low stress resilience score.");

    // 4. Recommendation Logic
    let recommendation = InterviewRecommendation.NOT_RECOMMENDED_YET;
    if (overallScore >= 75 && risks.length === 0) {
      recommendation = InterviewRecommendation.HIRE_READY;
    } else if (overallScore >= 60) {
      recommendation = InterviewRecommendation.INTERVIEW_RECOMMENDED;
    }

    // 5. Outputs
    const summaryForCompany: SummaryForCompany = {
      strengths: [
        scores.empathy > 0.7 ? "Demonstrates strong empathy and emotional intelligence." : "Standard empathy levels.",
        scores.communication > 0.8 ? "Excellent communication clarity." : "Acceptable communication skills.",
        overallScore > 80 ? "Top performer candidate." : "Solid candidate for development."
      ],
      risks: risks,
      recommended_followup_questions: risks.length > 0 ? ["Please discuss a time you had to strictly follow a process you disagreed with."] : []
    };

    const feedbackForCandidate: FeedbackForCandidate = {
      positive: [
        "You spoke clearly and confidently.",
        empathyCount > 0 ? "You showed good empathy in your responses." : "You kept your answers professional."
      ],
      improve: scores.sales < 0.6 ? ["Commercial Awareness"] : [],
      detailed_insights: [
        {
            area: "Sales Potential",
            evidence: ["Limited use of persuasive vocabulary."],
            why_it_matters_for_bpo: "Every service interaction is an opportunity to add value.",
            quick_practice_tip: "Try to phrase solutions as 'benefits' to the customer."
        }
      ],
      coaching_offers: overallScore < 75 ? [{
          type: 'INTERVIEW_PREP',
          priority: 'medium',
          reason: "Polishing your answers could get you to Hire Ready status.",
          expected_benefit: "Higher placement chance."
      }] : []
    };

    return {
      scores,
      overallScore,
      recommendation,
      summaryForCompany,
      feedbackForCandidate
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
    return programs.map(p => ({
        programId: p.id,
        matchScore: 85,
        matchTier: 'strong',
        status: ApplicationStatus.SUGGESTED,
        matchBreakdown: {
            must_have_overlap: 1,
            nice_to_have_overlap: 0.5,
            readiness_boost: 0.2,
            program_type_fit: 0.8,
            why_this_match: ["Good fit based on skills and interview score."],
            risks_for_this_program: []
        }
    }));
  },

  async analyzeFeedback(summary: FeedbackSummary): Promise<FeedbackAnalysis> {
    return {
        top_issues: [],
        script_change_proposals: [],
        scoring_rubric_adjustments: []
    };
  },

  async segmentTurns(inputs: AlignmentInput): Promise<AlignmentOutput> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const { questions_asked, candidate_speech_segments, stt_words } = inputs;
    const turns: TurnSegment[] = [];
    const issues: string[] = [];

    // TRANSCRIPT ALIGNMENT LOGIC (Heuristic)
    const sortedQuestions = [...questions_asked].sort((a, b) => a.start_sec - b.start_sec);

    for (let i = 0; i < sortedQuestions.length; i++) {
        const q = sortedQuestions[i];
        const nextQ = sortedQuestions[i + 1];
        
        // Define Window: End of this Q -> Start of Next Q
        const windowStart = q.end_sec;
        const windowEnd = nextQ ? nextQ.start_sec : 999999; 

        // Filter words in window
        const wordsInWindow = stt_words.filter(w => w.start_sec >= windowStart && w.end_sec <= windowEnd);
        
        const answerText = wordsInWindow.map(w => w.word).join(" ");
        const answerStart = wordsInWindow.length > 0 ? wordsInWindow[0].start_sec : null;
        const answerEnd = wordsInWindow.length > 0 ? wordsInWindow[wordsInWindow.length-1].end_sec : null;
        
        const flags = [];
        if (!answerText) flags.push("no_answer_detected");
        
        // Check alignment confidence
        // If speech starts immediately (<0.2s) after question, flag overlap
        if (answerStart !== null && (answerStart - windowStart) < 0.2) {
             flags.push("potential_overlap");
        }

        turns.push({
            question_id: q.question_id,
            question_text: q.text,
            answer_text: answerText,
            answer_start_sec: answerStart,
            answer_end_sec: answerEnd,
            quality_flags: flags
        });
    }

    return {
        turns,
        alignment_quality: {
            confidence: issues.length > 0 ? 0.7 : 0.95,
            issues
        }
    };
  }
};