import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../authContext';
import { Button, Card, CardContent, CardHeader, CardTitle } from '../ui';
import { UserRole } from '../types';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (email: string, role: UserRole) => {
    await login(email);
    if (role === UserRole.CANDIDATE) navigate('/candidate');
    else if (role === UserRole.COMPANY_USER) navigate('/company');
    else if (role === UserRole.SERENITY_ADMIN) navigate('/admin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sign in to Serenity</CardTitle>
          <p className="text-sm text-gray-500">Select a demo persona to continue</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            className="w-full h-12 text-lg justify-start px-6" 
            onClick={() => handleLogin('candidate@demo.com', UserRole.CANDIDATE)}
          >
            <div className="flex flex-col items-start">
              <span className="font-semibold">Candidate Demo</span>
              <span className="text-xs opacity-75 font-normal">Apply for jobs & take interviews</span>
            </div>
          </Button>
          
          <Button 
            className="w-full h-12 text-lg justify-start px-6" 
            variant="secondary"
            onClick={() => handleLogin('company@demo.com', UserRole.COMPANY_USER)}
          >
            <div className="flex flex-col items-start">
              <span className="font-semibold">Company Demo</span>
              <span className="text-xs opacity-75 font-normal">Manage programs & review applicants</span>
            </div>
          </Button>

          <Button 
            className="w-full h-12 text-lg justify-start px-6" 
            variant="outline"
            onClick={() => handleLogin('admin@serenity.com', UserRole.SERENITY_ADMIN)}
          >
            <div className="flex flex-col items-start">
              <span className="font-semibold">Admin Demo</span>
              <span className="text-xs opacity-75 font-normal">System oversight</span>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
