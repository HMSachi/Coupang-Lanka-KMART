import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MOCK_SALES_DATA = [
  { name: 'Mon', sales: 45000 },
  { name: 'Tue', sales: 32000 },
  { name: 'Wed', sales: 58000 },
  { name: 'Thu', sales: 41000 },
  { name: 'Fri', sales: 85000 },
  { name: 'Sat', sales: 124000 },
  { name: 'Sun', sales: 98000 },
];

export default function SalesAnalytics() {
  return (
    <div className="panel chart-panel">
      <div className="panel-header">
        <h2>Sales Analytics</h2>
        <select className="filter-select">
          <option>This Week</option>
          <option>This Month</option>
        </select>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={MOCK_SALES_DATA}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} dx={-10} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Line type="smooth" dataKey="sales" stroke="#0f5f8c" strokeWidth={3} dot={{r: 4, fill: '#0f5f8c', strokeWidth: 2, stroke: '#fff'}} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
