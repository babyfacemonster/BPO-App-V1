
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../authContext';
import { db } from '../../db';
import { Program, ProgramStatus } from '../../types';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '../../ui';
import { Plus, Edit2, Trash2, ArrowLeft, Filter } from 'lucide-react';

export default function ManageRoles() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Program[]>([]);
  const [statusFilter, setStatusFilter] = useState<'LIVE' | 'CLOSED'>('LIVE');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const companies = JSON.parse(localStorage.getItem('serenity_companies') || '[]');
      if (companies.length > 0) {
        const p = await db.getCompanyPrograms(companies[0].id);
        setRoles(p);
      }
    };
    load();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this role? This cannot be undone.")) {
      await db.deleteProgram(id);
      setRoles(roles.filter(r => r.id !== id));
    }
  };

  const filteredRoles = roles.filter(r => 
    statusFilter === 'LIVE' ? r.status !== ProgramStatus.CLOSED : r.status === ProgramStatus.CLOSED
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <Button variant="ghost" onClick={() => navigate('/company')} className="pl-0 mb-2">
             <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
           </Button>
           <h1 className="text-2xl font-bold text-gray-900">Manage Roles</h1>
        </div>
        <Link to="/company/roles/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Create New Role
          </Button>
        </Link>
      </div>

      <div className="bg-white p-2 rounded-lg border shadow-sm inline-flex mb-4">
         <button 
           className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${statusFilter === 'LIVE' ? 'bg-indigo-100 text-indigo-800' : 'text-gray-500 hover:text-gray-900'}`}
           onClick={() => setStatusFilter('LIVE')}
         >
           Active Roles
         </button>
         <button 
           className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${statusFilter === 'CLOSED' ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:text-gray-900'}`}
           onClick={() => setStatusFilter('CLOSED')}
         >
           Closed Roles
         </button>
      </div>

      <div className="grid gap-4">
        {filteredRoles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed">
            <p className="text-gray-500">No {statusFilter.toLowerCase()} roles found.</p>
          </div>
        ) : (
          filteredRoles.map(role => (
            <Card key={role.id}>
              <CardContent className="p-6 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900">{role.title}</h3>
                    <Badge variant={role.status === ProgramStatus.LIVE ? 'success' : 'default'}>{role.status}</Badge>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{role.type.replace('_', ' ')}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{role.location} • {role.headcountNeeded} Headcount Needed</p>
                  <p className="text-sm text-gray-600 mt-2 max-w-2xl truncate">{role.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/company/roles/${role.id}/edit`)}>
                    <Edit2 className="h-4 w-4 mr-2" /> Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(role.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
