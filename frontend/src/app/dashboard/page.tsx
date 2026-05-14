"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, CheckCircle2, ArrowRight, Loader2,
  AlertCircle, Download, Briefcase, Zap, Star, ChevronRight, FileCheck2,
} from 'lucide-react';

const steps = [
  "Parsing resume...",
  "Analyzing job description...",
  "Extracting ATS keywords...",
  "Optimizing resume content...",
  "Finalizing documents...",
];

function ResumePreview({ resume }: { resume: any }) {
  if (!resume) return null;
  const pi = resume.personalInfo || {};
  return (
    <div className="liquid-glass-elevated p-10 space-y-7 font-serif text-sm leading-relaxed" style={{ color: '#1a1a2e' }}>
      <div className="text-center pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.5)' }}>
        <h1 className="text-2xl font-bold tracking-tight uppercase" style={{ letterSpacing: '0.05em', color: '#1a1a2e' }}>
          {pi.name || 'Candidate Name'}
        </h1>
        <p className="mt-2 text-xs" style={{ color: 'rgba(26,26,46,0.55)' }}>
          {[pi.email, pi.phone, pi.linkedin, pi.portfolio].filter(Boolean).join('  ·  ')}
        </p>
      </div>

      {resume.summary && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3 pb-1" style={{ color: 'rgba(26,26,46,0.5)', borderBottom: '1px solid rgba(255,255,255,0.4)' }}>Professional Summary</h2>
          <p style={{ color: '#1a1a2e' }}>{resume.summary}</p>
        </section>
      )}

      {resume.skills && resume.skills.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3 pb-1" style={{ color: 'rgba(26,26,46,0.5)', borderBottom: '1px solid rgba(255,255,255,0.4)' }}>Skills</h2>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((s: string, i: number) => <span key={i} className="glass-tag">{s}</span>)}
          </div>
        </section>
      )}

      {resume.experience && resume.experience.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 pb-1" style={{ color: 'rgba(26,26,46,0.5)', borderBottom: '1px solid rgba(255,255,255,0.4)' }}>Work Experience</h2>
          <div className="space-y-6">
            {resume.experience.map((exp: any, i: number) => (
              <div key={i}>
                <div className="flex items-start justify-between flex-wrap gap-1 mb-1">
                  <div>
                    <span className="font-bold" style={{ color: '#1a1a2e' }}>{exp.title}</span>
                    {exp.company && <span className="ml-1.5" style={{ color: 'rgba(26,26,46,0.55)' }}>— {exp.company}</span>}
                  </div>
                  <span className="text-xs italic whitespace-nowrap" style={{ color: 'rgba(26,26,46,0.45)' }}>{exp.startDate} – {exp.endDate || 'Present'}</span>
                </div>
                {exp.description && (
                  <ul className="mt-2 space-y-1.5">
                    {exp.description.map((b: string, j: number) => (
                      <li key={j} className="flex gap-2.5" style={{ color: 'rgba(26,26,46,0.8)' }}>
                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#0071e3' }} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {resume.education && resume.education.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 pb-1" style={{ color: 'rgba(26,26,46,0.5)', borderBottom: '1px solid rgba(255,255,255,0.4)' }}>Education</h2>
          <div className="space-y-3">
            {resume.education.map((edu: any, i: number) => (
              <div key={i} className="flex items-start justify-between flex-wrap gap-1">
                <div>
                  <span className="font-bold" style={{ color: '#1a1a2e' }}>{edu.degree}</span>
                  {edu.institution && <span className="ml-1.5" style={{ color: 'rgba(26,26,46,0.55)' }}>— {edu.institution}</span>}
                </div>
                {edu.year && <span className="text-xs italic" style={{ color: 'rgba(26,26,46,0.45)' }}>{edu.year}</span>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ScoreCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="liquid-glass p-6 flex flex-col items-center gap-1.5 flex-1 min-w-[130px]">
      <span className="text-4xl font-bold" style={{ color: accent }}>{value}%</span>
      <span className="text-xs text-center" style={{ color: 'rgba(26,26,46,0.55)' }}>{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimizedResume, setOptimizedResume] = useState<any>(null);
  const [scores, setScores] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'scores'>('preview');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.pdf') || f.name.endsWith('.docx'))) setFile(f);
  };

  const handleOptimize = async () => {
    if (!file || !jdText) return;
    setIsProcessing(true); setCurrentStep(0); setError(null);
    setIsComplete(false); setOptimizedResume(null); setScores(null);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    try {
      const formData = new FormData(); formData.append('resume', file);
      const uploadRes = await fetch(`${API_URL}/api/resume/upload`, { method: 'POST', body: formData });
      if (!uploadRes.ok) { const e = await uploadRes.json(); throw new Error(e.error || 'Failed to parse resume'); }
      const parsedResume = (await uploadRes.json()).data;

      setCurrentStep(1);
      const jdRes = await fetch(`${API_URL}/api/jd/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jdText }),
      });
      if (!jdRes.ok) { const e = await jdRes.json(); throw new Error(e.error || 'Failed to analyze JD'); }
      const analyzedJD = (await jdRes.json()).data;

      setCurrentStep(2); await new Promise(r => setTimeout(r, 600));

      setCurrentStep(3);
      const optimizeRes = await fetch(`${API_URL}/api/resume/optimize`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parsedResume, analyzedJD }),
      });
      if (!optimizeRes.ok) { const e = await optimizeRes.json(); throw new Error(e.error || 'Failed to optimize'); }
      const optimizeData = (await optimizeRes.json()).data;
      setOptimizedResume(optimizeData.optimizedResume);
      setScores(optimizeData.scores);

      setCurrentStep(4); await new Promise(r => setTimeout(r, 500));
      setIsProcessing(false); setIsComplete(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setIsProcessing(false);
    }
  };

  const handleDownload = async (format: 'pdf' | 'docx') => {
    if (!optimizedResume) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    try {
      const res = await fetch(`${API_URL}/api/resume/export`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optimizedResume, format }),
      });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `optimized_resume.${format}`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch { alert('Download failed. Please try again.'); }
  };

  return (
    <div className="min-h-screen relative" style={{ color: '#1a1a2e' }}>
      {/* Background */}
      <div className="glass-bg" />
      <div className="glass-orb glass-orb-1" />
      <div className="glass-orb glass-orb-2" />
      <div className="glass-orb glass-orb-3" />
      <div className="glass-orb glass-orb-4" />

      {/* Nav */}
      <nav className="liquid-glass-nav sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14 relative z-10">
          <a href="/" className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#1a1a2e', textDecoration: 'none' }}>
            <FileCheck2 className="w-4 h-4" style={{ color: '#0071e3' }} />
            TailorATS
          </a>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'rgba(0,113,227,0.18)', color: '#0071e3', border: '1px solid rgba(0,113,227,0.3)' }}>
            AI
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 space-y-6">

        <div>
          <h1 className="text-2xl font-bold" style={{ letterSpacing: '-0.02em', color: '#1a1a2e' }}>Resume Optimizer</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(26,26,46,0.55)' }}>AI-powered ATS tailoring in under a minute</p>
        </div>

        {/* Upload + JD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="liquid-glass p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="glass-step">1</div>
              <h2 className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>Upload Master Resume</h2>
            </div>
            <label
              htmlFor="resume-upload"
              className="flex flex-col items-center justify-center w-full h-40 rounded-2xl cursor-pointer transition-all duration-200"
              style={{
                background: isDragging ? 'rgba(0,113,227,0.05)' : '#f5f5f7',
                border: `2px dashed ${isDragging ? '#0071e3' : 'rgba(0,0,0,0.15)'}`,
                boxShadow: isDragging ? 'inset 0 0 0 1px #0071e3' : 'none',
              }}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <Upload className="w-7 h-7 mb-2.5" style={{ color: isDragging ? '#0071e3' : 'rgba(26,26,46,0.45)' }} />
              <p className="text-sm font-medium" style={{ color: '#1a1a2e' }}>{isDragging ? 'Drop it here' : 'Click to upload or drag & drop'}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(26,26,46,0.45)' }}>PDF or DOCX · max 5 MB</p>
              <input id="resume-upload" type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileUpload} />
            </label>
            {file && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                style={{ background: 'rgba(0,113,227,0.1)', color: '#0058b0', border: '1px solid rgba(0,113,227,0.2)' }}>
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span className="truncate font-medium">{file.name}</span>
              </div>
            )}
          </div>

          <div className="liquid-glass p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="glass-step">2</div>
              <h2 className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>Job Description</h2>
            </div>
            <textarea
              className="glass-input resize-none h-40"
              placeholder="Paste the target job description here..."
              value={jdText}
              onChange={e => setJdText(e.target.value)}
            />
          </div>
        </div>

        {/* Action */}
        <div className="flex justify-end">
          <button disabled={!file || !jdText || isProcessing} onClick={handleOptimize} className="glass-btn" style={{ fontSize: '14px' }}>
            {isProcessing
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Optimizing…</>
              : <><Zap className="w-4 h-4" /> Tailor My Resume <ArrowRight className="w-4 h-4" /></>
            }
          </button>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-error flex items-start gap-3 px-4 py-3.5 text-sm" style={{ color: '#b91c1c' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="liquid-glass p-8">
              <h3 className="text-sm font-semibold mb-6 flex items-center gap-2" style={{ color: '#1a1a2e' }}>
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#0071e3' }} />
                AI is tailoring your resume…
              </h3>
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                      style={{
                        background: index < currentStep ? 'rgba(48,164,108,0.1)' : index === currentStep ? 'rgba(0,113,227,0.1)' : '#f5f5f7',
                        border: `1px solid ${index < currentStep ? 'rgba(48,164,108,0.2)' : index === currentStep ? 'rgba(0,113,227,0.2)' : 'rgba(0,0,0,0.05)'}`,
                      }}>
                      {index < currentStep
                        ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#30a46c' }} />
                        : <div className="w-1.5 h-1.5 rounded-full" style={{ background: index === currentStep ? '#0071e3' : 'rgba(26,26,46,0.25)' }} />
                      }
                    </div>
                    <span className="text-sm" style={{ color: index <= currentStep ? '#1a1a2e' : 'rgba(26,26,46,0.45)' }}>{step}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {isComplete && optimizedResume && scores && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

              {/* Success banner */}
              <div className="glass-success flex items-center justify-between flex-wrap gap-4 px-6 py-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5" style={{ color: '#30a46c' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#166534' }}>Optimization complete!</p>
                    <p className="text-xs mt-0.5" style={{ color: '#15803d' }}>
                      ATS score: <strong>{scores.originalScore}%</strong> → <strong>{scores.optimizedScore}%</strong>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <button onClick={() => handleDownload('pdf')} className="glass-btn-ghost" style={{ fontSize: '12px', padding: '8px 16px' }}>
                    <Download className="w-3.5 h-3.5" /> PDF
                  </button>
                  <button onClick={() => handleDownload('docx')} className="glass-btn" style={{ fontSize: '12px', padding: '8px 16px' }}>
                    <Download className="w-3.5 h-3.5" /> DOCX
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="glass-segment-track w-fit">
                {(['preview', 'scores'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 text-xs font-medium transition-all duration-200 ${activeTab === tab ? 'glass-segment-active' : 'glass-segment-inactive'}`}>
                    {tab === 'preview' ? '📄 Resume Preview' : '📊 ATS Analysis'}
                  </button>
                ))}
              </div>

              {activeTab === 'preview' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <ResumePreview resume={optimizedResume} />
                </motion.div>
              )}

              {activeTab === 'scores' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="flex flex-wrap gap-4">
                    <ScoreCard label="Original ATS Score" value={scores.originalScore} accent="hsl(38 92% 45%)" />
                    <ScoreCard label="Optimized Score" value={scores.optimizedScore} accent="#30a46c" />
                    {scores.keywordMatchPercentage != null && (
                      <ScoreCard label="Keyword Match" value={scores.keywordMatchPercentage} accent="#0071e3" />
                    )}
                  </div>

                  {scores.missingKeywords && scores.missingKeywords.length > 0 && (
                    <div className="liquid-glass p-5">
                      <h4 className="text-xs font-semibold mb-3 flex items-center gap-2" style={{ color: '#1a1a2e' }}>
                        <Star className="w-3.5 h-3.5" style={{ color: 'hsl(38 92% 45%)' }} /> Missing Keywords
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {scores.missingKeywords.map((kw: string, i: number) => (
                          <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ background: 'rgba(234,179,8,0.12)', color: '#854d0e', border: '1px solid rgba(234,179,8,0.3)', backdropFilter: 'blur(10px)' }}>
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {scores.suggestions && scores.suggestions.length > 0 && (
                    <div className="liquid-glass p-5">
                      <h4 className="text-xs font-semibold mb-3 flex items-center gap-2" style={{ color: '#1a1a2e' }}>
                        <Briefcase className="w-3.5 h-3.5" style={{ color: '#0071e3' }} /> AI Suggestions
                      </h4>
                      <ul className="space-y-2.5">
                        {scores.suggestions.map((s: string, i: number) => (
                          <li key={i} className="flex gap-2.5 text-sm" style={{ color: 'rgba(26,26,46,0.75)' }}>
                            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#0071e3' }} />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
