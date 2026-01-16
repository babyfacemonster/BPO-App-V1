
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui';
import { Activity, Users, CheckCircle } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Stub */}
      <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link to="/" className="-m-1.5 p-1.5 text-xl font-bold text-indigo-600">
            Serenity
          </Link>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
           <Link to="/pricing" className="text-sm font-semibold leading-6 text-gray-900">Pricing</Link>
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <Link to="/login" className="text-sm font-semibold leading-6 text-gray-900">Log in <span aria-hidden="true">&rarr;</span></Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative isolate px-6 pt-10 lg:px-8">
        <div className="mx-auto max-w-2xl py-24 sm:py-32 lg:py-40 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Recruitment speed <span className="text-indigo-600">reimagined</span> for BPO.
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Serenity is the service-led marketplace connecting pre-vetted candidates with top BPO programs. 
            AI-driven interviews, instant matching, and simple flat-rate pricing.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link to="/login">
              <Button className="px-8 py-6 text-lg">Get Started</Button>
            </Link>
            <Link to="/pricing" className="text-sm font-semibold leading-6 text-gray-900">
              View Pricing <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-600">Faster Hiring</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to scale teams
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <Activity className="h-5 w-5 text-indigo-600" />
                  AI Interviews
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Automated video interviews validate communication skills 24/7. No per-interview costs.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <CheckCircle className="h-5 w-5 text-indigo-600" />
                  Instant Matching
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Candidates are matched to programs based on skills, location, and readiness score.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Service Led
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Our human admins oversee the AI to ensure fairness and quality.</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
