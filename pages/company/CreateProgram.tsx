
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../authContext';
import { db } from '../../db';
import { ProgramStatus, ProgramType } from '../../types';
import { PROGRAM_DEFINITIONS } from '../../constants';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '../../ui';
import { ArrowLeft, Info } from 'lucide-react';
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

export default function CreateProgram() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedType, setSelectedType] = useState<ProgramType>(ProgramType.INBOUND_SUPPORT);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      location: formData.get('location') as string,
      type: selectedType,
      headcountNeeded: formData.get('headcountNeeded'),
      mustHaveSkills: formData.get('mustHaveSkills'),
      niceToHaveSkills: formData.get('niceToHaveSkills'),
      dealBreakers: formData.get('dealBreakers'),
    };

    const result = programSchema.safeParse(data);

    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        formattedErrors[issue.path[0]] = issue.message;
      });
      setErrors(formattedErrors);
      setIsSubmitting(false);
      return;
    }

    // Get company ID (Mock: assume user is linked to first company)
    const companies = JSON.parse(localStorage.getItem('serenity_companies') || '[]');
    const companyId = companies[0]?.id;

    if (!companyId) {
      alert("No company found for user");
      setIsSubmitting(false);
      return;
    }

    await db.createProgram({
      id: `p_${Date.now()}`,
      companyId,
      title: data.title,
      description: data.description,
      location: data.location,
      type: data.type,
      headcountNeeded: Number(data.headcountNeeded),
      mustHaveSkills: (data.mustHaveSkills as string).split(',').map(s => s.trim()),
      niceToHaveSkills: (data.niceToHaveSkills as string ? (data.niceToHaveSkills as string).split(',').map(s => s.trim()) : []),
      dealBreakers: (data.dealBreakers as string ? (data.dealBreakers as string).split(',').map(s => s.trim()) : []),
      status: ProgramStatus.LIVE,
      createdAt: new Date().toISOString()
    });

    navigate('/company');
  };

  const selectedDef = PROGRAM_DEFINITIONS[selectedType];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate('/company')} className="pl-0">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create New Program</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Program Type Selection with Rich Details */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Program Category</label>
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
              
              {/* Dynamic Helper Info */}
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
                    <div>
                       <span className="text-xs font-bold uppercase text-indigo-400">Typical Personality</span>
                       <p className="text-xs text-indigo-700 mt-1">{selectedDef.idealProfile.personality}</p>
                    </div>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-medium text-gray-700">Program Title</label>
                  <Input name="title" placeholder="e.g. Senior Customer Support Specialist" />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <Input name="location" placeholder="e.g. Remote, Manila, etc." />
                  {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea 
                name="description" 
                rows={4}
                className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm"
                placeholder="Describe the role and responsibilities..."
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700">Headcount Needed</label>
               <Input name="headcountNeeded" type="number" placeholder="10" className="max-w-xs" />
               {errors.headcountNeeded && <p className="text-red-500 text-xs mt-1">{errors.headcountNeeded}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-medium text-gray-700">Must Have Skills (Comma separated)</label>
                  <Input name="mustHaveSkills" placeholder="English C1, Zendesk, Sales..." />
                  {errors.mustHaveSkills && <p className="text-red-500 text-xs mt-1">{errors.mustHaveSkills}</p>}
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700">Nice to Have Skills (Optional)</label>
                  <Input name="niceToHaveSkills" placeholder="Team Management, IT Degree..." />
               </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700">Deal Breakers / Critical Criteria (Comma separated)</label>
               <Input name="dealBreakers" placeholder="No Tech Background, Job Hopping Risk, etc." />
               <p className="text-xs text-gray-500 mt-1">Candidates with these risks will be heavily penalized in matching.</p>
            </div>

            <div className="pt-4 border-t">
               <Button type="submit" className="w-full" disabled={isSubmitting}>
                 {isSubmitting ? 'Creating...' : 'Launch Program'}
               </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
