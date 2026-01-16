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
    status: ProgramStatus.LIVE,
    createdAt: new Date().toISOString()
  }
];

const SEED_FEEDBACK: InterviewFeedback[] = [
  {
    id: 'f1', candidateId: 'c_mock_1', interviewId: 'i_1', 
    clarityRating: 2, relevanceRating: 5, fairnessRating: 5, 
    tags: ['confusing_question'], comment: "The question about the internet outage was weirdly phrased.", 
    createdAt: new Date().toISOString()
  },
  {
    id: 'f2', candidateId: 'c_mock_2', interviewId: 'i_2', 
    clarityRating: 4, relevanceRating: 4, fairnessRating: 5, 
    tags: ['good_flow'], comment: "Smooth process.", 
    createdAt: new Date().toISOString()
  },
  {
    id: 'f3', candidateId: 'c_mock_3', interviewId: 'i_3', 
    clarityRating: 2, relevanceRating: 3, fairnessRating: 4, 
    tags: ['confusing_question', 'repetitive'], comment: "I felt like I answered the empathy part twice.", 
    createdAt: new Date().toISOString()
  }
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
    if (!localStorage.getItem('serenity_initialized')) {
      this.set('users', SEED_USERS);
      this.set('companies', SEED_COMPANIES);
      this.set('candidates', [SEED_CANDIDATE]);
      this.set('programs', SEED_PROGRAMS);
      this.set('interviews', []);
      this.set('applications', []);
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
      .filter(a => a.candidate && a.interview); // Safety filter
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