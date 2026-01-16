
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../authContext';
import { db } from '../../db';
import { Candidate, InterviewSession, InterviewStatus, Application, InterviewRecommendation, Program } from '../../types';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Tooltip } from '../../ui';
import { FileText, PlayCircle, Clock, CheckCircle, Upload, Award, Zap, TrendingUp, Briefcase, ChevronRight, Lightbulb, UserCheck, Star, Target, Info, List } from 'lucide-react';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [interview, setInterview] = useState<InterviewSession | null>(null);
  const [matches, setMatches] = useState<(Application & { program: Program })[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      const cand = await db.getCandidateByUserId(user.id);
      if (cand) {
        setCandidate(cand);
        const int = await db.getCandidateInterview(cand.id);
        setInterview(int);
        if (int && int.status === InterviewStatus.COMPLETE) {
            const myMatches = await db.getCandidateApplications(cand.id);
            setMatches(myMatches);
        }
      }
    };
    loadData();
  }, [user]);

  if (!candidate) return <div>Loading...</div>;

  const getRecBadge = (rec: InterviewRecommendation) => {
    switch (rec) {
      case InterviewRecommendation.HIRE_READY: return <Badge variant="success">Hire Ready</Badge>;
      case InterviewRecommendation.INTERVIEW_RECOMMENDED: return <Badge variant="warning">Recommended</Badge>;
      default: return <Badge variant="default">Pending</Badge>;
    }
  };

  const hasCV = !!candidate.cvId || !!candidate.cvUrl;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {candidate.fullName.split(' ')[0]}</h1>
        <Button variant="outline" onClick={() => navigate('/candidate/applications')}>
            <List className="h-4 w-4 mr-2" /> My Applications
        </Button>
      </div>

      {!hasCV && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-indigo-900">Complete your profile</h3>
            <p className="text-sm text-indigo-700">Upload your CV to get matched with programs.</p>
          </div>
          <Link to="/candidate/upload-cv">
            <Button variant="primary">
              <Upload className="h-4 w-4 mr-2" /> Upload CV
            </Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Interview Status Card */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivityIcon status={interview?.status} />
              AI Readiness Interview
              <Tooltip content="A 15-minute voice interview to assess your BPO skills.">
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!interview ? (
              <div className="space-y-4">
                <p className="text-gray-600">Complete your one-time interview to unlock job matches.</p>
                <Link to="/candidate/interview">
                  <Button className="w-full" disabled={!hasCV}>
                    {hasCV ? "Start Interview" : "Upload CV First"}
                  </Button>
                </Link>
              </div>
            ) : interview.status === InterviewStatus.COMPLETE ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-4">
                  <span className="text-gray-600">Status</span>
                  <Tooltip content="Your interview has been analyzed and scored by our AI.">
                    <Badge variant="success">Complete</Badge>
                  </Tooltip>
                </div>
                {/* Transparent feedback: Show Role Fit instead of raw score for friendliness */}
                {interview.feedbackForCandidate?.role_fit_analysis && (
                   <div className="bg-indigo-50 p-4 rounded-lg text-sm text-indigo-900 mb-2">
                      <div className="font-bold flex items-center gap-2 mb-2">
                         <Target className="h-4 w-4" /> Best Fit: {interview.feedbackForCandidate.role_fit_analysis.primary_fit}
                      </div>
                      <p>{interview.feedbackForCandidate.role_fit_analysis.strengths_summary}</p>
                   </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Overall Readiness</span>
                  <Tooltip content="This tier determines which companies can see your profile.">
                    <div>{getRecBadge(interview.recommendation)}</div>
                  </Tooltip>
                </div>
                {interview.recommendation !== InterviewRecommendation.NOT_RECOMMENDED_YET && (
                  <div className="mt-4 p-3 bg-green-50 text-green-800 text-sm rounded-md">
                    You are eligible for job matching!
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">Your interview is in progress.</p>
                <Link to="/candidate/interview">
                  <Button className="w-full">Resume Interview</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Feedback & Coaching */}
        {interview?.status === InterviewStatus.COMPLETE && interview.feedbackForCandidate && (
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" /> Career Insights
                  <Tooltip content="Personalized feedback generated from your interview performance.">
                     <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  </Tooltip>
               </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-6">
                  
                  {/* Role Fit Analysis Section */}
                  {interview.feedbackForCandidate.role_fit_analysis && (
                     <div className="border-b pb-4 mb-4">
                         <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                             <UserCheck className="h-4 w-4 text-indigo-600" /> What roles fit you best?
                         </h4>
                         <p className="text-sm text-gray-600 italic">"{interview.feedbackForCandidate.role_fit_analysis.primary_fit}"</p>
                         <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                            {interview.feedbackForCandidate.role_fit_analysis.growth_areas_summary}
                         </p>
                     </div>
                  )}

                  {/* Strengths */}
                  {interview.feedbackForCandidate.positive.length > 0 && (
                     <div>
                        <h4 className="text-sm font-semibold text-green-700 flex items-center gap-1 mb-2">
                           <CheckCircle className="h-4 w-4" /> Top Strengths
                        </h4>
                        <ul className="space-y-1">
                           {interview.feedbackForCandidate.positive.slice(0, 3).map((s, i) => (
                             <li key={i} className="text-sm text-gray-700 pl-2 border-l-2 border-green-200">{s}</li>
                           ))}
                        </ul>
                     </div>
                  )}

                  {/* Actionable Improvements */}
                  {interview.feedbackForCandidate.detailed_insights && interview.feedbackForCandidate.detailed_insights.length > 0 && (
                     <div>
                        <h4 className="text-sm font-semibold text-orange-700 flex items-center gap-1 mb-2">
                           <TrendingUp className="h-4 w-4" /> Growth Areas
                        </h4>
                        <div className="space-y-3">
                           {interview.feedbackForCandidate.detailed_insights.slice(0, 2).map((insight, i) => (
                             <div key={i} className="bg-orange-50 rounded-md p-3 text-sm">
                               <p className="font-semibold text-gray-800 mb-1">{insight.area}</p>
                               <div className="flex items-start gap-2 mt-2 text-gray-600">
                                  <Lightbulb className="h-4 w-4 text-orange-400 mt-0.5 shrink-0" />
                                  <p className="italic">"{insight.quick_practice_tip}"</p>
                               </div>
                             </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* Coaching Offers */}
                  {interview.feedbackForCandidate.coaching_offers && interview.feedbackForCandidate.coaching_offers.length > 0 && (
                     <div className="pt-2 border-t">
                        <h4 className="text-sm font-bold text-indigo-800 flex items-center gap-1 mb-3 mt-2">
                           <Award className="h-4 w-4" /> Recommended Coaching
                           <Tooltip content="Optional paid services to improve your profile score.">
                              <Info className="h-3 w-3 ml-2 text-indigo-400 cursor-help" />
                           </Tooltip>
                        </h4>
                        <div className="space-y-3">
                           {interview.feedbackForCandidate.coaching_offers.map((offer, i) => (
                              <div key={i} className="group relative bg-white rounded-lg border border-indigo-100 shadow-sm p-3 hover:shadow-md transition-shadow">
                                 <div className="flex justify-between items-start mb-1">
                                    <span className="font-semibold text-indigo-900 text-sm">{offer.type.replace('_', ' ')}</span>
                                    {offer.priority === 'high' && <Badge variant="warning">High Impact</Badge>}
                                 </div>
                                 <p className="text-xs text-gray-600 mb-2">{offer.reason}</p>
                                 <div className="flex items-center text-xs text-indigo-600 font-medium">
                                    View Details <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            </CardContent>
          </Card>
        )}

        {/* Matched Programs */}
        {matches.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Briefcase className="h-5 w-5 text-emerald-600" /> Matched Roles ({matches.length})
                 <Tooltip content="Jobs where your skills and interview score are a strong fit.">
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                 </Tooltip>
               </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {matches.map(match => (
                    <div key={match.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow relative overflow-hidden bg-white">
                       <Tooltip content={`Match Score: ${match.matchScore}/100 based on Skills + Interview.`} side="left">
                         <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white rounded-bl-lg cursor-help ${match.matchTier === 'strong' ? 'bg-emerald-500' : match.matchTier === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'}`}>
                           {match.matchScore}% Match
                         </div>
                       </Tooltip>
                       <h4 className="font-bold text-lg mt-2 pr-12">{match.program.title}</h4>
                       <p className="text-sm text-gray-500 mb-2">{match.program.location} • {match.program.type.replace('_', ' ')}</p>
                       
                       {match.matchBreakdown && (
                         <div className="mt-3 text-xs bg-gray-50 p-2 rounded border border-gray-100">
                            <p className="font-semibold text-gray-700 mb-1">Why you matched:</p>
                            <ul className="space-y-1 text-gray-600">
                               {match.matchBreakdown.why_this_match.slice(0, 2).map((reason, i) => (
                                 <li key={i} className="flex items-start gap-1.5">
                                    <Star className="h-3 w-3 text-yellow-400 mt-0.5 shrink-0" /> 
                                    <span>{reason}</span>
                                 </li>
                               ))}
                            </ul>
                         </div>
                       )}

                       <Button className="w-full mt-4" size="sm" variant="primary">Apply Now</Button>
                    </div>
                 ))}
               </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Summary */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-500" />
              Profile Summary
              <Tooltip content="Details extracted automatically from your uploaded CV.">
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <span className="font-semibold block text-gray-700">Skills</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {candidate.profile?.skills.map(s => (
                    <Badge key={s}>{s}</Badge>
                  )) || <span className="text-gray-400">No skills parsed yet</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-semibold block text-gray-700">Location</span>
                    <span className="text-gray-600">{candidate.location}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-gray-700">Experience</span>
                    <span className="text-gray-600">{candidate.profile?.totals.total_years_experience_estimate} years</span>
                  </div>
              </div>
              <div className="pt-2">
                <Link to="/candidate/upload-cv">
                  <Button variant="outline" className="w-full mt-2">
                    {hasCV ? "Update CV" : "Upload CV"}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ActivityIcon({ status }: { status?: InterviewStatus }) {
  if (status === InterviewStatus.COMPLETE) return <CheckCircle className="h-5 w-5 text-green-500" />;
  if (status === InterviewStatus.IN_PROGRESS) return <Clock className="h-5 w-5 text-yellow-500" />;
  return <PlayCircle className="h-5 w-5 text-indigo-500" />;
}
