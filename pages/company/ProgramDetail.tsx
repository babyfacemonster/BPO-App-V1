
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../../db';
import { Program, Application } from '../../types';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Tooltip } from '../../ui';
import { ArrowLeft, Check, X, FileText, Download, AlertTriangle, ThumbsUp } from 'lucide-react';

export default function RoleDetail() {
  const { id } = useParams<{ id: string }>();
  const [program, setProgram] = useState<Program | null>(null);
  const [applications, setApplications] = useState<(Application & { candidate: any, interview: any })[]>([]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      // Mock loading program
      const allPrograms = JSON.parse(localStorage.getItem('serenity_programs') || '[]');
      const prog = allPrograms.find((p: Program) => p.id === id);
      setProgram(prog);

      if (prog) {
        // Trigger mock matching just in case
        const cands = JSON.parse(localStorage.getItem('serenity_candidates') || '[]');
        if (cands.length > 0) await db.runAutoMatch(cands[0].id);

        const apps = await db.getProgramApplications(prog.id);
        setApplications(apps);
      }
    };
    load();
  }, [id]);

  if (!program) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Link to="/company/roles" className="flex items-center text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Roles
      </Link>
      
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{program.title}</h1>
          <p className="text-gray-500 mt-1">Status: {program.status} • {program.location}</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" /> Export Shortlist
        </Button>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Matched Candidates ({applications.length})</h3>
        {applications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed">
            <p className="text-gray-500">No candidates matched yet. AI is processing new applicants.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => (
              <Card key={app.id}>
                <CardContent className="p-6 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-bold">{app.candidate.fullName}</h4>
                      <Tooltip content="Overall fit based on skills and interview performance.">
                        <Badge variant={app.matchScore > 80 ? 'success' : app.matchScore > 60 ? 'warning' : 'default'}>
                            {app.matchScore}% Match {app.matchTier && `(${app.matchTier})`}
                        </Badge>
                      </Tooltip>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {app.candidate.location} • {app.candidate.profile?.totals?.most_recent_role_title}
                    </div>
                    
                    <div className="mt-3 flex gap-2">
                       <span className="text-xs font-semibold px-2 py-1 bg-indigo-50 text-indigo-700 rounded">
                         Comm Score: {Math.round(app.interview.scores.communication * 100)}%
                       </span>
                       <span className="text-xs font-semibold px-2 py-1 bg-indigo-50 text-indigo-700 rounded">
                         Reliability: {Math.round(app.interview.scores.reliability * 100)}%
                       </span>
                    </div>

                    {/* Advanced Match Breakdown */}
                    {app.matchBreakdown && (
                        <div className="mt-4 grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded text-sm">
                             <div>
                                <h5 className="font-semibold text-gray-700 text-xs mb-1">Why this match?</h5>
                                <ul className="list-disc list-inside text-gray-600 text-xs">
                                    {app.matchBreakdown.why_this_match.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                             </div>
                             <div>
                                <h5 className="font-semibold text-gray-700 text-xs mb-1">Potential Risks</h5>
                                {app.matchBreakdown.risks_for_this_program.length > 0 ? (
                                    <ul className="list-disc list-inside text-gray-600 text-xs">
                                        {app.matchBreakdown.risks_for_this_program.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                ) : <span className="text-gray-400 text-xs">No specific program risks.</span>}
                             </div>
                        </div>
                    )}

                    {/* General AI Summary (Fallback if no breakdown or supplementary) */}
                    {!app.matchBreakdown && app.interview.summaryForCompany && (
                        <div className="mt-4 grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded text-sm">
                            <div>
                                <h5 className="font-semibold text-green-700 flex items-center gap-1 mb-1">
                                    <ThumbsUp className="h-3 w-3" /> Strengths
                                </h5>
                                <ul className="list-disc list-inside text-gray-600 text-xs">
                                    {app.interview.summaryForCompany.strengths.slice(0, 2).map((s: string, i: number) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h5 className="font-semibold text-orange-700 flex items-center gap-1 mb-1">
                                    <AlertTriangle className="h-3 w-3" /> General Risks
                                </h5>
                                {app.interview.summaryForCompany.risks.length > 0 ? (
                                    <ul className="list-disc list-inside text-gray-600 text-xs">
                                        {app.interview.summaryForCompany.risks.slice(0, 2).map((s: string, i: number) => <li key={i}>{s}</li>)}
                                    </ul>
                                ) : <span className="text-gray-400 text-xs">No major flags.</span>}
                            </div>
                        </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <Button variant="outline" size="sm" className="w-full">
                      <FileText className="h-4 w-4 mr-1" /> Full Profile
                    </Button>
                    <Button size="sm" className="w-full">
                      <Check className="h-4 w-4 mr-1" /> Shortlist
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
