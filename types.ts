export enum UserRole {
  CANDIDATE = 'CANDIDATE',
  COMPANY_USER = 'COMPANY_USER',
  SERENITY_ADMIN = 'SERENITY_ADMIN'
}

export enum CompanyRole {
  ADMIN = 'ADMIN',
  HIRING_MANAGER = 'HIRING_MANAGER',
  RECRUITER = 'RECRUITER'
}

export enum InterviewMode {
  TEXT = 'TEXT',
  VIDEO = 'VIDEO'
}

export enum InterviewStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETE = 'COMPLETE'
}

export enum InterviewRecommendation {
  HIRE_READY = 'HIRE_READY',
  INTERVIEW_RECOMMENDED = 'INTERVIEW_RECOMMENDED',
  NOT_RECOMMENDED_YET = 'NOT_RECOMMENDED_YET'
}

export enum ProgramType {
  INBOUND_SUPPORT = 'INBOUND_SUPPORT',
  OUTBOUND_SALES = 'OUTBOUND_SALES',
  TECH_SUPPORT = 'TECH_SUPPORT',
  OTHER = 'OTHER'
}

export enum ProgramStatus {
  DRAFT = 'DRAFT',
  LIVE = 'LIVE',
  CLOSED = 'CLOSED'
}

export enum ApplicationStatus {
  SUGGESTED = 'SUGGESTED',
  APPLIED = 'APPLIED',
  SHORTLISTED = 'SHORTLISTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

// Domain Interfaces
export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
}

export interface WorkHistoryItem {
  company: string | null;
  title: string | null;
  employment_type: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  months_in_role: number | null;
  responsibilities: string[];
  customer_facing: "yes" | "no" | "unclear";
  channels: string[];
  tools_systems: string[];
  bpo_signals: string[];
}

export interface EducationItem {
  institution: string | null;
  degree: string | null;
  field_of_study: string | null;
  graduation_date: string | null;
}

export interface GapAnalysis {
  gaps: Array<{
    gap_start_date: string | null;
    gap_end_date: string | null;
    gap_months: number | null;
    note: string | null;
  }>;
  job_hopping_risk: "low" | "medium" | "high";
}

export interface ProfileTotals {
  total_years_experience_estimate: number | null;
  total_customer_service_years_estimate: number | null;
  most_recent_role_title: string | null;
  most_recent_company: string | null;
}

export interface CandidateProfile {
  headline: string | null;
  summary: string | null;
  skills: string[];
  languages: string[];
  certifications: string[];
  work_history: WorkHistoryItem[];
  education: EducationItem[];
  gap_analysis: GapAnalysis;
  totals: ProfileTotals;
  extraction_quality: {
    confidence: number;
    missing_fields: string[];
  };
}

export interface Candidate {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  location: string;
  cvId?: string;
  cvUrl?: string; 
  profile?: CandidateProfile;
}

export interface CandidateCV {
  id: string;
  candidateId: string;
  fileName: string;
  fileUrl: string; 
  rawText: string;
  createdAt: string;
}

export interface InterviewState {
  // Core Tracking
  current_master_index: number; // 0-based index into MASTER_SCRIPT
  master_questions_asked: string[]; // IDs
  followups_used: number; // Count
  
  // Timing
  time_elapsed_minutes: number;
  
  // Logic Flags
  flags: string[];
  
  // Turn Context
  last_question_id?: string | null;
  last_question_type?: 'master' | 'followup' | null;

  // Legacy/UI Compat
  phase?: string; 
}

export interface QuestionScore {
  question_id: string;
  dimension_scores: {
    communication_clarity: number | null;
    speaking_coherence_proxy: number | null; // Renamed from accent
    empathy: number | null;
    de_escalation: number | null;
    process_compliance: number | null;
    stress_handling: number | null;
    reliability: number | null;
    sales_potential: number | null;
    coachability: number | null;
    cv_alignment: number | null;
  };
  evidence: {
    positive_quotes: string[];
    concern_quotes: string[];
  };
  audio_signal_notes?: string[];
  notes: string[];
  ai_confidence: number;
}

export interface ImprovementInsight {
  area: string;
  evidence: string[];
  why_it_matters_for_bpo: string;
  quick_practice_tip: string;
}

export interface CoachingOffer {
  type: 'CV_REWRITE' | 'INTERVIEW_PREP' | 'COMMUNICATION_COACHING' | 'JOB_READINESS';
  priority: 'high' | 'medium' | 'low';
  reason: string;
  expected_benefit: string;
}

export interface FeedbackForCandidate {
  positive: string[];
  improve: string[]; // Kept for backward compat
  detailed_insights: ImprovementInsight[];
  coaching_offers: CoachingOffer[];
}

export interface SummaryForCompany {
  strengths: string[];
  risks: string[];
  recommended_followup_questions: string[];
}

export interface TranscriptItem {
  role: 'system' | 'user';
  content: string;
  id?: string;
  // Video specific metadata
  timestamps?: {
    start_sec: number | null;
    end_sec: number | null;
  };
  quality_flags?: string[];
  video_url?: string; // Mock URL for playback
}

export interface InterviewSession {
  id: string;
  candidateId: string;
  mode: InterviewMode;
  status: InterviewStatus;
  interviewState?: InterviewState;
  transcript: TranscriptItem[];
  questionScores: QuestionScore[];
  scores: {
    communication: number;
    coherence: number; // Renamed from accent
    empathy: number;
    deescalation: number;
    process: number;
    stress: number;
    reliability: number;
    sales: number;
    coachability: number;
  };
  overallScore: number;
  recommendation: InterviewRecommendation;
  summaryForCompany?: SummaryForCompany;
  feedbackForCandidate?: FeedbackForCandidate;
  createdAt: string;
}

export interface Program {
  id: string;
  companyId: string;
  title: string;
  description: string;
  location: string;
  type: ProgramType;
  headcountNeeded: number;
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  status: ProgramStatus;
  createdAt: string;
}

export interface MatchBreakdown {
  must_have_overlap: number;
  nice_to_have_overlap: number;
  readiness_boost: number;
  program_type_fit: number;
  why_this_match: string[];
  risks_for_this_program: string[];
}

export interface Application {
  id: string;
  candidateId: string;
  programId: string;
  status: ApplicationStatus;
  matchScore: number;
  matchTier?: 'strong' | 'medium' | 'stretch';
  matchBreakdown?: MatchBreakdown;
  createdAt: string;
}

export interface InterviewQuestion {
  id: string;
  text: string;
  dimension: keyof InterviewSession['scores'];
}

export interface InterviewFeedback {
  id: string;
  candidateId: string;
  interviewId: string;
  clarityRating: number; // 1-5
  relevanceRating: number; // 1-5
  fairnessRating: number; // 1-5
  tags: string[]; // e.g., "confusing_question", "video_lag", "good_flow"
  comment: string;
  createdAt: string;
}

export interface FeedbackSummary {
  avg_clarity: number;
  avg_relevance: number;
  avg_fairness: number;
  tags: Record<string, number>;
  recent_comments: string[];
  total_responses: number;
}

export interface FeedbackAnalysis {
  top_issues: Array<{
    issue: string;
    evidence: {
      avg_clarity: number;
      avg_relevance: number;
      avg_fairness: number;
      top_tags: string[];
      example_comments: string[];
    };
    impact: 'high' | 'medium' | 'low';
    recommended_fix: string;
  }>;
  script_change_proposals: Array<{
    change_type: 'rewrite_question' | 'remove_question' | 'add_question' | 'reorder_sections' | 'clarify_instructions';
    current_text: string | null;
    proposed_text: string | null;
    rationale: string;
  }>;
  scoring_rubric_adjustments: Array<{
    dimension: string;
    suggested_change: string;
    rationale: string;
  }>;
}

export interface NextQuestionOutput {
  id: string;
  text: string;
  phase: string;
  type?: 'master' | 'followup' | 'closing'; // Updated type literal
  targets?: string[];
  expected_answer_length_seconds?: number;
  stop_listening_when?: {
    silence_seconds: number;
    max_answer_seconds: number;
  };
  why?: string;
}

// Transcript Alignment Types
export interface AlignmentInput {
  questions_asked: Array<{question_id: string, text: string, start_sec: number, end_sec: number}>;
  candidate_speech_segments: Array<{segment_id: string, start_sec: number, end_sec: number}>;
  stt_words: Array<{start_sec: number, end_sec: number, word: string}>;
}

export interface TurnSegment {
  question_id: string;
  question_text: string;
  answer_text: string;
  answer_start_sec: number | null;
  answer_end_sec: number | null;
  quality_flags: string[];
}

export interface AlignmentOutput {
  turns: TurnSegment[];
  alignment_quality: {
    confidence: number;
    issues: string[];
  };
}