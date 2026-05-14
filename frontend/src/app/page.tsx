import Link from 'next/link';
import { ArrowRight, FileCheck2, Zap, Target, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative" style={{ color: '#1a1a2e' }}>

      {/* Animated background */}
      <div className="glass-bg" />
      <div className="glass-orb glass-orb-1" />
      <div className="glass-orb glass-orb-2" />
      <div className="glass-orb glass-orb-3" />
      <div className="glass-orb glass-orb-4" />

      {/* Nav */}
      <nav className="liquid-glass-nav sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-14 relative z-10">
          <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: '#1a1a2e' }}>
            <FileCheck2 className="w-4 h-4" style={{ color: '#0071e3' }} />
            TailorATS
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm font-medium px-3 py-1.5 rounded-full transition-colors" style={{ color: 'rgba(26,26,46,0.65)' }}>
              Sign in
            </Link>
            <Link href="/dashboard" className="glass-btn text-sm" style={{ padding: '8px 20px', fontSize: '14px' }}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 relative z-10 flex flex-col items-center">

        {/* Hero */}
        <section className="w-full flex flex-col items-center text-center pt-24 pb-20 px-6">

          {/* Badge */}
          <div className="glass-pill mb-8">
            <span className="pulse-dot"><span className="pulse-dot-inner" /></span>
            Powered by Gemini AI
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight max-w-3xl mb-6" style={{ letterSpacing: '-0.03em', color: '#1a1a2e' }}>
            Beat the ATS.<br />
            <span className="glass-shimmer-text">Land More Interviews.</span>
          </h1>

          <p className="text-lg sm:text-xl max-w-xl mb-10 leading-relaxed" style={{ color: 'rgba(26,26,46,0.62)' }}>
            Upload your resume and a job description. Our AI tailors your resume for ATS systems — without altering your truth.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link href="/dashboard" className="glass-btn text-base" style={{ padding: '13px 32px' }}>
              Optimize My Resume <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/dashboard" className="glass-btn-ghost text-base" style={{ padding: '12px 32px' }}>
              See how it works
            </Link>
          </div>

          <p className="mt-6 text-xs" style={{ color: 'rgba(26,26,46,0.42)' }}>
            Free to try · No account required · Results in under 60 seconds
          </p>
        </section>

        {/* Feature cards */}
        <section className="w-full max-w-5xl px-6 pb-28">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: <Zap className="w-6 h-6" />, iconBg: 'rgba(0,113,227,0.15)', iconColor: '#0071e3', title: 'Instant Analysis', desc: 'Extracts the exact ATS keywords from any job description in seconds.' },
              { icon: <Target className="w-6 h-6" />, iconBg: 'rgba(48,164,108,0.15)', iconColor: '#30a46c', title: 'Smart Tailoring', desc: 'Rewrites your summary and bullets to perfectly align with the role.' },
              { icon: <Shield className="w-6 h-6" />, iconBg: 'rgba(142,78,198,0.15)', iconColor: '#8e4ec6', title: 'Truth Preserved', desc: 'Companies, titles, and education are never changed. Only enhanced.' },
            ].map((f) => (
              <div key={f.title} className="liquid-glass p-7 transition-transform duration-300 hover:-translate-y-1 cursor-default">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: f.iconBg, color: f.iconColor }}>
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold mb-2" style={{ color: '#1a1a2e' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(26,26,46,0.6)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="w-full px-6 pb-24">
          <div className="max-w-5xl mx-auto">
            <div className="liquid-glass-elevated p-12">
              <div className="text-center mb-12">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(26,26,46,0.5)' }}>Simple Process</p>
                <h2 className="text-3xl sm:text-4xl font-bold" style={{ letterSpacing: '-0.02em', color: '#1a1a2e' }}>
                  Three steps to a tailored resume
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
                {[
                  { step: '1', title: 'Upload your resume', desc: 'Upload your master PDF or DOCX. AI parses every detail accurately.' },
                  { step: '2', title: 'Paste job description', desc: 'Copy any job posting. We extract every keyword the ATS is scanning for.' },
                  { step: '3', title: 'Download tailored CV', desc: 'Get your optimized resume in PDF or DOCX, ready to submit instantly.' },
                ].map((s) => (
                  <div key={s.step} className="flex flex-col items-start gap-4">
                    <div className="glass-step">{s.step}</div>
                    <div>
                      <h3 className="text-sm font-semibold mb-1" style={{ color: '#1a1a2e' }}>{s.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: 'rgba(26,26,46,0.58)' }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="w-full px-6 pb-24 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ letterSpacing: '-0.02em', color: '#1a1a2e' }}>
              Ready to get more interviews?
            </h2>
            <p className="text-base mb-8" style={{ color: 'rgba(26,26,46,0.6)' }}>
              Join thousands of job seekers who optimized their resume with TailorATS.
            </p>
            <Link href="/dashboard" className="glass-btn text-base" style={{ padding: '13px 36px' }}>
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="relative z-10" style={{ borderTop: '1px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-5xl mx-auto px-6 py-7 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#1a1a2e' }}>
            <FileCheck2 className="w-4 h-4" style={{ color: '#0071e3' }} />
            TailorATS
          </div>
          <p className="text-xs" style={{ color: 'rgba(26,26,46,0.45)' }}>
            © {new Date().getFullYear()} TailorATS · Built with Gemini AI
          </p>
        </div>
      </footer>
    </div>
  );
}
