import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../authContext';
import { db } from '../../db';
import { Company, Program, ProgramStatus } from '../../types';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '../../ui';
import { Plus, Users, MapPin } from 'lucide-react';

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // For MVP, finding the first company (mock)
      // In real app, user would be linked to companyId in DB
      const companies = JSON.parse(localStorage.getItem('serenity_companies') || '[]');
      if (companies.length > 0) {
        setCompany(companies[0]);
        const progs = await db.getCompanyPrograms(companies[0].id);
        setPrograms(progs);
      }
    };
    load();
  }, [user]);

  if (!company) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{company.name} Dashboard</h1>
          <p className="text-gray-500">Manage your hiring programs and review candidates.</p>
        </div>
        <Link to="/company/create-program">
          <Button>
            <Plus className="h-4 w-4 mr-2" /> New Program
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {programs.map(prog => (
          <Link key={prog.id} to={`/company/programs/${prog.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant={prog.status === ProgramStatus.LIVE ? 'success' : 'default'}>
                    {prog.status}
                  </Badge>
                  <span className="text-xs text-gray-400">{new Date(prog.createdAt).toLocaleDateString()}</span>
                </div>
                <CardTitle className="text-lg mt-2">{prog.title}</CardTitle>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" /> {prog.location}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{prog.headcountNeeded} needed</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {prog.mustHaveSkills.slice(0, 3).map(skill => (
                    <span key={skill} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">{skill}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}