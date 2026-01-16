
import { 
  User, UserRole, Company, Candidate, Program, Application, 
  InterviewSession, InterviewStatus, InterviewMode, 
  InterviewRecommendation, ProgramType, ProgramStatus, ApplicationStatus,
  CandidateCV, InterviewFeedback, FeedbackSummary
} from './types';
import { aiService } from './services/ai';

// Seed Data
const SEED_USERS: User[] = [
  { id: 'u1', email: 'candidate@demo.com', role: UserRole.CANDIDATE, name: 'Alex Rivera' },
  { id: 'u2', email: 'company@demo.com', role: UserRole.COMPANY_USER, name: 'Sarah Tech' },
  { id: 'u3', email: 'admin@serenity.com', role: UserRole.SERENITY_ADMIN, name: 'Admin User' }
];

const SEED_COMPANIES: Company[] = [
  { id: 'c1', name: 'Global Connect BPO', industry: 'Telecommunications' }
];

const SEED_CANDIDATE: Candidate = {
  id: 'cand1',
  userId: 'u1',
  fullName: 'Alex Rivera',
  phone: '+1 555 0101',
  location: 'Remote / New York',
  profile: {
    headline: "Customer Support Specialist",
    summary: "Experienced support agent with 2 years in retail.",
    skills: ['Customer Service', 'Zendesk', 'Typing 60WPM'],
    languages: ['English', 'Spanish'],
    certifications: [],
    work_history: [
      {
        company: "Retail Inc.",
        title: "Customer Associate",
        employment_type: "Full-time",
        location: "New York",
        start_date: "2021-01",
        end_date: "2023-01",
        is_current: false,
        months_in_role: 24,
        responsibilities: ["Assisted customers", "Stocked shelves"],
        customer_facing: "yes",
        channels: ["In-person"],
        tools_systems: ["POS"],
        bpo_signals: []
      }
    ],
    education: [
      {
        institution: "City High School",
        degree: "Diploma",
        field_of_study: "General",
        graduation_date: "2020-05"
      }
    ],
    gap_analysis: {
      gaps: [],
      job_hopping_risk: "low"
    },
    totals: {
      total_years_experience_estimate: 2,
      total_customer_service_years_estimate: 2,
      most_recent_role_title: "Customer Associate",
      most_recent_company: "Retail Inc."
    },
    extraction_quality: {
      confidence: 1.0,
      missing_fields: []
    }
  }
};

// Additional Mock Candidates to populate Company Dashboard
const EXTRA_CANDIDATES: Candidate[] = [
    {
        id: 'cand2', userId: 'u_mock_2', fullName: 'Jordan Lee', phone: '+1 555 0102', location: 'Manila',
        profile: { headline: 'Tech Support', summary: 'IT Grad', skills: ['Tech Savvy', 'English', 'Python', 'Troubleshooting'], languages: ['English'], certifications: [], work_history: [], education: [], gap_analysis: { gaps: [], job_hopping_risk: 'low' }, totals: { total_years_experience_estimate: 1, total_customer_service_years_estimate: 0, most_recent_role_title: 'Student', most_recent_company: 'Uni' }, extraction_quality: { confidence: 1, missing_fields: [] } }
    },
    {
        id: 'cand3', userId: 'u_mock_3', fullName: 'Casey Smith', phone: '+1 555 0103', location: 'Remote',
        profile: { headline: 'Sales Rep', summary: 'Driven sales agent', skills: ['Sales', 'Persuasion', 'Cold Calling'], languages: ['English'], certifications: [], work_history: [], education: [], gap_analysis: { gaps: [], job_hopping_risk: 'medium' }, totals: { total_years_experience_estimate: 3, total_customer_service_years_estimate: 3, most_recent_role_title: 'Sales Rep', most_recent_company: 'Solar Co' }, extraction_quality: { confidence: 1, missing_fields: [] } }
    },
    {
        id: 'cand4', userId: 'u_mock_4', fullName: 'Taylor Doe', phone: '+1 555 0104', location: 'Remote',
        profile: { headline: 'Admin Asst', summary: 'Organized admin', skills: ['Data Entry', 'Typing 80WPM', 'Excel'], languages: ['English'], certifications: [], work_history: [], education: [], gap_analysis: { gaps: [], job_hopping_risk: 'low' }, totals: { total_years_experience_estimate: 5, total_customer_service_years_estimate: 0, most_recent_role_title: 'Admin', most_recent_company: 'Logistics LLC' }, extraction_quality: { confidence: 1, missing_fields: [] } }
    },
    {
        id: 'cand5', userId: 'u_mock_5', fullName: 'Morgan Freeman', phone: '+1 555 0105', location: 'New York',
        profile: { headline: 'Customer Care', summary: 'Empathetic agent', skills: ['Customer Service', 'Empathy', 'De-escalation'], languages: ['English'], certifications: [], work_history: [], education: [], gap_analysis: { gaps: [], job_hopping_risk: 'low' }, totals: { total_years_experience_estimate: 2, total_customer_service_years_estimate: 2, most_recent_role_title: 'Support', most_recent_company: 'Helpdesk Inc' }, extraction_quality: { confidence: 1, missing_fields: [] } }
    }
];

const SEED_PROGRAMS: Program[] = [
  {
    id: 'p1',
    companyId: 'c1',
    title: 'L1 Tech Support Agent',
    description: 'Handle inbound technical queries for a major ISP.',
    location: 'Remote',
    type: ProgramType.TECH_SUPPORT,
    headcountNeeded: 15,
    mustHaveSkills: ['Tech Savvy', 'English'],
    niceToHaveSkills: ['Network Basics'],
    dealBreakers: ['No Tech Background', 'Job Hopping Risk'],
    status: ProgramStatus.LIVE,
    createdAt: new Date().toISOString()
  },
  {
    id: 'p2',
    companyId: 'c1',
    title: 'Customer Success Outbound',
    description: 'Outbound renewal calls for existing customers.',
    location: 'Remote',
    type: ProgramType.OUTBOUND_SALES,
    headcountNeeded: 5,
    mustHaveSkills: ['Sales', 'Persuasion'],
    niceToHaveSkills: ['CRM'],
    dealBreakers: ['Low Resilience', 'Communication Clarity Risk'],
    status: ProgramStatus.LIVE,
    createdAt: new Date().toISOString()
  }
];

const SEED_FEEDBACK: InterviewFeedback[] = [
    { id: 'fb1', candidateId: 'u1', interviewId: 'int1', clarityRating: 5, relevanceRating: 5, fairnessRating: 5, tags: ['smooth_process'], comment: 'Very easy to use.', createdAt: new Date().toISOString() },
    { id: 'fb2', candidateId: 'u2', interviewId: 'int2', clarityRating: 4, relevanceRating: 5, fairnessRating: 4, tags: ['good_ai'], comment: '', createdAt: new Date().toISOString() },
    { id: 'fb3', candidateId: 'u3', interviewId: 'int3', clarityRating: 3, relevanceRating: 4, fairnessRating: 5, tags: ['confusing_question'], comment: 'The billing question was tricky.', createdAt: new Date().toISOString() }
];

class MockDB {
  private get<T>(key: string, defaultVal: T): T {
    const stored = localStorage.getItem(`serenity_${key}`);
    return stored ? JSON.parse(stored) : defaultVal;
  }

  private set(key: string, val: any) {
    localStorage.setItem(`serenity_${key}`, JSON.stringify(val));
  }

  init() {
    // Only init if not already present
    if (!localStorage.getItem('serenity_initialized')) {
      const allCandidates = [SEED_CANDIDATE, ...EXTRA_CANDIDATES];
      this.set('users', SEED_USERS);
      this.set('companies', SEED_COMPANIES);
      this.set('candidates', allCandidates);
      this.set('programs', SEED_PROGRAMS);
      
      // Generate mock interviews for extra candidates to populate dashboards
      const mockInterviews: InterviewSession[] = EXTRA_CANDIDATES.map((c, i) => ({
          id: `int_mock_${i}`,
          candidateId: c.id,
          mode: InterviewMode.VIDEO,
          status: InterviewStatus.COMPLETE,
          transcript: [],
          questionScores: [],
          scores: { 
              communication: 0.7 + (Math.random() * 0.2), 
              coherence: 0.8, 
              empathy: i === 3 ? 0.9 : 0.6, 
              deescalation: 0.6, 
              process: i === 0 ? 0.9 : 0.5, 
              stress: i === 1 ? 0.9 : 0.5, 
              reliability: 0.8, 
              sales: i === 1 ? 0.9 : 0.4, 
              coachability: 0.7 
          },
          overallScore: 70 + (Math.random() * 20),
          recommendation: i === 0 || i === 1 ? InterviewRecommendation.HIRE_READY : InterviewRecommendation.INTERVIEW_RECOMMENDED,
          summaryForCompany: {
              short_overview: i === 0 ? "Strong tech background." : i === 1 ? "Excellent sales drive." : "Solid potential.",
              strengths: ["Communication"],
              risks: [],
              recommended_followup_questions: []
          },
          feedbackForCandidate: { positive: [], improve: [], detailed_insights: [], coaching_offers: [] },
          riskFlags: [],
          createdAt: new Date().toISOString()
      }));

      this.set('interviews', mockInterviews);
      
      // Generate applications for mock candidates
      const mockApps: Application[] = [];
      mockInterviews.forEach(int => {
          SEED_PROGRAMS.forEach(prog => {
               // Simple mock matching logic for seed
               let score = 75;
               if (prog.type === ProgramType.TECH_SUPPORT && int.scores.process > 0.8) score = 92;
               if (prog.type === ProgramType.OUTBOUND_SALES && int.scores.sales > 0.8) score = 88;
               
               mockApps.push({
                   id: `app_seed_${int.id}_${prog.id}`,
                   candidateId: int.candidateId,
                   programId: prog.id,
                   status: score > 85 ? ApplicationStatus.SHORTLISTED : ApplicationStatus.SUGGESTED,
                   matchScore: score,
                   matchTier: score > 85 ? 'strong' : 'medium',
                   matchBreakdown: { 
                       must_have_overlap: 1, nice_to_have_overlap: 0.5, readiness_boost: 0, program_type_fit: 10, 
                       why_this_match: ["Strong profile fit"], risks_for_this_program: [] 
                   },
                   createdAt: new Date().toISOString()
               });
          });
      });

      this.set('applications', mockApps);
      this.set('cvs', []);
      this.set('feedback', SEED_FEEDBACK);
      localStorage.setItem('serenity_initialized', 'true');
    }
  }

  // Auth Simulation
  async login(email: string): Promise<User | null> {
    const users = this.get<User[]>('users', []);
    return users.find(u => u.email === email) || null;
  }

  // Candidate Actions
  async getCandidateByUserId(userId: string): Promise<Candidate | null> {
    const candidates = this.get<Candidate[]>('candidates', []);
    return candidates.find(c => c.userId === userId) || null;
  }

  async getCandidateInterview(candidateId: string): Promise<InterviewSession | null> {
    const interviews = this.get<InterviewSession[]>('interviews', []);
    return interviews.find(i => i.candidateId === candidateId) || null;
  }

  async saveInterview(session: InterviewSession) {
    const interviews = this.get<InterviewSession[]>('interviews', []);
    const idx = interviews.findIndex(i => i.id === session.id);
    if (idx >= 0) interviews[idx] = session;
    else interviews.push(session);
    this.set('interviews', interviews);
    
    // Trigger auto-match if complete
    if (session.status === InterviewStatus.COMPLETE) {
      await this.runAutoMatch(session.candidateId);
    }
  }

  async saveCV(cv: CandidateCV, profile: any) {
    const cvs = this.get<CandidateCV[]>('cvs', []);
    cvs.push(cv);
    this.set('cvs', cvs);

    // Update candidate profile
    const candidates = this.get<Candidate[]>('candidates', []);
    const idx = candidates.findIndex(c => c.id === cv.candidateId);
    if (idx >= 0) {
      candidates[idx].cvId = cv.id;
      candidates[idx].cvUrl = cv.fileUrl;
      candidates[idx].profile = { ...candidates[idx].profile, ...profile };
      this.set('candidates', candidates);
    }
  }

  // Matching Logic
  async runAutoMatch(candidateId: string) {
    const programs = this.get<Program[]>('programs', []);
    const applications = this.get<Application[]>('applications', []);
    const candidates = this.get<Candidate[]>('candidates', []);
    const candidate = candidates.find(c => c.id === candidateId);
    const interview = await this.getCandidateInterview(candidateId);
    
    if (!candidate || !candidate.profile || !interview || interview.recommendation === InterviewRecommendation.NOT_RECOMMENDED_YET) return;

    // Run Match Ranking
    const matches = await aiService.rankPrograms(candidate.profile, interview, programs);

    // Persist matches as applications
    matches.forEach(match => {
      // Don't duplicate
      if (applications.find(a => a.candidateId === candidateId && a.programId === match.programId)) return;
      
      const newApp: Application = {
        id: `app_${Date.now()}_${Math.random()}`,
        candidateId,
        programId: match.programId!,
        status: ApplicationStatus.SUGGESTED,
        matchScore: match.matchScore || 0,
        matchTier: match.matchTier,
        matchBreakdown: match.matchBreakdown,
        createdAt: new Date().toISOString()
      };
      applications.push(newApp);
    });
    this.set('applications', applications);
  }

  async getCandidateApplications(candidateId: string): Promise<(Application & { program: Program })[]> {
    const apps = this.get<Application[]>('applications', []);
    const programs = this.get<Program[]>('programs', []);
    
    return apps
      .filter(a => a.candidateId === candidateId)
      .map(app => ({
        ...app,
        program: programs.find(p => p.id === app.programId)!
      }))
      .filter(a => a.program)
      .sort((a,b) => b.matchScore - a.matchScore);
  }

  // Company Actions
  async getCompanyPrograms(companyId: string): Promise<Program[]> {
    const programs = this.get<Program[]>('programs', []);
    return programs.filter(p => p.companyId === companyId);
  }

  async createProgram(program: Program) {
    const programs = this.get<Program[]>('programs', []);
    programs.push(program);
    this.set('programs', programs);
    return program;
  }

  async getProgramApplications(programId: string): Promise<(Application & { candidate: Candidate, interview: InterviewSession })[]> {
    const apps = this.get<Application[]>('applications', []);
    const candidates = this.get<Candidate[]>('candidates', []);
    const interviews = this.get<InterviewSession[]>('interviews', []);

    return apps
      .filter(a => a.programId === programId)
      .map(app => ({
        ...app,
        candidate: candidates.find(c => c.id === app.candidateId)!,
        interview: interviews.find(i => i.candidateId === app.candidateId)!
      }))
      .filter(a => a.candidate && a.interview);
  }

  // Get ALL applications for a company (for Dashboard "Candidate Pool" view)
  async getCompanyApplications(companyId: string): Promise<(Application & { candidate: Candidate, interview: InterviewSession, program: Program })[]> {
    const programs = await this.getCompanyPrograms(companyId);
    const programIds = new Set(programs.map(p => p.id));
    const apps = this.get<Application[]>('applications', []);
    const candidates = this.get<Candidate[]>('candidates', []);
    const interviews = this.get<InterviewSession[]>('interviews', []);

    return apps
      .filter(a => programIds.has(a.programId))
      .map(app => ({
        ...app,
        candidate: candidates.find(c => c.id === app.candidateId)!,
        interview: interviews.find(i => i.candidateId === app.candidateId)!,
        program: programs.find(p => p.id === app.programId)!
      }))
      .filter(a => a.candidate && a.interview && a.program);
  }

  // Update Application Decision
  async updateApplicationStatus(appId: string, status: ApplicationStatus, reason?: string, note?: string) {
    const apps = this.get<Application[]>('applications', []);
    const idx = apps.findIndex(a => a.id === appId);
    if (idx >= 0) {
      apps[idx].status = status;
      apps[idx].recruiterReason = reason;
      apps[idx].recruiterNote = note;
      apps[idx].updatedAt = new Date().toISOString();
      this.set('applications', apps);
    }
  }

  // Admin Actions
  async getAllStats() {
    return {
      candidates: this.get<Candidate[]>('candidates', []).length,
      interviews: this.get<InterviewSession[]>('interviews', []).length,
      programs: this.get<Program[]>('programs', []).length,
      applications: this.get<Application[]>('applications', []).length
    };
  }

  // Admin Analytics
  async getFeedbackSummary(): Promise<FeedbackSummary> {
    const feedback = this.get<InterviewFeedback[]>('feedback', []);
    const total = feedback.length;
    
    if (total === 0) {
      return { 
        avg_clarity: 0, avg_relevance: 0, avg_fairness: 0, 
        tags: {}, recent_comments: [], total_responses: 0 
      };
    }

    const tags: Record<string, number> = {};
    feedback.forEach(f => {
      f.tags.forEach(t => tags[t] = (tags[t] || 0) + 1);
    });

    return {
      avg_clarity: feedback.reduce((acc, f) => acc + f.clarityRating, 0) / total,
      avg_relevance: feedback.reduce((acc, f) => acc + f.relevanceRating, 0) / total,
      avg_fairness: feedback.reduce((acc, f) => acc + f.fairnessRating, 0) / total,
      tags,
      recent_comments: feedback.slice(-5).map(f => f.comment).filter(c => c.length > 0),
      total_responses: total
    };
  }
}

export const db = new MockDB();
