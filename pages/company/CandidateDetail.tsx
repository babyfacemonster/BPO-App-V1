
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../db';
import { Application, InterviewRecommendation, ApplicationStatus } from '../../types';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '../../ui';
import { ArrowLeft, CheckCircle, XCircle, Clock, PlayCircle, AlertTriangle, MessageSquare, ShieldCheck, ChevronDown, Check, Target } from 'lucide-react';

export default function CompanyCandidateDetail() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<(Application & { candidate: any, interview: any, program: any }) | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<'SHORTLIST' | 'PASS' | 'FOLLOWUP' | null>(null);
  const [reason, setReason] = useState('');
  
  // Mock Video State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!appId) return;
    const load = async () => {
      // Mock fetching specific application logic (reusing getCompanyApplications for MVP simplicity or direct find)
      const apps = await db.getCompanyApplications('c1'); // Mock company ID
      const found = apps.find(a => a.id === appId);
      if (found) setApp(found);
    };
    load();
  }, [appId]);

  const handleDecision = async (status: ApplicationStatus, notePrefix: string) => {
    if (!app) return;
    await db.updateApplicationStatus(app.id, status, reason, `${notePrefix}`);
    // Reload local state
    setApp({ ...app, status, recruiterReason: reason });
    setActionMenuOpen(null);
    setReason('');
  };

  if (!app) return <div className="p-8">Loading candidate details...</div>;

  const { candidate, interview, program } = app;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* Top Navigation */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/company')} className="pl-0 hover:bg-transparent hover:text-indigo-600">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Button>
        <span>/</span>
        <span>{program.title}</span>
        <span>/</span>
        <span className="font-semibold text-gray-900">{candidate.fullName}</span>
      </div>

      {/* Hero / Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold text-gray-500">
                  {candidate.fullName.charAt(0)}
              </div>
              <div>
                  <h1 className="text-3xl font-bold text-gray-900">{candidate.fullName}</h1>
                  <p className="text-gray-500">{candidate.location} • Applied {new Date(app.createdAt).toLocaleDateString()}</p>
              </div>
          </div>
          
          <div className="flex gap-2">
               {/* Action Buttons */}
               <div className="relative">
                   <Button 
                    variant="outline" 
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => setActionMenuOpen(actionMenuOpen === 'PASS' ? null : 'PASS')}
                   >
                       <XCircle className="h-4 w-4 mr-2" /> Pass
                   </Button>
                   {actionMenuOpen === 'PASS' && (
                       <ActionPopover 
                         title="Pass on Candidate"
                         reasons={["Skill Mismatch", "Cultural Fit", "Experience Level", "Other"]}
                         onConfirm={(r) => { setReason(r); handleDecision(ApplicationStatus.REJECTED, "Passed"); }}
                         onCancel={() => setActionMenuOpen(null)}
                       />
                   )}
               </div>

               <div className="relative">
                   <Button 
                    variant="outline" 
                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    onClick={() => setActionMenuOpen(actionMenuOpen === 'FOLLOWUP' ? null : 'FOLLOWUP')}
                   >
                       <MessageSquare className="h-4 w-4 mr-2" /> Request Interview
                   </Button>
                   {actionMenuOpen === 'FOLLOWUP' && (
                       <ActionPopover 
                         title="Request Follow-up"
                         reasons={["Clarify Experience", "Manager Screen", "Technical Test"]}
                         onConfirm={(r) => { setReason(r); handleDecision(ApplicationStatus.INTERVIEW_REQUESTED, "Interview Requested"); }}
                         onCancel={() => setActionMenuOpen(null)}
                       />
                   )}
               </div>

               <div className="relative">
                   <Button 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => setActionMenuOpen(actionMenuOpen === 'SHORTLIST' ? null : 'SHORTLIST')}
                   >
                       <CheckCircle className="h-4 w-4 mr-2" /> Shortlist
                   </Button>
                   {actionMenuOpen === 'SHORTLIST' && (
                       <ActionPopover 
                         title="Shortlist Candidate"
                         reasons={["Strong Match", "Great Communication", "Relevant Experience"]}
                         onConfirm={(r) => { setReason(r); handleDecision(ApplicationStatus.SHORTLISTED, "Shortlisted"); }}
                         onCancel={() => setActionMenuOpen(null)}
                       />
                   )}
               </div>
          </div>
      </div>

      {/* Decision Banner (if decision made) */}
      {app.status !== ApplicationStatus.SUGGESTED && app.status !== ApplicationStatus.APPLIED && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
              app.status === ApplicationStatus.SHORTLISTED ? 'bg-indigo-50 text-indigo-900 border border-indigo-200' :
              app.status === ApplicationStatus.REJECTED ? 'bg-gray-100 text-gray-700 border border-gray-200' :
              'bg-purple-50 text-purple-900 border border-purple-200'
          }`}>
              <Check className="h-5 w-5" />
              <span className="font-semibold">Current Status: {app.status.replace('_', ' ')}</span>
              {app.recruiterReason && <span className="text-sm opacity-80">— {app.recruiterReason}</span>}
          </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COL: Recommendation & Scores */}
          <div className="space-y-6 lg:col-span-1">
              
              {/* Program Match Analysis (Specific to Job) */}
              <Card className="border-l-4 border-l-indigo-600">
                 <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-indigo-900">
                       <Target className="h-4 w-4" /> Job Fit Analysis
                    </CardTitle>
                 </CardHeader>
                 <CardContent>
                    <div className="mb-4">
                       <div className="flex justify-between items-end mb-1">
                          <span className="text-sm font-medium text-gray-600">Match Score</span>
                          <span className="text-2xl font-bold text-gray-900">{app.matchScore}%</span>
                       </div>
                       <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${app.matchScore > 80 ? 'bg-indigo-600' : app.matchScore > 60 ? 'bg-yellow-500' : 'bg-gray-400'}`} style={{ width: `${app.matchScore}%` }} />
                       </div>
                    </div>

                    {app.matchBreakdown && (
                        <div className="space-y-3">
                           <div>
                              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Why this match?</p>
                              <ul className="text-sm space-y-1">
                                 {app.matchBreakdown.why_this_match.map((reason, i) => (
                                    <li key={i} className="flex items-start gap-2 text-gray-700">
                                       <CheckCircle className="h-3 w-3 text-emerald-500 mt-1 shrink-0" />
                                       <span className="text-xs">{reason}</span>
                                    </li>
                                 ))}
                              </ul>
                           </div>

                           {app.matchBreakdown.risks_for_this_program.length > 0 && (
                              <div className="bg-red-50 p-3 rounded border border-red-100">
                                 <p className="text-xs font-bold text-red-700 uppercase mb-1">Specific Risks</p>
                                 <ul className="text-sm space-y-1">
                                    {app.matchBreakdown.risks_for_this_program.map((risk, i) => (
                                       <li key={i} className="flex items-start gap-2 text-red-800">
                                          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                                          <span className="text-xs">{risk}</span>
                                       </li>
                                    ))}
                                 </ul>
                              </div>
                           )}
                        </div>
                    )}
                 </CardContent>
              </Card>

              {/* General Recommendation Card (BPO Readiness) */}
              <Card>
                  <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2 text-gray-700">
                          BPO Readiness
                          {interview.recommendation === InterviewRecommendation.HIRE_READY ? <Badge variant="success">Ready</Badge> :
                           interview.recommendation === InterviewRecommendation.INTERVIEW_RECOMMENDED ? <Badge variant="warning">Rec</Badge> :
                           <Badge variant="default">Not Ready</Badge>}
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-xs text-gray-500 mb-3">
                         {interview.summaryForCompany?.short_overview || "Candidate shows potential."}
                      </p>
                      
                      {/* Competency Scorecard */}
                      <div className="space-y-3 pt-2 border-t">
                        <ScoreBar label="Communication" score={interview.scores.communication} />
                        <ScoreBar label="Empathy & EQ" score={interview.scores.empathy} />
                        <ScoreBar label="Process Adherence" score={interview.scores.process} />
                        <ScoreBar label="Reliability" score={interview.scores.reliability} />
                      </div>
                  </CardContent>
              </Card>

              {/* Risks */}
              <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2 text-orange-700"><AlertTriangle className="h-4 w-4" /> Potential Risks</CardTitle></CardHeader>
                  <CardContent>
                      {interview.riskFlags && interview.riskFlags.length > 0 ? (
                          <ul className="space-y-2">
                              {interview.riskFlags.map((risk, i) => (
                                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2 bg-orange-50 p-2 rounded">
                                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" />
                                      {risk}
                                  </li>
                              ))}
                          </ul>
                      ) : (
                          <p className="text-sm text-gray-500 italic">No significant risks flagged by AI.</p>
                      )}
                  </CardContent>
              </Card>
          </div>

          {/* RIGHT COL: Video & Evidence */}
          <div className="space-y-6 lg:col-span-2">
              
              {/* Video Player (Mock) */}
              <Card className="overflow-hidden">
                  <div className="aspect-video bg-gray-900 relative flex items-center justify-center group cursor-pointer" onClick={() => setIsPlaying(!isPlaying)}>
                      {!isPlaying && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <PlayCircle className="h-16 w-16 text-white opacity-90 group-hover:scale-110 transition-transform" />
                          </div>
                      )}
                      {isPlaying && (
                          <div className="absolute inset-0 flex items-center justify-center">
                             <span className="text-white/50 text-sm animate-pulse">Mock Video Playing...</span>
                          </div>
                      )}
                      <div className="absolute bottom-4 left-4 right-4 h-1 bg-white/30 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 w-1/3"></div>
                      </div>
                  </div>
                  <CardContent className="py-4 bg-gray-50 border-t">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">Jump to Question:</p>
                      <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" className="text-xs bg-white h-7">Intro</Button>
                          <Button size="sm" variant="outline" className="text-xs bg-white h-7">Customer Scenario</Button>
                          <Button size="sm" variant="outline" className="text-xs bg-white h-7">Billing Issue</Button>
                          <Button size="sm" variant="outline" className="text-xs bg-white h-7">Closing</Button>
                      </div>
                  </CardContent>
              </Card>

              {/* Evidence Quotes */}
              <Card>
                  <CardHeader><CardTitle>Key Evidence</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                      <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Demonstrated Empathy</h4>
                          <blockquote className="border-l-4 border-indigo-200 pl-4 italic text-gray-600 text-sm">
                              "I would start by apologizing sincerely for the frustration. I know how annoying it is when internet goes down, so I'd reassure them I'm here to fix it."
                          </blockquote>
                      </div>
                      <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Process Compliance</h4>
                          <blockquote className="border-l-4 border-indigo-200 pl-4 italic text-gray-600 text-sm">
                              "Even if the customer claimed someone else did it, I would explain that for their security, I have to follow the verified protocol."
                          </blockquote>
                      </div>
                  </CardContent>
              </Card>

               {/* Transcript Snippet */}
               <Card>
                  <CardHeader><CardTitle>Transcript Snippet</CardTitle></CardHeader>
                  <CardContent>
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                          {interview.transcript.slice(0, 4).map((t, i) => (
                              <div key={i} className={`flex gap-3 text-sm ${t.role === 'system' ? 'justify-end' : ''}`}>
                                  {t.role === 'user' && (
                                      <div className="h-8 w-8 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-xs font-bold text-gray-600">
                                          {candidate.fullName.charAt(0)}
                                      </div>
                                  )}
                                  <div className={`p-3 rounded-lg max-w-[80%] ${t.role === 'system' ? 'bg-indigo-50 text-indigo-900' : 'bg-white border text-gray-700'}`}>
                                      {t.content}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </CardContent>
              </Card>

          </div>
      </div>

      {/* Compliance Footer */}
      <div className="mt-8 pt-6 border-t flex flex-col items-center text-center text-gray-400 text-xs">
          <ShieldCheck className="h-5 w-5 mb-2 text-emerald-600 opacity-50" />
          <p className="max-w-2xl">
              <strong>Compliance Notice:</strong> This assessment was generated by Serenity AI to assist in the hiring process. 
              It evaluates communication and soft skills relevant to the role. It does not assess protected characteristics. 
              Final hiring decisions should be made by human recruiters in accordance with local labor laws.
          </p>
      </div>

    </div>
  );
}

// Helpers
const ScoreBar = ({ label, score }: { label: string, score: number }) => (
    <div>
        <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-700">{label}</span>
            <span className="text-gray-500">{(score * 10).toFixed(1)}/10</span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
                className={`h-full rounded-full ${
                    score > 0.75 ? 'bg-emerald-500' : 
                    score > 0.5 ? 'bg-yellow-500' : 'bg-red-400'
                }`} 
                style={{ width: `${score * 100}%` }}
            ></div>
        </div>
    </div>
);

const ActionPopover = ({ title, reasons, onConfirm, onCancel }: { title: string, reasons: string[], onConfirm: (r: string) => void, onCancel: () => void }) => {
    const [selected, setSelected] = useState(reasons[0]);
    
    return (
        <div className="absolute top-12 right-0 z-10 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4 animate-in fade-in zoom-in-95 duration-200">
            <h4 className="font-bold text-sm mb-3 text-gray-900">{title}</h4>
            <label className="block text-xs font-medium text-gray-500 mb-1">Reason (Optional)</label>
            <select 
                className="w-full text-sm border-gray-300 rounded mb-3"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
            >
                {reasons.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <div className="flex gap-2">
                <Button size="sm" className="w-full" onClick={() => onConfirm(selected)}>Confirm</Button>
                <Button size="sm" variant="ghost" className="w-full" onClick={onCancel}>Cancel</Button>
            </div>
        </div>
    );
};
