
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../db';
import { Company, Program, Application, InterviewSession, InterviewRecommendation, ApplicationStatus } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input } from '../../ui';
import { Briefcase, Users, FileText, CheckCircle, BarChart, ChevronRight, TrendingUp, AlertCircle, Filter } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<{
      companies: Company[], 
      programs: Program[], 
      candidates: any[], 
      interviews: InterviewSession[], 
      applications: Application[]
  } | null>(null);

  // Filter State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('ALL');

  useEffect(() => {
    const load = async () => {
       const d = await db.getAdminFullData();
       setData(d);
    };
    load();
  }, []);

  if (!data) return <div className="p-8">Loading operational console...</div>;

  // -- CALCULATIONS --

  // Filter Data
  const filteredPrograms = selectedCompanyId === 'ALL' ? data.programs : data.programs.filter(p => p.companyId === selectedCompanyId);
  const filteredApps = selectedCompanyId === 'ALL' ? data.applications : data.applications.filter(a => {
      const prog = data.programs.find(p => p.id === a.programId);
      return prog?.companyId === selectedCompanyId;
  });

  // KPIs
  const activeRoles = filteredPrograms.filter(p => p.status === 'LIVE');
  const totalHeadcountNeeded = activeRoles.reduce((sum, p) => sum + p.headcountNeeded, 0);
  const candidatesInPipeline = new Set(filteredApps.map(a => a.candidateId)).size;
  const interviewsConducted = data.interviews.length; // Global for now as interviews aren't always tied to company directly until matched
  const hireReadyCount = data.interviews.filter(i => i.recommendation === InterviewRecommendation.HIRE_READY).length;
  
  // Direct Hire vs Re-interview (Confidence Metric)
  const acceptedCount = filteredApps.filter(a => a.status === ApplicationStatus.ACCEPTED).length;
  const reInterviewCount = filteredApps.filter(a => a.status === ApplicationStatus.INTERVIEW_REQUESTED).length;
  const totalDecisions = acceptedCount + reInterviewCount;
  const confidenceScore = totalDecisions > 0 ? Math.round((acceptedCount / totalDecisions) * 100) : 0;

  // Funnel Data
  const cvs = data.candidates.filter(c => c.cvId).length;
  const interviews = data.interviews.length;
  const matches = data.applications.length;
  const shortlisted = data.applications.filter(a => a.status === ApplicationStatus.SHORTLISTED || a.status === ApplicationStatus.ACCEPTED || a.status === ApplicationStatus.INTERVIEW_REQUESTED).length;
  const hires = data.applications.filter(a => a.status === ApplicationStatus.ACCEPTED).length;

  return (
    <div className="space-y-8">
      
      {/* Header & Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border">
         <div>
            <h1 className="text-2xl font-bold text-gray-900">Operational Console</h1>
            <p className="text-sm text-gray-500">Real-time oversight of recruitment operations.</p>
         </div>
         <div className="flex items-center gap-3">
             <Filter className="h-4 w-4 text-gray-500" />
             <select 
               className="border-gray-300 rounded-md text-sm"
               value={selectedCompanyId}
               onChange={(e) => setSelectedCompanyId(e.target.value)}
             >
                 <option value="ALL">All Companies</option>
                 {data.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
         </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <KPICard title="Active Roles" value={activeRoles.length} icon={<Briefcase className="text-indigo-600" />} />
         <KPICard title="Headcount Demand" value={totalHeadcountNeeded} icon={<Users className="text-blue-600" />} />
         <KPICard title="Pipeline Candidates" value={candidatesInPipeline} icon={<FileText className="text-orange-600" />} />
         <KPICard title="AI Confidence" value={`${confidenceScore}%`} sub="Direct Hire Rate" icon={<CheckCircle className="text-emerald-600" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Outstanding Roles & Gap Analysis */}
          <Card className="lg:col-span-2">
             <CardHeader>
                <CardTitle>Role Fulfillment Status</CardTitle>
             </CardHeader>
             <CardContent>
                <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-600">
                         <tr>
                            <th className="p-3">Role Title</th>
                            <th className="p-3">Company</th>
                            <th className="p-3">Needed</th>
                            <th className="p-3">Supplied</th>
                            <th className="p-3">Gap</th>
                            <th className="p-3">Action</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y">
                         {activeRoles.map(role => {
                             const supplied = filteredApps.filter(a => a.programId === role.id && a.status !== ApplicationStatus.REJECTED).length;
                             const gap = Math.max(0, role.headcountNeeded - supplied);
                             const companyName = data.companies.find(c => c.id === role.companyId)?.name || 'Unknown';
                             
                             return (
                                 <tr key={role.id} className="hover:bg-gray-50">
                                     <td className="p-3 font-medium">{role.title}</td>
                                     <td className="p-3 text-gray-500">{companyName}</td>
                                     <td className="p-3">{role.headcountNeeded}</td>
                                     <td className="p-3">{supplied}</td>
                                     <td className="p-3">
                                         {gap > 0 ? (
                                             <span className="text-red-600 font-bold">-{gap}</span>
                                         ) : (
                                             <span className="text-green-600 font-bold">OK</span>
                                         )}
                                     </td>
                                     <td className="p-3">
                                         <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/role/${role.id}`)}>
                                             <ChevronRight className="h-4 w-4" />
                                         </Button>
                                     </td>
                                 </tr>
                             );
                         })}
                      </tbody>
                   </table>
                </div>
             </CardContent>
          </Card>

          {/* Funnel Metrics */}
          <Card>
             <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
             </CardHeader>
             <CardContent>
                <div className="space-y-4">
                    <FunnelStep label="Candidates (CV)" count={cvs} percent={100} />
                    <FunnelStep label="Interviewed" count={interviews} percent={cvs > 0 ? Math.round((interviews/cvs)*100) : 0} />
                    <FunnelStep label="Matched" count={matches} percent={interviews > 0 ? Math.round((matches/interviews)*100) : 0} />
                    <FunnelStep label="Shortlisted" count={shortlisted} percent={matches > 0 ? Math.round((shortlisted/matches)*100) : 0} />
                    <FunnelStep label="Hired" count={hires} percent={shortlisted > 0 ? Math.round((hires/shortlisted)*100) : 0} color="emerald" />
                </div>
             </CardContent>
          </Card>
      </div>

      {/* Companies Grid */}
      <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Company Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.companies.map(comp => (
                  <Card key={comp.id} className="hover:border-indigo-300 transition-colors cursor-pointer" onClick={() => navigate(`/admin/company/${comp.id}`)}>
                      <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                              <div>
                                  <h3 className="font-bold text-lg">{comp.name}</h3>
                                  <p className="text-sm text-gray-500">{comp.industry}</p>
                              </div>
                              <div className="bg-indigo-50 p-2 rounded-full text-indigo-600">
                                  <TrendingUp className="h-4 w-4" />
                              </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                  <p className="text-gray-500">Live Roles</p>
                                  <p className="font-bold">{data.programs.filter(p => p.companyId === comp.id && p.status === 'LIVE').length}</p>
                              </div>
                              <div>
                                  <p className="text-gray-500">Hires</p>
                                  <p className="font-bold">{data.applications.filter(a => {
                                      const p = data.programs.find(prog => prog.id === a.programId);
                                      return p?.companyId === comp.id && a.status === ApplicationStatus.ACCEPTED;
                                  }).length}</p>
                              </div>
                          </div>
                      </CardContent>
                  </Card>
              ))}
          </div>
      </div>

    </div>
  );
}

const KPICard = ({ title, value, sub, icon }: { title: string, value: string | number, sub?: string, icon: React.ReactNode }) => (
    <Card>
        <CardContent className="p-6 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">{icon}</div>
        </CardContent>
    </Card>
);

const FunnelStep = ({ label, count, percent, color = 'indigo' }: { label: string, count: number, percent: number, color?: string }) => (
    <div>
        <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-700">{label}</span>
            <span className="text-gray-500">{count} ({percent}%)</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
            <div className={`h-2 rounded-full bg-${color}-500`} style={{ width: `${percent}%` }}></div>
        </div>
    </div>
);
