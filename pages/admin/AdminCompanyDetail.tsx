
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../db';
import { Company, Program, Application, ApplicationStatus } from '../../types';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '../../ui';
import { ArrowLeft, Briefcase, Users } from 'lucide-react';

export default function AdminCompanyDetail() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    const load = async () => {
       const data = await db.getAdminFullData();
       const c = data.companies.find(c => c.id === companyId);
       if (c) {
           setCompany(c);
           setPrograms(data.programs.filter(p => p.companyId === c.id));
           const progIds = new Set(data.programs.filter(p => p.companyId === c.id).map(p => p.id));
           setApplications(data.applications.filter(a => progIds.has(a.programId)));
       }
    };
    load();
  }, [companyId]);

  if (!company) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
       <Button variant="ghost" onClick={() => navigate('/admin')} className="pl-0">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Overview
       </Button>

       <div className="flex justify-between items-center">
           <div>
               <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
               <p className="text-gray-500">{company.industry}</p>
           </div>
           <div className="text-right">
               <p className="text-sm text-gray-500">Client Since</p>
               <p className="font-medium">{new Date(company.createdAt || Date.now()).toLocaleDateString()}</p>
           </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card>
               <CardHeader><CardTitle>Role Performance</CardTitle></CardHeader>
               <CardContent>
                   <div className="space-y-4">
                       {programs.map(p => {
                           const apps = applications.filter(a => a.programId === p.id);
                           const hires = apps.filter(a => a.status === ApplicationStatus.ACCEPTED).length;
                           return (
                               <div key={p.id} className="border-b pb-4 last:border-0 last:pb-0">
                                   <div className="flex justify-between items-center mb-2">
                                       <h4 className="font-bold text-sm">{p.title}</h4>
                                       <Badge variant={p.status === 'LIVE' ? 'success' : 'default'}>{p.status}</Badge>
                                   </div>
                                   <div className="grid grid-cols-3 gap-4 text-center text-xs">
                                       <div className="bg-gray-50 p-2 rounded">
                                           <p className="text-gray-500">Needed</p>
                                           <p className="font-bold text-gray-900">{p.headcountNeeded}</p>
                                       </div>
                                       <div className="bg-gray-50 p-2 rounded">
                                           <p className="text-gray-500">Pipeline</p>
                                           <p className="font-bold text-indigo-600">{apps.length}</p>
                                       </div>
                                       <div className="bg-gray-50 p-2 rounded">
                                           <p className="text-gray-500">Hires</p>
                                           <p className="font-bold text-emerald-600">{hires}</p>
                                       </div>
                                   </div>
                               </div>
                           );
                       })}
                   </div>
               </CardContent>
           </Card>

           <Card>
               <CardHeader><CardTitle>Hiring Efficiency</CardTitle></CardHeader>
               <CardContent>
                   <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed text-gray-400 text-sm">
                       [Efficiency Charts Placeholder]
                   </div>
               </CardContent>
           </Card>
       </div>
    </div>
  );
}
