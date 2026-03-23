/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  FileCheck, 
  Clock, 
  Share2, 
  Wallet, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink,
  History,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import confetti from 'canvas-confetti';

// Utils
import { generateKey, exportKey, encryptData, hashData, bufferToBase64 } from './utils/crypto';
import { uploadToIPFS } from './utils/ipfs';
import { connectWallet, registerOnChain } from './utils/blockchain';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProofRecord {
  id: string;
  title: string;
  hash: string;
  cid: string;
  timestamp: number;
  txHash: string;
  key: string;
}

export default function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [history, setHistory] = useState<ProofRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'register' | 'history'>('register');

  // Form state
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    const savedHistory = localStorage.getItem('aetheris_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveToHistory = (record: ProofRecord) => {
    const newHistory = [record, ...history];
    setHistory(newHistory);
    localStorage.setItem('aetheris_history', JSON.stringify(newHistory));
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      const { address, signer } = await connectWallet();
      setAddress(address);
      setSigner(signer);
    } catch (err: any) {
      alert(err.message || "Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    if (!content || !title) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      setStatus('Generating local encryption keys...');
      const key = await generateKey();
      const keyStr = await exportKey(key);

      setStatus('Encrypting content locally...');
      const { encrypted, iv } = await encryptData(content, key);
      
      setStatus('Generating content hash...');
      const hash = await hashData(encrypted);

      setStatus('Uploading encrypted package to IPFS...');
      const payload = {
        encrypted: bufferToBase64(encrypted),
        iv: bufferToBase64(iv.buffer),
        hash: hash,
        title: title,
        timestamp: Date.now()
      };
      const cid = await uploadToIPFS(payload, title);

      setStatus('Registering proof on Polygon blockchain...');
      const tx = await registerOnChain(signer, hash, cid);

      const record: ProofRecord = {
        id: Math.random().toString(36).substring(7),
        title,
        hash,
        cid,
        timestamp: Date.now(),
        txHash: tx.hash,
        key: keyStr
      };

      saveToHistory(record);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      setContent('');
      setTitle('');
      setStatus('');
      setActiveTab('history');
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-md bg-black/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Shield className="text-black w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">AETHERIS</h1>
              <p className="text-[10px] text-emerald-500 font-mono tracking-widest uppercase opacity-80">Decentralized Protocol</p>
            </div>
          </div>

          <button 
            onClick={handleConnect}
            disabled={loading}
            className={cn(
              "px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 border",
              address 
                ? "bg-white/5 border-white/10 text-emerald-400" 
                : "bg-emerald-500 text-black border-emerald-400 hover:scale-105 active:scale-95"
            )}
          >
            <Wallet size={18} />
            {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : "Connect Wallet"}
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4 tracking-tight"
          >
            Sovereignty in every <span className="text-emerald-500">byte</span>.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/60 text-lg max-w-2xl mx-auto"
          >
            Register proofs of existence, seal content in time, and share access with absolute privacy on the Polygon network.
          </motion.p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-2xl w-fit mx-auto border border-white/5">
          <button 
            onClick={() => setActiveTab('register')}
            className={cn(
              "px-6 py-2 rounded-xl transition-all flex items-center gap-2",
              activeTab === 'register' ? "bg-emerald-500 text-black font-bold" : "text-white/60 hover:text-white"
            )}
          >
            <Plus size={18} />
            Register Proof
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={cn(
              "px-6 py-2 rounded-xl transition-all flex items-center gap-2",
              activeTab === 'history' ? "bg-emerald-500 text-black font-bold" : "text-white/60 hover:text-white"
            )}
          >
            <History size={18} />
            My Records
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'register' ? (
            <motion.div 
              key="register"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl"
            >
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/60 ml-1 flex items-center gap-2">
                    <FileCheck size={14} /> Record Title
                  </label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g. Intellectual Property #42"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/60 ml-1 flex items-center gap-2">
                    <Lock size={14} /> Content to Encrypt
                  </label>
                  <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter the sensitive information or document text here..."
                    rows={6}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center gap-2">
                    <Shield className="text-emerald-500" size={24} />
                    <span className="text-xs font-bold uppercase tracking-tighter">Local Encryption</span>
                    <p className="text-[10px] text-white/40">Keys never leave your device</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center gap-2">
                    <Clock className="text-blue-400" size={24} />
                    <span className="text-xs font-bold uppercase tracking-tighter">Time Sealing</span>
                    <p className="text-[10px] text-white/40">Immutable Polygon timestamp</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center gap-2">
                    <Share2 className="text-purple-400" size={24} />
                    <span className="text-xs font-bold uppercase tracking-tighter">Access Control</span>
                    <p className="text-[10px] text-white/40">Share via encrypted links</p>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading || !address}
                  className={cn(
                    "w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3",
                    loading || !address 
                      ? "bg-white/10 text-white/30 cursor-not-allowed" 
                      : "bg-emerald-500 text-black hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      {status || "Processing..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 />
                      Register Proof of Existence
                    </>
                  )}
                </button>
                
                {!address && (
                  <p className="text-center text-sm text-amber-400/80 flex items-center justify-center gap-2">
                    <AlertCircle size={14} /> Please connect your wallet to interact with the protocol
                  </p>
                )}
              </form>
            </motion.div>
          ) : (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {history.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                  <History size={48} className="mx-auto mb-4 text-white/20" />
                  <p className="text-white/40">No records found yet.</p>
                </div>
              ) : (
                history.map((record) => (
                  <div key={record.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-emerald-400">{record.title}</h3>
                        <p className="text-xs text-white/40 font-mono">
                          {new Date(record.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(record.key);
                            alert("Encryption key copied to clipboard!");
                          }}
                          className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-white/60 hover:text-white"
                          title="Copy Encryption Key"
                        >
                          <Lock size={16} />
                        </button>
                        <button 
                          onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${record.cid}`, '_blank')}
                          className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-white/60 hover:text-white"
                          title="View on IPFS"
                        >
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Content Hash (SHA-256)</span>
                        <div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-white/5">
                          <code className="text-[10px] text-emerald-500/80 truncate flex-1">{record.hash}</code>
                          <Copy size={12} className="text-white/20 cursor-pointer hover:text-white" onClick={() => navigator.clipboard.writeText(record.hash)} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Blockchain Proof</span>
                        <div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-white/5">
                          <code className="text-[10px] text-blue-400/80 truncate flex-1">{record.txHash}</code>
                          <ExternalLink size={12} className="text-white/20 cursor-pointer hover:text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-xs text-emerald-500/60">
                        <CheckCircle2 size={14} />
                        Verified on Polygon
                      </div>
                      <button className="text-xs font-bold text-white/60 hover:text-white flex items-center gap-1 transition-all">
                        Share Access <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-white/5 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-40">
            <Shield size={16} />
            <span className="text-xs font-mono tracking-tighter">AETHERIS PROTOCOL v1.0.0-MVP</span>
          </div>
          <div className="flex gap-8 text-xs text-white/40">
            <a href="#" className="hover:text-emerald-500 transition-colors">Documentation</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Smart Contract</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
