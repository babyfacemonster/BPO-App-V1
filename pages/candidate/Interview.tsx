
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../authContext';
import { db } from '../../db';
import { aiService, WARMUP_SPEECH } from '../../services/ai';
import { useMediaRecorder } from '../../hooks/useMediaRecorder';
import { useTTS } from '../../hooks/useTTS';
import { useSilenceDetector } from '../../hooks/useSilenceDetector';
import { InterviewSession, InterviewMode, InterviewStatus, InterviewRecommendation, NextQuestionOutput, TranscriptItem, FeedbackForCandidate, CoachingOffer } from '../../types';
import { Button, Card, Badge, Input } from '../../ui';
import { Mic, Video, StopCircle, Play, Loader2, Volume2, Clock, AlertCircle, Settings, Check, X, Smile, Sparkles, ArrowRight, FileText, Zap } from 'lucide-react';

export default function InterviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Custom Hooks
  // status: 'idle' | 'previewing' | 'recording' | 'stopped'
  const { status: recordingStatus, initializeStream, startRecording, stopRecording, mediaBlob, previewStream } = useMediaRecorder();
  
  // TTS Hook
  const { 
    speak, 
    stop: stopTTS, 
    isSpeaking: isAiSpeaking, 
    availableVoices, 
    selectedVoiceId, 
    setSelectedVoiceId, 
    testVoice 
  } = useTTS();

  const [listeningActive, setListeningActive] = useState(false);
  const { isSilent, volume } = useSilenceDetector(previewStream, true, 12, 3000); 

  // State
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<NextQuestionOutput | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  // Update phases to include warm-up and upsell
  const [interviewPhase, setInterviewPhase] = useState<'idle' | 'warmup' | 'intro' | 'speaking' | 'listening' | 'processing' | 'complete' | 'upsell'>('idle');
  
  const [isFinishing, setIsFinishing] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [answerStartTime, setAnswerStartTime] = useState<number>(0);
  const [questionsAskedList, setQuestionsAskedList] = useState<Array<{question_id: string, text: string, start_sec: number, end_sec: number}>>([]);
  const [showSettings, setShowSettings] = useState(false);
  
  // New state for post-interview offers
  const [completionFeedback, setCompletionFeedback] = useState<FeedbackForCandidate | null>(null);

  const processingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warmupPlayedRef = useRef(false);

  // Initialize Session
  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const cand = await db.getCandidateByUserId(user.id);
      if (!cand) return;

      let existing = await db.getCandidateInterview(cand.id);
      if (!existing) {
        existing = {
          id: `int_${Date.now()}`,
          candidateId: cand.id,
          mode: InterviewMode.VIDEO,
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
            last_question_type: null,
            phase: 'intro'
          }
        };
        await db.saveInterview(existing);
      }
      setSession(existing);
    };
    init();
  }, [user]);

  // Global Timer (Hard Stop) - Only runs during ACTUAL recording
  useEffect(() => {
    if (recordingStatus === 'recording') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(s => {
          if (s >= 45 * 60) { // 45 min hard stop
             handleStopInterview();
             return s;
          }
          return s + 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recordingStatus]);

  // Video Preview Ref
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  // --- BARGE-IN LOGIC ---
  useEffect(() => {
    // Disable barge-in during warm-up and closing to prevent cutting off the message
    if (interviewPhase === 'warmup') return;
    if (currentQuestion?.type === 'closing') return;

    if (isAiSpeaking && volume > 20 && interviewPhase === 'speaking') {
        console.log("Barge-in detected! Stopping TTS.");
        stopTTS(); 
    }
  }, [isAiSpeaking, volume, interviewPhase, stopTTS, currentQuestion]);


  // --- CONVERSATION LOOP ---

  // 1. Enter Warm-up Phase (Preview, Permission Check, Intro Speech)
  const handleEnterWarmup = async () => {
    const success = await initializeStream();
    if (!success) {
      alert("Microphone and Camera access required.");
      return;
    }
    setInterviewPhase('warmup');
  };

  // Play Warm-up Speech automatically once in phase
  useEffect(() => {
    if (interviewPhase === 'warmup' && !warmupPlayedRef.current) {
      warmupPlayedRef.current = true;
      // Slight delay for smooth UI transition
      setTimeout(() => {
        speak(WARMUP_SPEECH, 'WARMUP_001');
      }, 500);
    }
  }, [interviewPhase, speak]);

  // 2. Start Actual Interview (Recording)
  const handleStartRealInterview = async () => {
    stopTTS(); // Stop warm-up speech if still playing
    const success = await startRecording();
    if (success) {
      setInterviewPhase('processing'); // Triggers first question
    }
  };

  // 3. Main Loop Effect
  useEffect(() => {
    if (interviewPhase === 'processing' && !processingRef.current) {
      processNextTurn();
    }
  }, [interviewPhase]);

  // 4. Process Turn (Fetch Question)
  const processNextTurn = async () => {
    if (!session || processingRef.current) return;
    processingRef.current = true;

    try {
      const cand = await db.getCandidateByUserId(user!.id);
      if (!cand) return;

      const currentState = {
        ...session.interviewState!,
        time_elapsed_minutes: elapsedSeconds / 60
      };

      const { next_question, updated_state } = await aiService.orchestrateInterview(
        cand.profile, 
        session.transcript, 
        currentState
      );

      const updatedSession = { ...session, interviewState: updated_state };
      setSession(updatedSession);
      await db.saveInterview(updatedSession);

      if (!next_question || updated_state.phase === 'complete') {
        if (next_question) {
           setCurrentQuestion(next_question);
           setInterviewPhase('speaking');
        } else {
           handleStopInterview();
        }
      } else {
        setCurrentQuestion(next_question);
        setInterviewPhase('speaking');
      }
    } catch (e) {
      console.error(e);
    } finally {
      processingRef.current = false;
    }
  };

  // 5. Handle Speaking Phase (AI)
  useEffect(() => {
    if (interviewPhase === 'speaking' && currentQuestion) {
      setListeningActive(false);
      const startSec = elapsedSeconds;
      setQuestionStartTime(startSec);
      
      speak(currentQuestion.text, currentQuestion.id);
    }
  }, [interviewPhase, currentQuestion]);

  // 6. Detect End of Speaking -> Start Listening
  useEffect(() => {
    if (interviewPhase === 'speaking' && !isAiSpeaking && currentQuestion) {
      // AI finished talking (either naturally or interrupted)
      const endSec = elapsedSeconds;
      
      setSession(prev => {
        if (!prev) return null;
        if (prev.transcript.some(t => t.id === currentQuestion.id)) return prev;
        
        return {
          ...prev,
          transcript: [...prev.transcript, {
             role: 'system',
             id: currentQuestion.id,
             content: currentQuestion.text,
             timestamps: { start_sec: questionStartTime, end_sec: endSec }
          }]
        };
      });

      setQuestionsAskedList(prev => [...prev, {
        question_id: currentQuestion.id,
        text: currentQuestion.text,
        start_sec: questionStartTime,
        end_sec: endSec
      }]);

      if (currentQuestion.type === 'closing') {
        handleStopInterview();
      } else {
        setInterviewPhase('listening');
        setListeningActive(true);
        setAnswerStartTime(elapsedSeconds);
      }
    }
  }, [interviewPhase, isAiSpeaking]);

  // 7. Handle Listening Phase
  useEffect(() => {
    if (interviewPhase !== 'listening' || !currentQuestion) return;

    const answerDuration = elapsedSeconds - answerStartTime;
    const maxDuration = currentQuestion.expected_answer_length_seconds ? currentQuestion.expected_answer_length_seconds * 1.5 : 120;
    const minDuration = 3;

    if (answerDuration > maxDuration) {
      finishAnswer();
      return;
    }

    if (isSilent && answerDuration > minDuration) {
      finishAnswer();
    }
  }, [interviewPhase, isSilent, elapsedSeconds]);

  const finishAnswer = () => {
    setListeningActive(false);
    
    const newTranscriptItem: TranscriptItem = {
      role: 'user',
      content: '[AUDIO_RESPONSE]',
      timestamps: {
        start_sec: answerStartTime,
        end_sec: elapsedSeconds
      }
    };

    setSession(prev => prev ? ({
      ...prev,
      transcript: [...prev.transcript, newTranscriptItem]
    }) : null);

    setInterviewPhase('processing');
  };

  const handleStopInterview = async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    stopRecording();
    stopTTS();
    
    // Do not set phase to complete immediately, wait for processing
    
    if (session) {
      const evaluation = await aiService.postProcessInterview({
        candidateProfile: undefined,
        questionsAsked: questionsAskedList,
        audioMetricsSummary: {}
      });

      const finalSession: InterviewSession = {
        ...session,
        status: InterviewStatus.COMPLETE,
        scores: evaluation.scores,
        overallScore: evaluation.overallScore,
        recommendation: evaluation.recommendation,
        summaryForCompany: evaluation.summaryForCompany,
        feedbackForCandidate: evaluation.feedbackForCandidate as any,
        riskFlags: evaluation.riskFlags,
        aiConfidence: evaluation.aiConfidence,
      };
      
      await db.saveInterview(finalSession);
      
      // Instead of navigating, show upsell view
      setCompletionFeedback(evaluation.feedbackForCandidate as FeedbackForCandidate);
      setIsFinishing(false);
      setInterviewPhase('upsell');
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!session) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;

  // -- LOADING SCREEN --
  if (isFinishing) {
     return (
        <div className="flex h-screen flex-col items-center justify-center bg-slate-900 text-white space-y-4">
           <Loader2 className="animate-spin h-12 w-12 text-indigo-500" />
           <h2 className="text-xl font-semibold">Wrapping up...</h2>
           <p className="text-slate-400">Our AI is analyzing your session to generate your readiness score.</p>
        </div>
     );
  }

  // -- UPSELL / COMPLETION SCREEN --
  if (interviewPhase === 'upsell' && completionFeedback) {
     return (
        <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
           <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
              {/* Left: Summary */}
              <div className="md:w-1/3 bg-indigo-900 text-white p-8 flex flex-col justify-between">
                 <div>
                    <div className="h-12 w-12 bg-white/10 rounded-full flex items-center justify-center mb-6">
                       <Check className="h-6 w-6 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Great job!</h2>
                    <p className="text-indigo-200 text-sm leading-relaxed mb-6">
                       Your interview has been submitted securely. Companies will now be able to see your readiness score.
                    </p>
                    <div className="space-y-4">
                       <div className="bg-indigo-800/50 p-3 rounded-lg border border-indigo-700/50">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1">Next Steps</h4>
                          <p className="text-xs text-indigo-100">Your profile is now active in the marketplace. You will be notified when a company shortlists you.</p>
                       </div>
                    </div>
                 </div>
                 <div className="mt-8">
                    <Button variant="ghost" className="text-white hover:bg-white/10 w-full justify-start pl-0" onClick={() => navigate('/candidate')}>
                       Skip to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                 </div>
              </div>

              {/* Right: Upsells */}
              <div className="md:w-2/3 p-8">
                 <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                       <Sparkles className="h-5 w-5 text-yellow-500" /> Boost Your Profile
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                       Based on your interview, we found a few optional resources that could help you stand out to recruiters.
                    </p>
                 </div>

                 <div className="grid gap-4">
                    {completionFeedback.coaching_offers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                           <Smile className="h-8 w-8 mx-auto mb-2 opacity-50" />
                           <p>No specific recommendations right now. You're good to go!</p>
                        </div>
                    ) : (
                        completionFeedback.coaching_offers.map((offer, idx) => (
                           <UpsellCard key={idx} offer={offer} />
                        ))
                    )}
                 </div>

                 <div className="mt-8 flex justify-end">
                    <Button onClick={() => navigate('/candidate')}>
                       Continue to Dashboard
                    </Button>
                 </div>
              </div>
           </div>
        </div>
     );
  }

  // -- INTERVIEW SCREEN --
  return (
    <div className="fixed inset-0 bg-slate-950 text-white flex flex-col overflow-hidden font-sans">
      
      <style>{`
        @keyframes equalizer {
          0%, 100% { height: 4px; }
          50% { height: 100%; }
        }
        .animate-equalizer {
          animation: equalizer 0.5s ease-in-out infinite;
        }
      `}</style>

      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 bg-slate-900 border-b border-slate-800 z-10">
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${recordingStatus === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className="font-mono text-lg text-slate-300">{formatTime(elapsedSeconds)}</span>
          {recordingStatus === 'recording' && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-900/50 text-red-100 rounded border border-red-800">REC</span>}
          {interviewPhase === 'warmup' && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-900/50 text-blue-100 rounded border border-blue-800">WARM UP</span>}
        </div>
        <div className="flex items-center gap-4">
          <Button variant="danger" size="sm" onClick={handleStopInterview} disabled={interviewPhase === 'complete' || interviewPhase === 'idle' || interviewPhase === 'warmup' || isFinishing}>
            <StopCircle className="h-4 w-4 mr-2" /> End
          </Button>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        
        {/* Left: AI Avatar Zone */}
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 relative p-8 border-r border-slate-900/50">
           
           {/* Main Avatar Container */}
           <div className="relative group">
              {/* Pulse Ring */}
              <div className={`absolute inset-0 bg-indigo-500 rounded-full blur-2xl transition-opacity duration-300 ${isAiSpeaking ? 'opacity-30' : 'opacity-5'}`}></div>
              
              {/* Orb */}
              <div className="relative h-64 w-64 rounded-full bg-slate-900 border border-slate-700/50 shadow-2xl flex items-center justify-center overflow-hidden">
                 <div className={`absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-purple-900/20 to-slate-900 transition-all duration-1000 ${isAiSpeaking ? 'scale-110 opacity-100' : 'scale-100 opacity-50'}`}></div>
                 
                 {/* Voice Visualizer */}
                 <div className="flex items-center justify-center gap-1.5 h-12 w-32 z-10">
                    {[1,2,3,4,5].map(i => (
                        <div 
                          key={i} 
                          className={`w-2 bg-indigo-400 rounded-full transition-all shadow-[0_0_10px_rgba(129,140,248,0.5)] ${isAiSpeaking ? 'animate-equalizer' : 'h-1'}`}
                          style={{
                             animationDelay: `${i * 0.1}s`,
                             opacity: isAiSpeaking ? 1 : 0.3
                          }}
                        ></div>
                    ))}
                 </div>
              </div>

              {/* Status Badge */}
              <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 transition-all duration-300 ${isAiSpeaking ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                  <span className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-2">
                     <Volume2 className="h-3 w-3" /> Speaking
                  </span>
              </div>
           </div>

           {/* Subtitles / Context */}
           <div className="mt-12 w-full max-w-xl text-center space-y-4 min-h-[160px]">
              {interviewPhase === 'warmup' && (
                 <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-6 shadow-xl backdrop-blur-md animate-in fade-in zoom-in duration-500">
                    <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                      <Smile className="h-4 w-4" /> Welcome
                    </h3>
                    <p className="text-lg font-medium text-indigo-100 leading-relaxed">
                      "Hi! I'm Serenity. Don't worry, this isn't a test. Just relax and be yourself."
                    </p>
                    <p className="text-xs text-slate-400 mt-4">
                      The interview will only start when you click "I'm Ready".
                    </p>
                    <div className="mt-6">
                      <Button onClick={handleStartRealInterview} className="px-8 bg-white text-indigo-900 hover:bg-indigo-50 font-bold shadow-lg shadow-indigo-500/20">
                         I'm Ready
                      </Button>
                    </div>
                 </div>
              )}

              {interviewPhase === 'speaking' || interviewPhase === 'listening' ? (
                 <div className={`transition-all duration-500 ${currentQuestion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${currentQuestion?.type === 'closing' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                      {currentQuestion?.type === 'closing' ? 'Interview Complete' : 'Current Question'}
                    </h3>
                    <div className={`bg-slate-900/80 border rounded-xl p-6 shadow-xl backdrop-blur-md ${currentQuestion?.type === 'closing' ? 'border-emerald-500/50' : 'border-slate-800'}`}>
                       <p className="text-xl font-medium text-slate-100 leading-relaxed">
                          "{currentQuestion?.text}"
                       </p>
                    </div>
                 </div>
              ) : null}

              {(interviewPhase === 'idle' || interviewPhase === 'processing') && (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
                    {interviewPhase === 'processing' && (
                        <>
                           <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                           <p className="text-sm font-medium">Analyzing response...</p>
                        </>
                    )}
                    {interviewPhase === 'idle' && <p>Waiting to start...</p>}
                </div>
              )}
           </div>

           {/* Start Overlay */}
           {interviewPhase === 'idle' && !showSettings && (
             <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-20">
                <Card className="max-w-md w-full bg-slate-900 border-slate-800 shadow-2xl">
                   <div className="p-8 text-center space-y-6">
                      <div className="mx-auto h-20 w-20 bg-indigo-500/10 rounded-full flex items-center justify-center ring-1 ring-indigo-500/50">
                         <div className="h-12 w-12 bg-indigo-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                            <Video className="h-6 w-6 text-white" />
                         </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-white">Video Interview</h1>
                        <p className="text-slate-400 leading-relaxed">
                          A stress-free conversation to help find your best match.
                        </p>
                      </div>

                      <div className="bg-slate-800/50 rounded-lg p-4 text-xs text-slate-400 border border-slate-700/50 text-left space-y-2">
                         <div className="flex items-start gap-3">
                            <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                            <p>Not a test — no trick questions.</p>
                         </div>
                         <div className="flex items-start gap-3">
                            <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                            <p>Take your time answering.</p>
                         </div>
                      </div>

                      <div className="flex gap-3">
                        <Button onClick={() => setShowSettings(true)} variant="outline" className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800">
                          <Settings className="h-4 w-4 mr-2" /> Voice Settings
                        </Button>
                        <Button onClick={handleEnterWarmup} className="flex-[2] h-10 bg-indigo-600 hover:bg-indigo-500 text-white border-none">
                          <Play className="h-4 w-4 mr-2" /> Check Mic & Start
                        </Button>
                      </div>
                   </div>
                </Card>
             </div>
           )}

           {/* Voice Settings Overlay */}
           {showSettings && (
             <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center z-30">
               <Card className="max-w-md w-full bg-slate-900 border-slate-800 shadow-2xl">
                 <div className="p-6">
                   <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-bold text-white">AI Voice Settings</h2>
                     <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}><X className="h-4 w-4" /></Button>
                   </div>
                   
                   <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                     {availableVoices.map(voice => (
                       <div 
                        key={voice.id} 
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedVoiceId === voice.id ? 'bg-indigo-900/30 border-indigo-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}
                        onClick={() => setSelectedVoiceId(voice.id)}
                       >
                         <div className="flex justify-between items-center">
                           <div>
                             <p className="font-medium text-sm text-white">{voice.name}</p>
                             <p className="text-xs text-slate-500">{voice.lang}</p>
                           </div>
                           {selectedVoiceId === voice.id && <Check className="h-4 w-4 text-indigo-400" />}
                         </div>
                       </div>
                     ))}
                   </div>

                   <div className="mt-6 pt-4 border-t border-slate-800 flex gap-3">
                     <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => selectedVoiceId && testVoice(selectedVoiceId)}
                      disabled={isAiSpeaking}
                     >
                       {isAiSpeaking ? 'Playing...' : 'Test Voice'}
                     </Button>
                     <Button className="flex-1 bg-emerald-600 hover:bg-emerald-500" onClick={() => setShowSettings(false)}>
                       Done
                     </Button>
                   </div>
                 </div>
               </Card>
             </div>
           )}

        </div>

        {/* Right: Candidate Camera */}
        <div className="flex-1 bg-black relative flex items-center justify-center border-l border-slate-800">
           {previewStream ? (
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className="w-full h-full object-cover mirror-mode opacity-90" 
                style={{ transform: 'scaleX(-1)' }}
              />
           ) : (
              <div className="text-slate-600 flex flex-col items-center">
                 <Video className="h-12 w-12 mb-2 opacity-30" />
                 <p className="text-sm">Camera Off</p>
              </div>
           )}

           {/* VAD Indicator */}
           {interviewPhase === 'listening' && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 w-full max-w-xs px-4">
                 <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                    <div className={`w-2 h-2 rounded-full transition-colors ${volume > 10 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-500'}`}></div>
                    <span className={`text-xs uppercase font-bold tracking-wider ${volume > 10 ? 'text-emerald-400' : 'text-slate-400'}`}>
                       {volume > 10 ? 'Voice Detected' : 'Listening...'}
                    </span>
                 </div>
                 <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div className="h-full bg-emerald-500 transition-all duration-100 ease-out" style={{ width: `${Math.min(100, volume * 1.5)}%` }}></div>
                 </div>
                 <Button variant="outline" size="sm" onClick={finishAnswer} className="mt-2 bg-black/40 border-white/10 text-slate-200 hover:bg-white/10 hover:text-white backdrop-blur-md transition-all">
                    Done Speaking
                 </Button>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}

// -- UPSELL COMPONENT --
const UpsellCard: React.FC<{ offer: CoachingOffer }> = ({ offer }) => {
   // Mock Prices
   const prices: Record<string, string> = {
      CV_REWRITE: "$15",
      INTERVIEW_PREP: "$25",
      COMMUNICATION_COACHING: "$40",
      JOB_READINESS: "$10"
   };

   // Icons
   const Icons: Record<string, React.ReactNode> = {
      CV_REWRITE: <FileText className="h-5 w-5" />,
      INTERVIEW_PREP: <Video className="h-5 w-5" />,
      COMMUNICATION_COACHING: <Volume2 className="h-5 w-5" />,
      JOB_READINESS: <Zap className="h-5 w-5" />
   };

   return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4 hover:border-indigo-300 hover:shadow-md transition-all">
         <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${offer.priority === 'high' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
            {Icons[offer.type] || <Sparkles className="h-5 w-5" />}
         </div>
         <div className="flex-1">
            <div className="flex justify-between items-start">
               <h4 className="font-bold text-gray-900">{offer.type.replace(/_/g, ' ')}</h4>
               <Badge variant={offer.priority === 'high' ? 'warning' : 'default'}>{prices[offer.type] || '$20'}</Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1">{offer.reason}</p>
            <p className="text-xs text-indigo-600 font-medium mt-2 flex items-center gap-1">
               <Sparkles className="h-3 w-3" /> Benefit: {offer.expected_benefit}
            </p>
         </div>
         <div className="flex flex-col justify-center sm:border-l sm:pl-4">
             <Button size="sm" variant="outline">Learn More</Button>
         </div>
      </div>
   );
};
