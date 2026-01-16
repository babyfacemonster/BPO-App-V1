
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../authContext';
import { db } from '../../db';
import { Application, Program, ApplicationStatus } from '../../types';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '../../ui';
import { ArrowLeft, Briefcase, Calendar, CheckCircle, Clock } from 'lucide-react';

export default function CandidateApplications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<(Application & { program: Program })[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const cand = await db.getCandidateByUserId(user.id);
      if (cand) {
        const apps = await db.getCandidateApplications(cand.id);
        setApplications(apps);
      }
    };
    load();
  }, [user]);

  const getStatusBadge = (status: ApplicationStatus) => {
      switch(status) {
          case ApplicationStatus.ACCEPTED: return <Badge variant="success">Accepted</Badge>;
          case ApplicationStatus.REJECTED: return <Badge variant="error">Declined</Badge>;
          case ApplicationStatus.SHORTLISTED: return <Badge variant="success">Shortlisted</Badge>;
          case ApplicationStatus.INTERVIEW_REQUESTED: return <Badge variant="warning">Interview Req</Badge>;
          case ApplicationStatus.APPLIED: return <Badge variant="default">Applied</Badge>;
          default: return <Badge variant="default">Suggested</Badge>;
      }
  };

  const filteredApps = applications.filter(app => {
      if (filter === 'ALL') return true;
      const isClosed = app.status === ApplicationStatus.REJECTED || app.status === ApplicationStatus.ACCEPTED;
      return filter === 'CLOSED' ? isClosed : !isClosed;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => navigate('/candidate')} className="pl-0">
         <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
      </Button>
      
      <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
              <button onClick={() => setFilter('ALL')} className={`px-3 py-1 rounded ${filter === 'ALL' ? 'bg-white shadow' : 'text-gray-500'}`}>All</button>
              <button onClick={() => setFilter('ACTIVE')} className={`px-3 py-1 rounded ${filter === 'ACTIVE' ? 'bg-white shadow' : 'text-gray-500'}`}>Active</button>
              <button onClick={() => setFilter('CLOSED')} className={`px-3 py-1 rounded ${filter === 'CLOSED' ? 'bg-white shadow' : 'text-gray-500'}`}>Closed</button>
          </div>
      </div>

      <div className="space-y-4">
         {filteredApps.length === 0 ? (
             <div className="text-center py-12 border-2 border-dashed rounded-xl">
                 <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                 <h3 className="text-lg font-medium text-gray-900">No applications found</h3>
                 <p className="text-gray-500 mb-6">Complete your profile to get matched with top roles.</p>
                 <Button onClick={() => navigate('/candidate')}>Go to Dashboard</Button>
             </div>
         ) : (
             filteredApps.map(app => (
                 <Card key={app.id}>
                     <CardContent className="p-6">
                         <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                             <div>
                                 <h3 className="text-lg font-bold text-gray-900">{app.program.title}</h3>
                                 <p className="text-sm text-gray-500 mb-2">{app.program.location} • {app.program.type.replace('_', ' ')}</p>
                                 <div className="flex items-center gap-3 text-xs text-gray-500">
                                     <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                                     {app.matchScore > 0 && (
                                         <span className={`px-2 py-0.5 rounded font-medium ${app.matchScore > 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                             {app.matchScore}% Match
                                         </span>
                                     )}
                                 </div>
                             </div>
                             <div className="flex flex-col items-end gap-2">
                                 {getStatusBadge(app.status)}
                                 <Button variant="outline" size="sm" className="w-full md:w-auto text-xs" disabled>
                                     View Role Details
                                 </Button>
                             </div>
                         </div>
                         {/* Show recruiter note if interview requested */}
                         {app.status === ApplicationStatus.INTERVIEW_REQUESTED && (
                             <div className="mt-4 bg-purple-50 p-3 rounded-md border border-purple-100 text-sm text-purple-900 flex items-start gap-2">
                                 <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                                 <div>
                                     <p className="font-bold">Next Step: Interview</p>
                                     <p>The company has requested a follow-up interview. Check your email for scheduling instructions.</p>
                                 </div>
                             </div>
                         )}
                     </CardContent>
                 </Card>
             ))
         )}
      </div>
    </div>
  );
}
