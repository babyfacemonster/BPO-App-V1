import React, { useEffect, useState } from 'react';
import { db } from '../../db';
import { aiService } from '../../services/ai';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '../../ui';
import { BarChart, AlertTriangle, FileEdit, Settings, Check, ThumbsDown, MessageSquare } from 'lucide-react';
import { FeedbackAnalysis, FeedbackSummary } from '../../types';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ candidates: 0, interviews: 0, programs: 0, applications: 0 });
  const [feedbackSummary, setFeedbackSummary] = useState<FeedbackSummary | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<FeedbackAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  useEffect(() => {
    const load = async () => {
      const s = await db.getAllStats();
      setStats(s);
      
      const summary = await db.getFeedbackSummary();
      setFeedbackSummary(summary);
    };
    load();
  }, []);

  const runAnalysis = async () => {
    if (!feedbackSummary) return;
    setLoadingAnalysis(true);
    const result = await aiService.analyzeFeedback(feedbackSummary);
    setAiAnalysis(result);
    setLoadingAnalysis(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Serenity Admin Control</h1>
      
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Candidates" value={stats.candidates} />
        <StatCard title="Interviews Conducted" value={stats.interviews} />
        <StatCard title="Active Programs" value={stats.programs} />
        <StatCard title="Matches Generated" value={stats.applications} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
         
         {/* System Health */}
         <Card>
            <CardHeader><CardTitle>System Health</CardTitle></CardHeader>
            <CardContent>
               <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                     <span className="text-sm text-gray-600">AI Service</span>
                     <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Operational</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                     <span className="text-sm text-gray-600">Video Storage</span>
                     <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">85% Capacity</span>
                  </div>
               </div>
            </CardContent>
         </Card>

         {/* Candidate Feedback Summary */}
         <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-indigo-600" /> Candidate Feedback
                    </CardTitle>
                    {feedbackSummary && (
                        <span className="text-xs text-gray-400">{feedbackSummary.total_responses} responses</span>
                    )}
                </div>
            </CardHeader>
            <CardContent>
               {!feedbackSummary || feedbackSummary.total_responses === 0 ? (
                   <p className="text-sm text-gray-400">No feedback data collected yet.</p>
               ) : (
                   <div className="space-y-4">
                       <div className="grid grid-cols-3 gap-2 text-center">
                           <div className="bg-gray-50 p-2 rounded">
                               <p className="text-xs text-gray-500">Clarity</p>
                               <p className={`font-bold ${feedbackSummary.avg_clarity < 3.5 ? 'text-red-600' : 'text-green-600'}`}>{feedbackSummary.avg_clarity.toFixed(1)}</p>
                           </div>
                           <div className="bg-gray-50 p-2 rounded">
                               <p className="text-xs text-gray-500">Relevance</p>
                               <p className="font-bold text-gray-800">{feedbackSummary.avg_relevance.toFixed(1)}</p>
                           </div>
                           <div className="bg-gray-50 p-2 rounded">
                               <p className="text-xs text-gray-500">Fairness</p>
                               <p className="font-bold text-gray-800">{feedbackSummary.avg_fairness.toFixed(1)}</p>
                           </div>
                       </div>
                       <div>
                           <p className="text-xs font-semibold mb-2 text-gray-700">Top Tags</p>
                           <div className="flex flex-wrap gap-2">
                               {Object.entries(feedbackSummary.tags).map(([tag, count]) => (
                                   <Badge key={tag} variant={tag.includes('confus') ? 'error' : 'default'}>
                                       {tag.replace('_', ' ')} ({count})
                                   </Badge>
                               ))}
                           </div>
                       </div>
                       <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full mt-2"
                        onClick={runAnalysis}
                        disabled={loadingAnalysis}
                       >
                           {loadingAnalysis ? "Analyzing..." : "Run AI Improvement Analysis"}
                       </Button>
                   </div>
               )}
            </CardContent>
         </Card>
      </div>

      {/* AI Analysis Results */}
      {aiAnalysis && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <BarChart className="h-5 w-5" /> Recommended Improvements
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Issues */}
                <Card className="border-l-4 border-l-red-500">
                    <CardHeader><CardTitle className="text-red-700">Top Quality Issues</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {aiAnalysis.top_issues.map((issue, idx) => (
                            <div key={idx} className="bg-red-50 p-3 rounded-md">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-red-900 text-sm">{issue.issue}</h4>
                                    <Badge variant="error">{issue.impact.toUpperCase()}</Badge>
                                </div>
                                <p className="text-xs text-red-800 mt-1">Fix: {issue.recommended_fix}</p>
                                <div className="mt-2 text-xs italic text-gray-500 bg-white/50 p-2 rounded">
                                    "{issue.evidence.example_comments[0]}"
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Script Changes */}
                <Card className="border-l-4 border-l-indigo-500">
                    <CardHeader><CardTitle className="text-indigo-700">Proposed Script Changes</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {aiAnalysis.script_change_proposals.map((proposal, idx) => (
                            <div key={idx} className="border p-3 rounded-md bg-white">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileEdit className="h-4 w-4 text-indigo-500" />
                                    <span className="font-mono text-xs uppercase bg-gray-100 px-2 rounded">{proposal.change_type}</span>
                                </div>
                                <div className="grid grid-cols-1 gap-2 text-sm">
                                    <div className="bg-red-50 p-2 rounded text-red-800 line-through decoration-red-500/50 opacity-70">
                                        {proposal.current_text}
                                    </div>
                                    <div className="bg-green-50 p-2 rounded text-green-800 font-medium">
                                        {proposal.proposed_text}
                                    </div>
                                </div>
                                <div className="mt-2 flex justify-end">
                                    <Button size="sm">Apply Change</Button>
                                </div>
                            </div>
                        ))}
                        {aiAnalysis.scoring_rubric_adjustments.map((adj, idx) => (
                             <div key={idx} className="border p-3 rounded-md bg-white flex items-start gap-3">
                                <Settings className="h-4 w-4 text-gray-500 mt-1" />
                                <div>
                                    <p className="text-sm font-bold text-gray-800">{adj.dimension}</p>
                                    <p className="text-xs text-gray-600">{adj.suggested_change}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">{adj.rationale}</p>
                                </div>
                             </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
      )}
    </div>
  );
}

const StatCard = ({ title, value }: { title: string, value: number }) => (
  <Card>
    <CardContent className="p-6">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </CardContent>
  </Card>
);