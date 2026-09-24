import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Globe,
  Sparkles,
  ArrowRight,
  Trash2,
  Plus,
  Layers,
  Check,
} from 'lucide-react';
import { api } from '../api/client';

interface UploadModalProps {
  onClose: () => void;
  onUploadSuccess: (newCandidates?: any) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ onClose, onUploadSuccess }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;
    setError(null);
    setUploadResult(null);

    const addedList: File[] = Array.from(newFiles);
    setFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const filteredNew = addedList.filter((f) => !existingNames.has(f.name));
      return [...prev, ...filteredNew];
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesSelected(e.target.files);
    // Reset file input so selecting the same file again works
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (files.length <= 1) {
      setUploadResult(null);
    }
  };

  const handleClearAll = () => {
    setFiles([]);
    setUploadResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    try {
      setUploading(true);
      setError(null);

      let res: any;
      if (files.length === 1) {
        res = await api.uploadResumeFile(files[0]);
        setUploadResult({
          uploaded_count: 1,
          candidates: [res.candidate],
          singleResult: res,
        });
        onUploadSuccess(res.candidate);
      } else {
        res = await api.uploadResumeFiles(files);
        setUploadResult(res);
        onUploadSuccess(res.candidates);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload and parse resumes. Please check files and try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadSampleBatch = async () => {
    try {
      setUploading(true);
      setError(null);
      setUploadResult(null);

      // Create 3 demo sample CV files
      const samples = [
        { name: 'Sarah_Chen_Senior_Backend.pdf', text: 'Senior Python Engineer with FastAPI, PostgreSQL, Docker, and Kubernetes' },
        { name: 'Julian_Muller_Cloud_Architect.pdf', text: 'Cloud Solutions Architect with AWS, Terraform, Docker, Python, and CI/CD' },
        { name: 'Amelie_Dubois_Fullstack_Dev.pdf', text: 'Fullstack Developer experienced in React, TypeScript, Python, and REST APIs' },
      ];

      const sampleFiles = samples.map(
        (s) => new File([new Blob([s.text], { type: 'application/pdf' })], s.name, { type: 'application/pdf' })
      );

      const res = await api.uploadResumeFiles(sampleFiles);
      setUploadResult(res);
      setFiles(sampleFiles);
      onUploadSuccess(res.candidates);
    } catch (err: any) {
      console.error('Sample batch load error:', err);
      setError(err.message || 'Failed to process sample resumes batch.');
    } finally {
      setUploading(false);
    }
  };

  const totalSizeKB = (files.reduce((acc, f) => acc + f.size, 0) / 1024).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-cyan-500/40 p-6 shadow-2xl space-y-4 bg-[#090d16] relative max-h-[92vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-mono">
                Multi-Resume Pipeline
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Batch Processing Engine
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Upload & Analyze Candidate CVs / Resumes</h2>
            <p className="text-xs text-slate-400">
              Select or drop multiple resumes at once. Our NLP engine extracts entities, evaluates evidence, and ranks candidates instantly.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Multi-File Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-2 ${
              dragOver
                ? 'border-cyan-400 bg-cyan-950/40 scale-[1.01]'
                : files.length > 0
                ? 'border-cyan-500/50 bg-slate-950/60'
                : 'border-white/20 bg-slate-950/70 hover:border-cyan-400/60 hover:bg-slate-900/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.docx,.md"
              id="resume-batch-upload-input"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 flex items-center justify-center mx-auto shadow-sm">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-200">
                Drag and drop <span className="text-cyan-400 underline underline-offset-2">multiple CVs/Resumes</span> here, or click to browse
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Select 1 or many files at once • Supports PDF, DOCX, TXT, and Markdown
              </p>
            </div>
          </div>

          {/* Selected Files Queue */}
          {files.length > 0 && (
            <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[11px] font-bold">
                    {files.length} {files.length === 1 ? 'Resume' : 'Resumes'} Selected
                  </span>
                  <span className="text-slate-400 text-[11px]">({totalSizeKB} KB total)</span>
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 text-[11px] font-semibold border border-white/10 flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-cyan-400" />
                    <span>Add More</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[11px] text-slate-400 hover:text-rose-400 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Files List */}
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 pt-1">
                {files.map((f, idx) => (
                  <div
                    key={`${f.name}_${idx}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/90 border border-white/5 text-xs hover:border-white/15 transition"
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="font-semibold text-slate-200 truncate">{f.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {(f.size / 1024).toFixed(1)} KB
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer ml-2"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Demo Batch Test */}
          <div className="space-y-2 bg-slate-950/40 p-3 rounded-xl border border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Quick Test with Multilingual Demo Sample Resumes:</span>
              </span>
              <button
                type="button"
                onClick={handleLoadSampleBatch}
                disabled={uploading}
                className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-400/30 text-[11px] font-bold transition cursor-pointer flex items-center space-x-1"
              >
                <Layers className="w-3 h-3 text-cyan-400" />
                <span>Upload 3 Demo Resumes at Once</span>
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Telemetry Results */}
          {uploadResult && (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2.5 text-xs shadow-sm">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    ✓ {uploadResult.uploaded_count || files.length} Resumes Analyzed & Integrated into Live Ranking!
                  </span>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Live in Pool
                </span>
              </div>

              {uploadResult.candidates && uploadResult.candidates.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-300">
                    Added to Candidate Intelligence:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {uploadResult.candidates.map((c: any, idx: number) => (
                      <div
                        key={c.id || idx}
                        className="p-2 rounded-lg bg-slate-900/90 border border-emerald-500/20 flex items-center justify-between"
                      >
                        <span className="font-bold text-white truncate">{c.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                          {c.language || 'EN'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
          >
            {uploadResult ? 'Close' : 'Cancel'}
          </button>

          {files.length > 0 && !uploadResult && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-500 hover:via-cyan-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-600/30 transition cursor-pointer flex items-center space-x-2 disabled:opacity-40"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>
                    Processing {files.length} {files.length === 1 ? 'Resume' : 'Resumes'} through NLP Engine...
                  </span>
                </>
              ) : (
                <>
                  <span>Process & Analyze {files.length} {files.length === 1 ? 'Resume' : 'Resumes'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}

          {uploadResult && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center space-x-1.5"
            >
              <span>View Updated Rankings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
