
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../authContext';
import { db } from '../../db';
import { Company, Application, Program, InterviewRecommendation, ProgramStatus, ApplicationStatus } from '../../types';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input } from '../../ui';
import { Plus, Users, Search, Filter, Briefcase, CheckCircle, Clock, ShieldCheck, ChevronRight } from 'lucide-react';

export default function CompanyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [allApplications, setAllApplications] = useState<(Application & { candidate: any, interview: any, program: any })[]>([]);
  const [filteredApps, setFilteredApps] = useState<(Application & { candidate: any, interview: any, program: any })[]>([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const companies = JSON.parse(localStorage.getItem('serenity_companies') || '[]');
      if (companies.length > 0) {
        setCompany(companies[0]);
        // Fetch ALL applications across all programs for the "Candidate Pool" view
        const apps = await db.getCompanyApplications(companies[0].id);
        setAllApplications(apps);
        setFilteredApps(apps);
      }
    };
    load();
  }, [user]);

  // Handle Filtering
  useEffect(() => {
    let result = allApplications;

    if (search) {
      result = result.filter(a => a.candidate.fullName.toLowerCase().includes(search.toLowerCase()));
    }

    if (tierFilter !== 'ALL') {
      result = result.filter(a => a.interview.recommendation === tierFilter);
    }

    // Default Sort: Score Desc
    result.sort((a, b) => b.matchScore - a.matchScore);

    setFilteredApps(result);
  }, [search, tierFilter, allApplications]);

  if (!company) return <div className="p-8">Loading dashboard...</div>;

  // Stats
  const hireReadyCount = allApplications.filter(a => a.interview.recommendation === InterviewRecommendation.HIRE_READY).length;
  const reviewCount = allApplications.filter(a => a.status === ApplicationStatus.SUGGESTED || a.status === ApplicationStatus.APPLIED).length;
  const avgScore = allApplications.length > 0 
    ? Math.round(allApplications.reduce((acc, curr) => acc + curr.interview.overallScore, 0) / allApplications.length) 
    : 0;

  return (
    <div className="space-y-8">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{company.name} Recruiting</h1>
          <p className="text-gray-500">Overview of your candidate pipeline and active programs.</p>
        </div>
        <div className="flex gap-3">
             {/* Note: In a real app, this might toggle views or go to a separate programs list page */}
             <Button variant="outline" onClick={() => navigate('/company/create-program')}>
                <Briefcase className="h-4 w-4 mr-2" /> Manage Programs
             </Button>
             <Link to="/company/create-program">
                <Button>
                    <Plus className="h-4 w-4 mr-2" /> New Role
                </Button>
            </Link>
        </div>
      </div>

      {/* Top Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
            title="Total Candidates" 
            value={allApplications.length} 
            icon={<Users className="h-5 w-5 text-indigo-600" />} 
        />
        <StatCard 
            title="Hire Ready" 
            value={hireReadyCount} 
            icon={<CheckCircle className="h-5 w-5 text-emerald-600" />} 
        />
        <StatCard 
            title="Awaiting Review" 
            value={reviewCount} 
            icon={<Clock className="h-5 w-5 text-orange-600" />} 
        />
        <StatCard 
            title="Avg Interview Score" 
            value={avgScore} 
            suffix="/ 100"
            icon={<Briefcase className="h-5 w-5 text-blue-600" />} 
        />
      </div>

      {/* Candidate List Section */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b bg-gray-50/50">
           <div className="flex flex-col md:flex-row justify-between items-center gap-4">
               <CardTitle>Candidate Pool</CardTitle>
               <div className="flex gap-3 w-full md:w-auto">
                   <div className="relative flex-1 md:w-64">
                       <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                       <Input 
                        placeholder="Search candidates..." 
                        className="pl-8" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                       />
                   </div>
                   <div className="relative">
                       <Filter className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                       <select 
                        className="h-9 w-full rounded-md border border-gray-300 bg-transparent pl-8 pr-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                        value={tierFilter}
                        onChange={(e) => setTierFilter(e.target.value)}
                       >
                           <option value="ALL">All Tiers</option>
                           <option value={InterviewRecommendation.HIRE_READY}>Hire Ready</option>
                           <option value={InterviewRecommendation.INTERVIEW_RECOMMENDED}>Recommended</option>
                           <option value={InterviewRecommendation.NOT_RECOMMENDED_YET}>Not Ready</option>
                       </select>
                   </div>
               </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                        <tr>
                            <th className="px-6 py-3">Candidate</th>
                            <th className="px-6 py-3">Readiness Tier</th>
                            <th className="px-6 py-3">Assessment Summary</th>
                            <th className="px-6 py-3">Program Fit</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredApps.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No candidates match your filters.
                                </td>
                            </tr>
                        ) : (
                            filteredApps.map((app) => (
                                <tr key={app.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900">{app.candidate.fullName}</div>
                                        <div className="text-xs text-gray-500">{app.candidate.location}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <TierBadge tier={app.interview.recommendation} />
                                    </td>
                                    <td className="px-6 py-4 max-w-xs">
                                        <div className="truncate text-gray-600" title={app.interview.summaryForCompany?.short_overview || "No summary available."}>
                                            {app.interview.summaryForCompany?.short_overview || "Candidate assessment complete."}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-800">{app.program.title}</span>
                                            <span className="text-xs text-gray-500">{app.program.type.replace('_', ' ')}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={app.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => navigate(`/company/applications/${app.id}`)}
                                        >
                                            View Details
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </CardContent>
      </Card>

      {/* Trust & Compliance Footer */}
      <div className="border-t pt-6 flex flex-col md:flex-row items-center justify-between text-gray-500 text-xs gap-4">
          <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>
                  <strong>Compliance Note:</strong> AI insights are designed to support, not replace, human decision-making. 
                  No protected characteristics are used in scoring.
              </span>
          </div>
          <div className="text-right">
              Decisions remain solely with the employer.
          </div>
      </div>

    </div>
  );
}

// Sub-components for cleaner code
const StatCard = ({ title, value, suffix = '', icon }: { title: string, value: number, suffix?: string, icon?: React.ReactNode }) => (
    <Card>
      <CardContent className="p-6 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold mt-2 text-gray-900">{value}<span className="text-lg text-gray-400 font-normal">{suffix}</span></p>
        </div>
        {icon && <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>}
      </CardContent>
    </Card>
);

const TierBadge = ({ tier }: { tier: InterviewRecommendation }) => {
    switch (tier) {
        case InterviewRecommendation.HIRE_READY:
            return <Badge variant="success">Hire Ready</Badge>;
        case InterviewRecommendation.INTERVIEW_RECOMMENDED:
            return <Badge variant="warning">Recommended</Badge>;
        default:
            return <Badge variant="default">Not Ready</Badge>;
    }
};

const StatusBadge = ({ status }: { status: ApplicationStatus }) => {
    switch (status) {
        case ApplicationStatus.SHORTLISTED:
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">Shortlisted</span>;
        case ApplicationStatus.REJECTED:
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Passed</span>;
        case ApplicationStatus.INTERVIEW_REQUESTED:
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Interview Req</span>;
        case ApplicationStatus.ACCEPTED:
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Hired</span>;
        default:
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">New</span>;
    }
}
