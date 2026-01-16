
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../authContext';
import { db } from '../../db';
import { Program, ProgramStatus, ProgramType } from '../../types';
import { PROGRAM_DEFINITIONS } from '../../constants';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '../../ui';
import { ArrowLeft, Info, Save } from 'lucide-react';
import { z } from 'zod';

const programSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  location: z.string().min(2, "Location is required"),
  headcountNeeded: z.coerce.number().min(1, "Headcount must be at least 1"),
  mustHaveSkills: z.string().min(1, "Must have skills are required (comma separated)"),
  niceToHaveSkills: z.string().optional(),
  dealBreakers: z.string().optional(),
});

export default function RoleEditor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // If ID exists, we are editing
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedType, setSelectedType] = useState<ProgramType>(ProgramType.INBOUND_SUPPORT);
  const [status, setStatus] = useState<ProgramStatus>(ProgramStatus.LIVE);
  
  // Form State
  const [formDataState, setFormDataState] = useState({
     title: '',
     description: '',
     location: '',
     headcountNeeded: '10',
     mustHaveSkills: '',
     niceToHaveSkills: '',
     dealBreakers: ''
  });

  useEffect(() => {
    if (id) {
       // Load existing role
       const load = async () => {
           const companies = JSON.parse(localStorage.getItem('serenity_companies') || '[]');
           if (companies.length > 0) {
               const programs = await db.getCompanyPrograms(companies[0].id);
               const p = programs.find(p => p.id === id);
               if (p) {
                   setSelectedType(p.type);
                   setStatus(p.status);
                   setFormDataState({
                       title: p.title,
                       description: p.description,
                       location: p.location,
                       headcountNeeded: p.headcountNeeded.toString(),
                       mustHaveSkills: p.mustHaveSkills.join(', '),
                       niceToHaveSkills: p.niceToHaveSkills.join(', '),
                       dealBreakers: p.dealBreakers?.join(', ') || ''
                   });
               }
           }
       };
       load();
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormDataState({ ...formDataState, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const result = programSchema.safeParse(formDataState);

    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        formattedErrors[issue.path[0]] = issue.message;
      });
      setErrors(formattedErrors);
      setIsSubmitting(false);
      return;
    }

    // Get company ID
    const companies = JSON.parse(localStorage.getItem('serenity_companies') || '[]');
    const companyId = companies[0]?.id;

    if (!companyId) {
      alert("No company found for user");
      setIsSubmitting(false);
      return;
    }

    const payload: Program = {
      id: id || `p_${Date.now()}`,
      companyId,
      title: formDataState.title,
      description: formDataState.description,
      location: formDataState.location,
      type: selectedType,
      headcountNeeded: Number(formDataState.headcountNeeded),
      mustHaveSkills: formDataState.mustHaveSkills.split(',').map(s => s.trim()),
      niceToHaveSkills: (formDataState.niceToHaveSkills ? formDataState.niceToHaveSkills.split(',').map(s => s.trim()) : []),
      dealBreakers: (formDataState.dealBreakers ? formDataState.dealBreakers.split(',').map(s => s.trim()) : []),
      status: status,
      createdAt: id ? undefined : new Date().toISOString(), // Only set on create
    } as Program; // Type assertion since we might be updating

    if (id) {
        await db.updateProgram(payload);
    } else {
        await db.createProgram(payload);
    }

    navigate('/company/roles');
  };

  const selectedDef = PROGRAM_DEFINITIONS[selectedType];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate('/company/roles')} className="pl-0">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Roles
      </Button>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>{id ? 'Edit Role' : 'Create New Role'}</CardTitle>
          {id && (
             <select 
               className="text-sm border-gray-300 rounded-md"
               value={status}
               onChange={(e) => setStatus(e.target.value as ProgramStatus)}
             >
                 <option value={ProgramStatus.LIVE}>Live</option>
                 <option value={ProgramStatus.CLOSED}>Closed</option>
                 <option value={ProgramStatus.DRAFT}>Draft</option>
             </select>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Program Type Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Role Category</label>
              <select 
                name="type" 
                className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as ProgramType)}
              >
                {Object.values(ProgramType).map(t => (
                  <option key={t} value={t}>{PROGRAM_DEFINITIONS[t].label}</option>
                ))}
              </select>
              
              <div className="bg-indigo-50 border border-indigo-100 rounded-md p-4 text-sm mt-2">
                 <div className="flex gap-2 font-semibold text-indigo-900 mb-1">
                    <Info className="h-4 w-4 mt-0.5" />
                    {selectedDef.label}
                 </div>
                 <p className="text-indigo-800 mb-3">{selectedDef.description}</p>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <span className="text-xs font-bold uppercase text-indigo-400">Target Strengths</span>
                       <ul className="list-disc list-inside text-xs text-indigo-700 mt-1">
                          {selectedDef.idealProfile.strengths.slice(0, 3).map(s => <li key={s}>{s}</li>)}
                       </ul>
                    </div>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-medium text-gray-700">Role Title</label>
                  <Input name="title" value={formDataState.title} onChange={handleChange} placeholder="e.g. Senior Customer Support Specialist" />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <Input name="location" value={formDataState.location} onChange={handleChange} placeholder="e.g. Remote, Manila, etc." />
                  {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea 
                name="description" 
                rows={4}
                value={formDataState.description}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm"
                placeholder="Describe the role and responsibilities..."
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700">Headcount Needed</label>
               <Input name="headcountNeeded" type="number" value={formDataState.headcountNeeded} onChange={handleChange} placeholder="10" className="max-w-xs" />
               {errors.headcountNeeded && <p className="text-red-500 text-xs mt-1">{errors.headcountNeeded}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-medium text-gray-700">Must Have Skills (Comma separated)</label>
                  <Input name="mustHaveSkills" value={formDataState.mustHaveSkills} onChange={handleChange} placeholder="English C1, Zendesk, Sales..." />
                  {errors.mustHaveSkills && <p className="text-red-500 text-xs mt-1">{errors.mustHaveSkills}</p>}
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700">Nice to Have Skills (Optional)</label>
                  <Input name="niceToHaveSkills" value={formDataState.niceToHaveSkills} onChange={handleChange} placeholder="Team Management, IT Degree..." />
               </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700">Deal Breakers / Critical Criteria (Comma separated)</label>
               <Input name="dealBreakers" value={formDataState.dealBreakers} onChange={handleChange} placeholder="No Tech Background, Job Hopping Risk, etc." />
               <p className="text-xs text-gray-500 mt-1">Candidates with these risks will be heavily penalized in matching.</p>
            </div>

            <div className="pt-4 border-t">
               <Button type="submit" className="w-full" disabled={isSubmitting}>
                 <Save className="h-4 w-4 mr-2" />
                 {isSubmitting ? 'Saving...' : (id ? 'Update Role' : 'Create Role')}
               </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
