import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '../ui';
import { Check, X, HelpCircle, Briefcase, Zap, Shield } from 'lucide-react';

const Feature = ({ children }: { children?: React.ReactNode }) => (
    <li className="flex gap-x-3">
        <Check className="h-6 w-5 flex-none text-indigo-600" aria-hidden="true" />
        {children}
    </li>
);

const NotFeature = ({ children }: { children?: React.ReactNode }) => (
    <li className="flex gap-x-3 opacity-50">
        <X className="h-6 w-5 flex-none text-gray-400" aria-hidden="true" />
        {children}
    </li>
);

const FAQ = ({ q, a }: { q: string, a: string }) => (
    <div className="bg-gray-50 rounded-lg p-6">
        <dt className="font-semibold text-gray-900 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-indigo-500" />
            {q}
        </dt>
        <dd className="mt-2 text-gray-600 text-sm leading-relaxed pl-7">{a}</dd>
    </div>
);

export default function Pricing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar Stub */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-indigo-600">Serenity</Link>
          <div className="flex gap-4">
             <Link to="/login"><Button variant="ghost">Log in</Button></Link>
             <Link to="/login"><Button>Get Started</Button></Link>
          </div>
        </div>
      </div>

      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-600">Simple, Predictable Pricing</h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Pay for active programs, not per interview.
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              BPO hiring is high volume. We don't charge you for AI tokens or per candidate application. 
              Subscribe based on the number of active campaigns you run.
            </p>
          </div>

          <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            
            {/* STARTER */}
            <Card className="flex flex-col justify-between ring-1 ring-gray-200">
                <CardHeader>
                    <div className="flex items-center justify-between gap-x-4">
                        <h3 className="text-lg font-semibold leading-8 text-gray-900">Starter</h3>
                        <Badge variant="default">Pilot</Badge>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-gray-600">Perfect for single-site BPOs or pilot campaigns.</p>
                    <p className="mt-6 flex items-baseline gap-x-1">
                        <span className="text-4xl font-bold tracking-tight text-gray-900">$499</span>
                        <span className="text-sm font-semibold leading-6 text-gray-600">/month</span>
                    </p>
                    <Link to="/login" className="mt-6 block">
                        <Button variant="outline" className="w-full">Start 14-Day Trial</Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    <ul role="list" className="space-y-3 text-sm leading-6 text-gray-600">
                        <Feature>Up to 3 Active Programs</Feature>
                        <Feature>Unlimited Candidate Applications</Feature>
                        <Feature>Unlimited AI Text Interviews</Feature>
                        <Feature>Standard Scoring Model</Feature>
                        <Feature>Email Support</Feature>
                        <NotFeature>Video Interviewing</NotFeature>
                        <NotFeature>Custom Deal Breakers</NotFeature>
                    </ul>
                </CardContent>
            </Card>

            {/* GROWTH */}
            <Card className="flex flex-col justify-between ring-2 ring-indigo-600 shadow-xl relative">
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Most Popular</span>
                </div>
                <CardHeader>
                    <div className="flex items-center justify-between gap-x-4">
                        <h3 className="text-lg font-semibold leading-8 text-indigo-600">Growth</h3>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-gray-600">For scaling BPOs running multiple LOBs simultaneously.</p>
                    <p className="mt-6 flex items-baseline gap-x-1">
                        <span className="text-4xl font-bold tracking-tight text-gray-900">$1,499</span>
                        <span className="text-sm font-semibold leading-6 text-gray-600">/month</span>
                    </p>
                    <Link to="/login" className="mt-6 block">
                        <Button variant="primary" className="w-full">Get Started</Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    <ul role="list" className="space-y-3 text-sm leading-6 text-gray-600">
                        <Feature>Up to 10 Active Programs</Feature>
                        <Feature>Unlimited Candidate Applications</Feature>
                        <Feature>Unlimited AI Text Interviews</Feature>
                        <Feature><strong>Video AI Interviewing (Beta)</strong></Feature>
                        <Feature>Custom Scoring & Deal Breakers</Feature>
                        <Feature>Priority Chat Support</Feature>
                        <Feature>Candidate Shortlist Exports</Feature>
                    </ul>
                </CardContent>
            </Card>

            {/* ENTERPRISE */}
            <Card className="flex flex-col justify-between ring-1 ring-gray-200">
                <CardHeader>
                    <div className="flex items-center justify-between gap-x-4">
                        <h3 className="text-lg font-semibold leading-8 text-gray-900">Enterprise</h3>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-gray-600">For global BPOs requiring ATS integration and SLAs.</p>
                    <p className="mt-6 flex items-baseline gap-x-1">
                        <span className="text-4xl font-bold tracking-tight text-gray-900">Custom</span>
                    </p>
                    <Link to="/login" className="mt-6 block">
                        <Button variant="outline" className="w-full">Contact Sales</Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    <ul role="list" className="space-y-3 text-sm leading-6 text-gray-600">
                        <Feature>Unlimited Active Programs</Feature>
                        <Feature>Unlimited AI Interactions</Feature>
                        <Feature>Full Video & Voice Capabilities</Feature>
                        <Feature>Custom AI Tuning (Script & Weights)</Feature>
                        <Feature>ATS Integration (Workday, Taleo)</Feature>
                        <Feature>Dedicated Success Manager</Feature>
                        <Feature>99.9% Uptime SLA</Feature>
                    </ul>
                </CardContent>
            </Card>

          </div>
          
          {/* FAQ / Rationale */}
          <div className="mt-20 max-w-3xl mx-auto">
             <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h3>
             <div className="space-y-6">
                <FAQ 
                  q="What is an 'Active Program'?" 
                  a="An active program corresponds to a live Job Requisition (e.g., 'Tier 1 Tech Support - North America'). You can have unlimited candidates apply to a program. Archived or draft programs do not count towards your limit."
                />
                <FAQ 
                  q="Why don't you charge per interview?" 
                  a="We know BPO hiring funnels are wide. You shouldn't be penalized for screening 1,000 candidates to find the top 50. Our flat-rate model encourages you to use AI at the very top of the funnel to maximize efficiency."
                />
                <FAQ 
                  q="Can we switch plans seasonally?" 
                  a="Yes. BPO volume is cyclical. You can upgrade during ramp season and downgrade during steady states. Changes take effect at the start of the next billing cycle."
                />
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}