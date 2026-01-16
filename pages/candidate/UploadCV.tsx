import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../authContext';
import { db } from '../../db';
import { aiService } from '../../services/ai';
import { Button, Card, CardContent, CardHeader, CardTitle } from '../../ui';
import { Upload, FileText, CheckCircle, ArrowLeft } from 'lucide-react';

export default function UploadCV() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setIsUploading(true);

    try {
      // 1. Get Candidate ID
      const candidate = await db.getCandidateByUserId(user.id);
      if (!candidate) throw new Error("Candidate not found");

      // 2. Parse CV (Mock AI)
      const { text, profile } = await aiService.parseCV(file);

      // 3. Save to DB
      await db.saveCV({
        id: `cv_${Date.now()}`,
        candidateId: candidate.id,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file), // Mock URL
        rawText: text,
        createdAt: new Date().toISOString()
      }, profile);

      setUploadComplete(true);
      setTimeout(() => navigate('/candidate'), 2000);

    } catch (error) {
      console.error(error);
      alert("Failed to upload CV");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate('/candidate')} className="pl-0">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Upload Your CV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
            {uploadComplete ? (
              <div className="flex flex-col items-center text-green-600">
                <CheckCircle className="h-12 w-12 mb-2" />
                <span className="font-semibold">Upload Complete!</span>
                <p className="text-sm text-gray-500">Redirecting...</p>
              </div>
            ) : (
              <>
                <input 
                  type="file" 
                  id="cv-upload" 
                  className="hidden" 
                  accept=".pdf,.docx,.doc" 
                  onChange={handleFileChange}
                />
                <label htmlFor="cv-upload" className="cursor-pointer flex flex-col items-center">
                  <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900">
                    {file ? file.name : "Click to select file (PDF, DOCX)"}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">Max 5MB</span>
                </label>
              </>
            )}
          </div>

          {!uploadComplete && (
            <div className="space-y-4">
              <div className="bg-indigo-50 p-4 rounded-md text-sm text-indigo-800">
                <p className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" /> AI Analysis
                </p>
                <p className="mt-1 opacity-90">
                  Our AI will automatically extract your skills, work history, and education to match you with the best programs.
                </p>
              </div>

              <Button 
                onClick={handleUpload} 
                disabled={!file || isUploading} 
                className="w-full"
              >
                {isUploading ? "Analyzing & Uploading..." : "Upload & Analyze"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}