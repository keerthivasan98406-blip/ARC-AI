import React, { useState } from 'react';
import { AdminMetrics, SystemLog } from '../types';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'users'>('overview');

  const metrics: AdminMetrics = {
    totalUsers: 14290,
    activeChats: 842,
    tokenRequests: 1420500,
    storageFootprintGB: 4.8,
    apiLatencyMs: 120,
    errorCount24h: 3,
  };

  const logs: SystemLog[] = [
    {
      id: 'log-1',
      timestamp: '2026-08-07 14:05:12',
      level: 'info',
      service: 'MultiModelGateway',
      message: 'Routed prompt session to Claude 3.5 Sonnet engine successfully [Latency: 112ms]',
    },
    {
      id: 'log-2',
      timestamp: '2026-08-07 14:02:44',
      level: 'info',
      service: 'VectorMemoryDB',
      message: 'Indexed 4 long-term context preference vectors for user session #usr_8921',
    },
    {
      id: 'log-3',
      timestamp: '2026-08-07 13:58:19',
      level: 'warn',
      service: 'WebIntelligence',
      message: 'Web search rate limit warning on fallback provider; shifted to secondary engine',
    },
    {
      id: 'log-4',
      timestamp: '2026-08-07 13:45:00',
      level: 'info',
      service: 'OCRVisionService',
      message: 'Extracted text from 4.2MB PDF document in 480ms',
    },
  ];

  const usersList = [
    { id: 'usr-1', name: 'Alex Rivera', email: 'alex@neural.ai', role: 'Super Admin', status: 'Active', tokens: '240K' },
    { id: 'usr-2', name: 'Elena Rostova', email: 'elena@dev.io', role: 'Developer', status: 'Active', tokens: '185K' },
    { id: 'usr-3', name: 'Marcus Chen', email: 'marcus@synth.com', role: 'Enterprise', status: 'Active', tokens: '510K' },
    { id: 'usr-4', name: 'Sarah Connor', email: 'sarah@skynet.org', role: 'User', status: 'Active', tokens: '42K' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md modal-backdrop animate-fade-in-up duration-200">
      <div className="w-full max-w-5xl h-[85vh] glass-elevated rounded-3xl border border-cyan-500/30 p-6 flex flex-col justify-between shadow-2xl overflow-hidden relative animate-fade-in-scale">
        <div className="flex items-center justify-between pb-4 border-b border-white/12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg animate-orb-pulse">
              <i className="fas fa-chart-line text-lg" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display tracking-tight">
                Arc AI Admin Analytics
              </h2>
              <p className="text-xs text-slate-400">
                Real-time telemetric monitoring, token metrics & system console logs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-900/80 p-1 rounded-xl border border-white/12">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                  activeTab === 'overview' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <i className="fas fa-tachometer-alt mr-1.5" />
                Metrics Overview
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                  activeTab === 'logs' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <i className="fas fa-terminal mr-1.5" />
                System Logs
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                  activeTab === 'users' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <i className="fas fa-users mr-1.5" />
                User Directory
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full glass-button text-slate-400 hover:text-white flex items-center justify-center transition-colors duration-300"
            >
              <i className="fas fa-times" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto my-4 pr-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Total Users', value: metrics.totalUsers.toLocaleString(), icon: 'fa-users', color: 'text-cyan-400' },
                  { label: 'Active Chats', value: metrics.activeChats, icon: 'fa-comments', color: 'text-emerald-400' },
                  { label: 'Token Requests', value: '1.42 M', icon: 'fa-microchip', color: 'text-purple-400' },
                  { label: 'Storage Footprint', value: `${metrics.storageFootprintGB} GB`, icon: 'fa-database', color: 'text-amber-400' },
                  { label: 'API Latency', value: `${metrics.apiLatencyMs} ms`, icon: 'fa-bolt', color: 'text-blue-400' },
                  { label: '24h Error Rate', value: `${metrics.errorCount24h} (0.01%)`, icon: 'fa-shield-alt', color: 'text-slate-400' },
                ].map((stat, i) => (
                  <div key={i} className="glass-card p-3.5 rounded-2xl border border-white/12 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                        {stat.label}
                      </span>
                      <i className={`fas ${stat.icon} text-xs ${stat.color}`} />
                    </div>
                    <p className={`text-base font-extrabold font-display tracking-tight ${stat.color}`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="glass-card p-5 rounded-2xl border border-white/12 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white font-display tracking-tight">Engine Traffic Distribution</h4>
                    <span className="text-[10px] text-cyan-400 font-mono tracking-wide">Real-time</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { name: 'Claude 3.5 Sonnet', pct: '42%', color: 'bg-purple-500' },
                      { name: 'OpenAI GPT-5', pct: '30%', color: 'bg-blue-500' },
                      { name: 'Google Gemini 1.5 Pro', pct: '15%', color: 'bg-cyan-400' },
                      { name: 'DeepSeek V3 / R1', pct: '8%', color: 'bg-emerald-400' },
                      { name: 'Meta Llama 3.3 70B', pct: '5%', color: 'bg-orange-500' },
                    ].map((eng) => (
                      <div key={eng.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span>{eng.name}</span>
                          <span className="font-mono font-bold text-cyan-300">{eng.pct}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                          <div className={`h-full ${eng.color} rounded-full`} style={{ width: eng.pct }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-white/12 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white font-display tracking-tight">System Diagnostics & Health</h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                      ALL SYSTEMS OPERATIONAL
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">WebSocket Cluster</span>
                      <p className="text-xs font-bold text-emerald-400">99.98% Uptime</p>
                    </div>
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Memory Vector Store</span>
                      <p className="text-xs font-bold text-cyan-400">Connected (0.4ms)</p>
                    </div>
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Live Search Cache</span>
                      <p className="text-xs font-bold text-purple-400">88.4% Hit Rate</p>
                    </div>
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Image Studio Worker</span>
                      <p className="text-xs font-bold text-amber-400">Idle (Ready)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="glass-card p-4 rounded-2xl border border-white/12 space-y-3 bg-slate-950/90 font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-white/12 text-xs text-slate-400">
                <span>Timestamp</span>
                <span>Level</span>
                <span>Service Component</span>
                <span className="w-1/2">Console Output</span>
              </div>
              <div className="space-y-2 text-xs">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between py-1.5 border-b border-white/5 hover:bg-white/5 px-2 rounded transition-colors duration-300">
                    <span className="text-slate-500 text-[11px]">{log.timestamp}</span>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${log.level === 'error' ? 'bg-red-500/20 text-red-400' : log.level === 'warn' ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
                      {log.level}
                    </span>
                    <span className="text-purple-300 font-semibold">{log.service}</span>
                    <span className="w-1/2 text-slate-200 truncate">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="glass-card p-4 rounded-2xl border border-white/12 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/12 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="pb-2">User</th>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Role</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Token Usage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors duration-300">
                      <td className="py-2.5 font-bold text-white font-display tracking-tight">{u.name}</td>
                      <td className="py-2.5 text-slate-400">{u.email}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px]">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 text-emerald-400 font-semibold">{u.status}</td>
                      <td className="py-2.5 font-mono text-purple-300">{u.tokens}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
