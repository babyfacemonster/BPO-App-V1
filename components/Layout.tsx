import React from 'react';
import { useAuth } from '../authContext';
import { Button } from '../ui';
import { LogOut, User as UserIcon, Briefcase, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Layout = ({ children, portal }: { children?: React.ReactNode, portal: 'candidate' | 'company' | 'admin' }) => {
  const { user, logout } = useAuth();

  const getNavItems = () => {
    switch (portal) {
      case 'candidate':
        return [
          { label: 'Dashboard', path: '/candidate' },
          { label: 'My Interview', path: '/candidate/interview' },
        ];
      case 'company':
        return [
          { label: 'Programs', path: '/company' },
        ];
      case 'admin':
        return [
          { label: 'Overview', path: '/admin' },
        ];
      default: return [];
    }
  };

  const portalColors = {
    candidate: 'bg-indigo-600',
    company: 'bg-emerald-700',
    admin: 'bg-slate-900'
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className={`${portalColors[portal]} text-white shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-xl font-bold tracking-tight flex items-center gap-2">
                {portal === 'candidate' && <UserIcon className="h-5 w-5" />}
                {portal === 'company' && <Briefcase className="h-5 w-5" />}
                {portal === 'admin' && <ShieldCheck className="h-5 w-5" />}
                Serenity {portal.charAt(0).toUpperCase() + portal.slice(1)}
              </Link>
              <nav className="hidden md:flex space-x-4">
                {getNavItems().map(item => (
                  <Link key={item.path} to={item.path} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm opacity-90">{user?.name}</span>
              <Button variant="ghost" onClick={logout} className="text-white hover:bg-white/20 hover:text-white">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};