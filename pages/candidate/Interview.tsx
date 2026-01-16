import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../authContext';
import { db } from '../../db';
import { aiService } from '../../services/ai';
import { InterviewMode, InterviewStatus, InterviewRecommendation, InterviewSession, Candidate, NextQuestionOutput } from '../../types';
import { Button, Card, CardContent, Input, Badge } from '../../ui';
import { Mic, Send, Video, AlertCircle, Square, Clock, Info } from 'lucide-react';

export default function InterviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  
  // Track the current question's metadata (e.g., expected length)
  const [currentQuestionMeta, setCurrentQuestionMeta] = useState<NextQuestionOutput | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll effect
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session?.transcript]);

  // Initial Load
  useEffect(() => {
    if (!user) return;
    const initSession = async () => {
      const cand = await db.getCandidateByUserId(user.id);
      if (!cand) return;
      setCandidate(cand);
      
      let existing = await db.getCandidateInterview(cand.id);
      
      // Initialize if new
      if (!existing) {
        existing = {
          id: `int_${Date.now()}`,
          candidateId: cand.id,
          mode: InterviewMode.TEXT,
          status: InterviewStatus.IN_PROGRESS,
          transcript: [],
          questionScores: [],
          scores: { communication: 0, coherence: 0, empathy: 0, deescalation: 0, process: 0, stress: 0, reliability: 0, sales: 0, coachability: 0 },
          overallScore: 0,
          recommendation: InterviewRecommendation.NOT_RECOMMENDED_YET,
          createdAt: new Date().toISOString(),
          interviewState: {
            current_master_index: 0,
            master_questions_asked: [],
            followups_used: 0,
            time_elapsed_minutes: 0,
            flags: [],
            last_question_id: null,
            phase: 'intro'
          }
        };

        // Get first AI question
        const { next_question, updated_state } = await aiService.orchestrateInterview(cand.profile, [], existing.interviewState);
        if (next_question) {
            existing.transcript.push({ role: 'system', content: next_question.text, id: next_question.id });
            existing.interviewState = updated_state;
            setCurrentQuestionMeta(next_question);
        }
        
        await db.saveInterview(existing);
      } else {
        // Recovering existing session - try to infer current question metadata if possible, or just default
        // In a real app we'd store the current question metadata in the DB session too.
        // For MVP, we can rely on the last turn if needed, but we'll leave it null for now.
      }
      setSession(existing);
      if (existing.mode === InterviewMode.VIDEO) {
          setCameraActive(true); // Auto-activate if resuming video
      }
    };
    initSession();
  }, [user]);

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingSeconds(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const handleSend = async (mockVideoBlob?: Blob) => {
    if ((!inputText.trim() && !mockVideoBlob) || !session || !candidate) return;
    setIsProcessing(true);

    const currentTranscript = [...session.transcript];
    
    // Find the ID of the last system message (the question being answered)
    const lastSystemMsg = [...currentTranscript].reverse().find(m => m.role === 'system');
    const questionId = lastSystemMsg?.id || 'unknown';
    const questionText = lastSystemMsg?.content || 'unknown';

    let answerItem: any = null;
    let audioMetrics = undefined;

    if (mockVideoBlob) {
        // VIDEO FLOW
        // 1. Process Video -> Get Text & Metadata
        const transcriptItem = await aiService.processVideoResponse(questionId, mockVideoBlob);
        answerItem = transcriptItem;
        
        // Mock Audio Metrics from the "Recording"
        audioMetrics = {
            speaking_rate_wpm: 140, // Average reasonable rate
            pause_ratio: 0.15,
            filler_word_rate: Math.random() * 0.1 // Random filler rate for demo
        };
    } else {
        // TEXT FLOW
        answerItem = { role: 'user', content: inputText };
        setInputText('');
    }

    // 1. Add User Answer
    const updatedTranscript = [...currentTranscript, answerItem];
    setSession(prev => prev ? { ...prev, transcript: updatedTranscript } : null);

    // 2. Score THIS Answer (Using the text content and optional audio metrics)
    const answerScore = await aiService.scoreSingleAnswer(
        candidate.profile,
        { id: questionId, text: questionText },
        answerItem.content,
        audioMetrics
    );
    const updatedQuestionScores = [...(session.questionScores || []), answerScore];

    // 3. Call AI Orchestrator for NEXT question
    const { next_question, updated_state } = await aiService.orchestrateInterview(
      candidate.profile, 
      updatedTranscript, 
      session.interviewState
    );

    let newStatus = session.status;
    let finalScores = session.scores;
    let finalOverall = session.overallScore;
    let finalRec = session.recommendation;

    // 4. Process Next Step
    if (next_question) {
       updatedTranscript.push({ role: 'system', content: next_question.text, id: next_question.id });
       setCurrentQuestionMeta(next_question);
    } else {
       setCurrentQuestionMeta(null);
    }

    // Check if interview ended
    if (updated_state.phase === 'closing' && !next_question) {
       newStatus = InterviewStatus.COMPLETE;
       // Calculate Final Scores
       const result = await aiService.scoreInterview({ ...session, transcript: updatedTranscript });
       finalScores = result.scores;
       finalOverall = result.overallScore;
       finalRec = result.recommendation;
    }

    const updatedSession = {
      ...session,
      transcript: updatedTranscript,
      questionScores: updatedQuestionScores,
      status: newStatus,
      interviewState: updated_state,
      scores: finalScores,
      overallScore: finalOverall,
      recommendation: finalRec,
      mode: cameraActive ? InterviewMode.VIDEO : InterviewMode.TEXT
    };

    setSession(updatedSession);
    await db.saveInterview(updatedSession);
    setIsProcessing(false);

    if (newStatus === InterviewStatus.COMPLETE) {
      setTimeout(() => navigate('/candidate'), 3000);
    }
  };

  const toggleVideo = async () => {
    if (cameraActive) {
      setCameraActive(false);
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCameraActive(true);
    } catch (e) {
      alert('Camera permission denied or not available.');
    }
  };

  const startRecording = () => setIsRecording(true);
  const stopRecording = () => {
      setIsRecording(false);
      handleSend(new Blob(['mock'], { type: 'video/webm' }));
  };

  if (!session) return <div>Loading interview...</div>;

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">AI Interview Session</h2>
        <div className="flex gap-2">
           <Button variant={cameraActive ? "danger" : "outline"} onClick={toggleVideo} className="gap-2">
             <Video className="h-4 w-4" /> {cameraActive ? "Switch to Text" : "Switch to Video"}
           </Button>
        </div>
      </div>

      {cameraActive && (
         <div className="bg-black aspect-video rounded-lg mb-4 flex items-center justify-center relative overflow-hidden shadow-md">
            {isRecording && (
                <div className="absolute top-4 right-4 animate-pulse flex items-center gap-2 z-10">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-white text-xs font-mono">REC {new Date(recordingSeconds * 1000).toISOString().substr(14, 5)}</span>
                </div>
            )}
            <p className="text-gray-500">Camera Feed Active (Mock)</p>
         </div>
      )}

      {/* Suggested Answer Length Hint */}
      {currentQuestionMeta?.expected_answer_length_seconds && session.status !== InterviewStatus.COMPLETE && (
        <div className="mb-2 flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full border border-indigo-100">
                <Info className="h-3 w-3" /> 
                Recommended Answer Length: ~{currentQuestionMeta.expected_answer_length_seconds} seconds
            </span>
            {currentQuestionMeta.type === 'followup' && (
                <span className="ml-2 inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full border border-yellow-100">
                    Follow-up Question
                </span>
            )}
        </div>
      )}

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {session.transcript.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-white border text-gray-800 rounded-bl-none shadow-sm'
              }`}>
                <div className="flex justify-between items-start gap-2 mb-1">
                    {msg.quality_flags && msg.quality_flags.length > 0 && (
                         <div className="flex gap-1 mb-1">
                            {msg.quality_flags.map(flag => (
                                <Badge key={flag} variant="warning" >{flag.replace('_', ' ')}</Badge>
                            ))}
                         </div>
                    )}
                </div>
                {msg.content}
                
                {/* Video Metadata Display */}
                {msg.role === 'user' && msg.timestamps && (
                    <div className="mt-1 pt-1 border-t border-indigo-400 text-[10px] text-indigo-200 flex items-center gap-2">
                        <Clock className="h-3 w-3" /> {msg.timestamps.end_sec}s duration
                    </div>
                )}
                
                {/* Confidence Score (Debug) */}
                {msg.role === 'user' && session.questionScores && session.questionScores.find(qs => qs.question_id === session.transcript[idx-1]?.id) && (
                    <div className="mt-1 text-[10px] text-indigo-100 opacity-70">
                        Confidence: {(session.questionScores.find(qs => qs.question_id === session.transcript[idx-1]?.id)?.ai_confidence || 0.8 * 100).toFixed(0)}%
                    </div>
                )}
              </div>
            </div>
          ))}
          <div ref={scrollRef}></div>
        </CardContent>
        <div className="p-4 bg-white border-t">
          <div className="flex gap-2 items-center">
            {cameraActive ? (
                <>
                   {isRecording ? (
                       <Button onClick={stopRecording} variant="danger" className="w-full flex items-center justify-center gap-2 animate-pulse">
                           <Square className="h-4 w-4 fill-current" /> Stop Recording
                       </Button>
                   ) : (
                       <Button onClick={startRecording} disabled={isProcessing || session.status === InterviewStatus.COMPLETE} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700">
                           <Mic className="h-4 w-4" /> Start Recording Answer
                       </Button>
                   )}
                </>
            ) : (
                <>
                    <Input 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type your answer..."
                    disabled={isProcessing || session.status === InterviewStatus.COMPLETE}
                    className="flex-1"
                    />
                    <Button onClick={() => handleSend()} disabled={isProcessing || !inputText.trim()}>
                    <Send className="h-4 w-4" />
                    </Button>
                </>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            {isProcessing ? "AI is processing your answer..." : session.status === InterviewStatus.COMPLETE ? "Interview Complete" : cameraActive ? "Speak clearly into your microphone." : "Type your response to the interviewer."}
          </p>
        </div>
      </Card>
    </div>
  );
}