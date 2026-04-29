import React, { useState, useEffect } from 'react';
import theme from '../theme';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Activity, Target, Shield, Users, Crosshair, AlertTriangle, Calendar } from 'lucide-react';

export default function Dashboard() {
  const [records, setRecords] = useState([]);
  const [postsCount, setPostsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [daysFilter, setDaysFilter] = useState(30);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [useCustomDates, setUseCustomDates] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'observationTrainingReports'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setRecords(snap.docs.map(d => d.data()));

        const pSnap = await getDocs(collection(db, 'observationPosts'));
        setPostsCount(pSnap.docs.filter(d => d.data().active).length);
      } catch (err) {
        console.error("Error fetching dashboard data", err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const getFilteredRecords = () => {
    if (useCustomDates && fromDate && toDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      return records.filter(r => {
        const rDate = new Date(r.date);
        return rDate >= start && rDate <= end;
      });
    } else {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysFilter);
      return records.filter(r => new Date(r.date) >= cutoff);
    }
  };

  const filtered = getFilteredRecords();

  // KPIs
  const totalForms = filtered.length;
  
  const postCounts = filtered.reduce((acc, r) => {
    acc[r.observationPostName] = (acc[r.observationPostName] || 0) + 1;
    return acc;
  }, {});
  const mostTrainedPost = Object.keys(postCounts).sort((a,b) => postCounts[b] - postCounts[a])[0] || 'אין נתונים';

  const jointForcesCount = filtered.filter(r => r.jointForces).length;
  const jointForcesPct = totalForms ? Math.round((jointForcesCount / totalForms) * 100) : 0;

  const enemySimCount = filtered.filter(r => r.enemySimulation).length;
  const enemySimPct = totalForms ? Math.round((enemySimCount / totalForms) * 100) : 0;

  const COLORS = ['#4ade80', '#a78bfa', '#fbbf24', '#f472b6', '#38bdf8', '#818cf8', '#34d399'];

  // Chart Data: Stacked Bar by Post
  const uniqueFormTypes = [...new Set(filtered.map(r => r.formTypeName))];
  const postDataMap = {};
  filtered.forEach(r => {
    const post = r.observationPostName || 'כללי';
    const type = r.formTypeName || 'רגיל';
    if (!postDataMap[post]) postDataMap[post] = { name: post, total: 0 };
    postDataMap[post][type] = (postDataMap[post][type] || 0) + 1;
    postDataMap[post].total += 1;
  });
  const barData = Object.values(postDataMap).sort((a, b) => b.total - a.total);

  // Chart Data: Donut by Form Type
  const typeCounts = filtered.reduce((acc, r) => {
    acc[r.formTypeName] = (acc[r.formTypeName] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.keys(typeCounts).map(k => ({ name: k, value: typeCounts[k] }));

  // Recent improvement points
  const recentImprovements = filtered.slice(0, 10).flatMap(r => r.improvementPoints || []).filter(p => p && p.trim()).slice(0, 5);

  const handleQuickFilter = (days) => {
    setUseCustomDates(false);
    setDaysFilter(days);
  };

  return (
    <div className={theme.page.wrapper}>
      <h2 className={theme.page.title}>📊 דשבורד מפקדים</h2>
      
      {/* Filters */}
      <div className="bg-card p-3 rounded-xl mb-6 shadow-sm border border-border">
        <div className="flex gap-2 overflow-x-auto pb-3 mb-3 border-b border-border">
          {[7, 30, 90].map(d => (
            <button 
              key={d}
              onClick={() => handleQuickFilter(d)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${!useCustomDates && daysFilter === d ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              {d} ימים
            </button>
          ))}
          <button 
            onClick={() => setUseCustomDates(true)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${useCustomDates ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            <Calendar size={12} />
            מותאם אישית
          </button>
        </div>
        
        {useCustomDates && (
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] text-muted-foreground">מתאריך</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className={theme.input.base + " py-1 text-xs"} />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[10px] text-muted-foreground">עד תאריך</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className={theme.input.base + " py-1 text-xs"} />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground">טוען נתונים...</p>
      ) : (
        <div className="space-y-6">
          
          {/* KPI Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className={theme.statCard.wrapper}>
              <div className={theme.statCard.content}>
                <div className={theme.statCard.iconBase + " bg-primary/20 text-primary"}><Activity size={20}/></div>
                <div>
                  <p className={theme.statCard.value}>{totalForms}</p>
                  <p className={theme.statCard.labelText}>סה״כ תרגולים</p>
                </div>
              </div>
            </div>
            
            <div className={theme.statCard.wrapper}>
              <div className={theme.statCard.content}>
                <div className={theme.statCard.iconBase + " bg-secondary/20 text-secondary"}><Target size={20}/></div>
                <div>
                  <p className={theme.statCard.value}>{mostTrainedPost}</p>
                  <p className={theme.statCard.labelText}>תצפית מובילה</p>
                </div>
              </div>
            </div>

            <div className={theme.statCard.wrapper}>
              <div className={theme.statCard.content}>
                <div className={theme.statCard.iconBase + " bg-accent/20 text-accent"}><Users size={20}/></div>
                <div>
                  <p className={theme.statCard.value}>{jointForcesPct}%</p>
                  <p className={theme.statCard.labelText}>כוחות משולבים</p>
                </div>
              </div>
            </div>

            <div className={theme.statCard.wrapper}>
              <div className={theme.statCard.content}>
                <div className={theme.statCard.iconBase + " bg-destructive/20 text-destructive"}><Crosshair size={20}/></div>
                <div>
                  <p className={theme.statCard.value}>{enemySimPct}%</p>
                  <p className={theme.statCard.labelText}>ביום אויב</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className={theme.card.base + " p-4"}>
            <h3 className="font-bold mb-4 text-sm text-center">התפלגות לפי עמדת תצפית וסוג טופס</h3>
            <div className="h-64" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={barData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1c2541', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  {uniqueFormTypes.map((type, idx) => (
                    <Bar 
                      key={type} 
                      dataKey={type} 
                      stackId="a" 
                      fill={COLORS[idx % COLORS.length]} 
                      name={type}
                    />
                  ))}
                  {/* Invisible line just to show the total on top */}
                  <Line type="monotone" dataKey="total" stroke="none" label={{ position: 'top', fill: '#ccc', fontSize: 12, fontWeight: 'bold' }} activeDot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={theme.card.base + " p-4"}>
            <h3 className="font-bold mb-4 text-sm">סוגי טפסים</h3>
            <div className="h-48" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1c2541', border: 'none', borderRadius: '8px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  {entry.name} ({entry.value})
                </div>
              ))}
            </div>
          </div>

          {/* Recent improvements */}
          <div className={theme.card.base + " p-4"}>
            <h3 className="font-bold mb-4 text-sm text-accent flex items-center gap-2">
              <AlertTriangle size={16}/> נקודות אחרונות לשיפור
            </h3>
            <ul className="space-y-2">
              {recentImprovements.map((p, i) => (
                <li key={i} className="text-sm bg-muted/20 p-2 rounded-lg text-muted-foreground flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span> {p}
                </li>
              ))}
              {recentImprovements.length === 0 && <li className="text-sm text-muted-foreground">אין נתונים</li>}
            </ul>
          </div>

        </div>
      )}
    </div>
  );
}
