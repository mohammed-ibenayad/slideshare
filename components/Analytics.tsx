import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const data = [
  { name: 'Mon', views: 4000, unique: 2400 },
  { name: 'Tue', views: 3000, unique: 1398 },
  { name: 'Wed', views: 2000, unique: 9800 },
  { name: 'Thu', views: 2780, unique: 3908 },
  { name: 'Fri', views: 1890, unique: 4800 },
  { name: 'Sat', views: 2390, unique: 3800 },
  { name: 'Sun', views: 3490, unique: 4300 },
];

const slideData = [
    { name: 'Slide 1', seconds: 120 },
    { name: 'Slide 2', seconds: 45 },
    { name: 'Slide 3', seconds: 200 }, // High engagement
    { name: 'Slide 4', seconds: 60 },
    { name: 'Slide 5', seconds: 30 },
];

export const Analytics: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Performance Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm dark:shadow-none">
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Total Views</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">24.5k</h3>
                <span className="text-green-500 text-sm">+12% this week</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm dark:shadow-none">
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Avg. Completion Rate</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">78%</h3>
                <span className="text-indigo-500 text-sm">Top 5% of creators</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm dark:shadow-none">
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Shares</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">1,203</h3>
                <span className="text-slate-500 text-sm">Via Direct Link</span>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-lg dark:shadow-none">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Audience Growth</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                            />
                            <Line type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="unique" stroke="#10b981" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-lg dark:shadow-none">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Engagement by Slide</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={slideData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                            <Bar dataKey="seconds" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>
  );
};