
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../db';
import { Program, Application, Candidate, ApplicationStatus } from '../../types';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '../../ui';
import { ArrowLeft, Users, CheckCircle } from 'lucide-react';

export default function AdminRoleDetail() {
  const { roleId } = useParams<{ roleId: string }>();
  const navigate = useNavigate();
  const [role, setRole] = useState<Program | null>(null);
  const [apps, setApps] = useState<(Application & { candidate: Candidate })[]>([]);

  useEffect(() => {
    const load = async () => {
       const data = await db.getAdminFullData();
       const r = data.programs.find(p => p.id === roleId);
       if (r) {
           setRole(r);
           const roleApps = data.applications
               .filter(a => a.programId === r.id)
               .map(a => ({
                   ...a,
                   candidate: data.candidates.find(c => c.id === a.candidateId)!
               }))
               .filter(a => a.candidate);
           setApps(roleApps);
       }
    };
    load();
  }, [roleId]);

  if (!role) return <div>Loading...</div>;

  const hires = apps.filter(a => a.status === ApplicationStatus.ACCEPTED).length;
  const progress = Math.min(100, Math.round((hires / role.headcountNeeded) * 100));

  return (
    <div className="space-y-6">
       <Button variant="ghost" onClick={() => navigate('/admin')} className="pl-0">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Overview
       </Button>

       <div className="bg-white p-6 rounded-xl border shadow-sm">
           <div className="flex justify-between items-start mb-6">
               <div>
                   <h1 className="text-2xl font-bold text-gray-900">{role.title}</h1>
                   <p className="text-gray-500">{role.location} • {role.type}</p>
               </div>
               <Badge variant={role.status === 'LIVE' ? 'success' : 'default'}>{role.status}</Badge>
           </div>

           <div className="flex items-center gap-4 mb-2">
               <span className="text-sm font-medium text-gray-700">Fulfillment Progress</span>
               <span className="text-sm text-gray-500">{hires} / {role.headcountNeeded} Hired</span>
           </div>
           <div className="w-full bg-gray-100 rounded-full h-3 mb-6">
               <div className="bg-emerald-500 h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
           </div>

           <div className="grid grid-cols-4 gap-4 text-center">
               <div className="p-3 bg-gray-50 rounded-lg">
                   <p className="text-xs text-gray-500 uppercase font-bold">Pipeline</p>
                   <p className="text-xl font-bold text-indigo-600">{apps.length}</p>
               </div>
               <div className="p-3 bg-gray-50 rounded-lg">
                   <p className="text-xs text-gray-500 uppercase font-bold">Shortlisted</p>
                   <p className="text-xl font-bold text-purple-600">{apps.filter(a => a.status === ApplicationStatus.SHORTLISTED).length}</p>
               </div>
               <div className="p-3 bg-gray-50 rounded-lg">
                   <p className="text-xs text-gray-500 uppercase font-bold">Interview Req</p>
                   <p className="text-xl font-bold text-orange-600">{apps.filter(a => a.status === ApplicationStatus.INTERVIEW_REQUESTED).length}</p>
               </div>
               <div className="p-3 bg-gray-50 rounded-lg">
                   <p className="text-xs text-gray-500 uppercase font-bold">Rejected</p>
                   <p className="text-xl font-bold text-red-600">{apps.filter(a => a.status === ApplicationStatus.REJECTED).length}</p>
               </div>
           </div>
       </div>

       <Card>
           <CardHeader><CardTitle>Candidate Pipeline</CardTitle></CardHeader>
           <CardContent>
               <table className="w-full text-sm text-left">
                   <thead className="bg-gray-50 text-gray-600">
                       <tr>
                           <th className="p-3">Candidate</th>
                           <th className="p-3">Applied</th>
                           <th className="p-3">Match Score</th>
                           <th className="p-3">Status</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y">
                       {apps.map(app => (
                           <tr key={app.id}>
                               <td className="p-3 font-medium">{app.candidate.fullName}</td>
                               <td className="p-3 text-gray-500">{new Date(app.createdAt).toLocaleDateString()}</td>
                               <td className="p-3">
                                   <span className={`px-2 py-1 rounded text-xs font-bold ${app.matchScore > 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                       {app.matchScore}%
                                   </span>
                               </td>
                               <td className="p-3">{app.status}</td>
                           </tr>
                       ))}
                   </tbody>
               </table>
           </CardContent>
       </Card>
    </div>
  );
}
