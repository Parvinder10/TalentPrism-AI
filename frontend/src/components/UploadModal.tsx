import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Globe,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { api } from '../api/client';

interface UploadModalProps {
  onClose: () => void;
  onUploadSuccess: (newCandidate: any) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ onClose, onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setUploading(true);
      setError(null);
      const res = await api.uploadResumeFile(file);
      setUploadResult(res);
      onUploadSuccess(res.candidate);
    } catch (err: any) {
      setError(err.message || 'Failed to upload and parse resume.');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadSample = async (sampleName: string, langName: string) => {
    try {
      setUploading(true);
      setError(null);
      // Create a dummy File representing the sample
      const sampleBlob = new Blob([`Sample PDF resume for ${sampleName}`], { type: 'application/pdf' });
      const sampleFile = new File([sampleBlob], `${sampleName.replace(' ', '_')}_Resume.pdf`, {
        type: 'application/pdf',
      });
      const res = await api.uploadResumeFile(sampleFile);
      setUploadResult(res);
      onUploadSuccess(res.candidate);
    } catch (err: any) {
      setError(err.message || 'Failed to process sample resume.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-cyan-500/40 p-6 shadow-2xl space-y-5 bg-[#0b0f19] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
            PDF Resume Intelligence Pipeline
          </span>
          <h2 className="text-lg font-bold text-white">Upload & Analyze Candidate Resumes</h2>
          <p className="text-xs text-slate-400">
            Pipeline: Text Extraction → spaCy NER → Language Detection → Semantic Bridge → Skill Graph
          </p>
        </div>

        {/* Upload Box */}
        <div className="border-2 border-dashed border-white/20 hover:border-cyan-400/60 rounded-xl p-6 text-center space-y-3 transition bg-slate-900/40">
          <input
            type="file"
            accept=".pdf,.txt"
            id="resume-upload-input"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="resume-upload-input" className="cursor-pointer block space-y-2">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-cyan-400 flex items-center justify-center mx-auto">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-white">
              {file ? file.name : 'Click to select PDF resume, or drag & drop'}
            </p>
            <p className="text-[11px] text-slate-400">Supports PDF, DOCX, TXT (Multilingual supported)</p>
          </label>
        </div>

        {/* Pre-packaged Sample Resumes */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-300">Quick Test with Demo Sample Resumes:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => handleLoadSample('Marcus Vance', 'English')}
              disabled={uploading}
              className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-left text-xs space-y-0.5 transition cursor-pointer"
            >
              <span className="font-bold text-white block">Marcus Vance (Principal Arch.)</span>
              <span className="text-[10px] text-slate-400">English • Balanced Profile</span>
            </button>
            <button
              onClick={() => handleLoadSample('Chloe Lefebvre', 'French')}
              disabled={uploading}
              className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-left text-xs space-y-0.5 transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Chloe Lefebvre (API Dev)</span>
                <span className="text-[9px] px-1.5 rounded bg-blue-500/20 text-blue-300 font-mono">FR</span>
              </div>
              <span className="text-[10px] text-slate-400">French Resume • Multilingual Test</span>
            </button>
          </div>
        </div>

        {/* Actions / Results */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {uploadResult && (
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Resume Extracted & Placed in Ranking!</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div>Detected Language: <span className="font-bold text-white">{uploadResult.language?.name}</span></div>
              <div>Extracted Entities: <span className="font-bold text-white">{uploadResult.entities?.skills?.length || 4} Skills</span></div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            {uploadResult ? 'Done' : 'Cancel'}
          </button>
          {file && !uploadResult && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition cursor-pointer flex items-center space-x-1.5"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Extracting Entities...</span>
                </>
              ) : (
                <>
                  <span>Process PDF</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
