import React, { useState, useEffect } from 'react';
import theme from '../theme';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Search, Edit2, Trash2, Share2, X, FileText, ChevronDown, ChevronUp, Save, Download } from 'lucide-react';

export default function Records() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [traineeFilter, setTraineeFilter] = useState('');
  const [postFilter, setPostFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Edit State
  const [editingRecord, setEditingRecord] = useState(null);
  const [editData, setEditData] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'observationTrainingReports'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetching records", err);
    }
    setLoading(false);
  };

  const uniqueTrainees = [...new Set(records.map(r => r.traineeName))].filter(Boolean).sort();
  const uniquePosts = [...new Set(records.map(r => r.observationPostName))].filter(Boolean).sort();
  const uniqueTypes = [...new Set(records.map(r => r.practiceType))].filter(Boolean).sort();

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק רשומה זו?')) return;
    try {
      await deleteDoc(doc(db, 'observationTrainingReports', id));
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Error deleting record", err);
    }
  };

  const handleExportWA = (r) => {
    const filledPreservation = r.preservationPoints ? r.preservationPoints.filter(p => p.trim() !== '') : [];
    const filledImprovement = r.improvementPoints ? r.improvementPoints.filter(p => p.trim() !== '') : [];

    const text = `🦉 *סיכום תרגול תצפית*

📅 *תאריך:* ${r.date}
🕒 *שעה:* ${r.time}
${r.formTypeName && r.formTypeName !== 'רגיל' ? `📋 *סוג טופס:* ${r.formTypeName}\n` : ''}👤 *שם התצפיתנית:* ${r.traineeName}
${r.tutorName ? `👤 *שם החונכת:* ${r.tutorName}\n` : ''}📍 *עמדת תצפית:* ${r.observationPostName}
${r.additionalObservationPost ? `📌 *תצפית נוספת:* ${r.additionalObservationPost}\n` : ''}${r.exerciseOutline ? `🎯 *מתווה התרגיל:*\n${r.exerciseOutline}\n\n` : ''}🤝 *כוחות משולבים:* ${r.jointForces ? 'כן' : 'לא'}
${r.jointForces && r.jointForcesDetails ? `*פירוט כוח:* ${r.jointForcesDetails} ${r.jointForcesFrameworkName ? `(מסגרת: ${r.jointForcesFrameworkName})` : ''}\n` : ''}🎭 *ביום אויב:* ${r.enemySimulation ? 'כן' : 'לא'}
🔦 *שימוש בסמן לייזר:* ${r.laserPointerUsage ? 'כן' : 'לא'}

${filledPreservation.length > 0 ? `✅ *נקודות לשימור:*\n${filledPreservation.map((p, i) => `${i+1}. ${p}`).join('\n')}\n\n` : ''}${filledImprovement.length > 0 ? `🔧 *נקודות לשיפור:*\n${filledImprovement.map((p, i) => `${i+1}. ${p}`).join('\n')}\n\n` : ''}${r.freeComments ? `📝 *הערות נוספות:*\n${r.freeComments}` : ''}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    
    const headers = ['תאריך', 'שעה', 'תצפיתנית', 'חונכת', 'עמדה', 'סוג תרגול', 'מתווה', 'נקודות לשימור', 'נקודות לשיפור', 'הערות'];
    const rows = filteredRecords.map(r => [
      r.date,
      r.time,
      r.traineeName,
      r.tutorName || '',
      r.observationPostName,
      r.practiceType || '',
      `"${(r.exerciseOutline || '').replace(/"/g, '""')}"`,
      `"${(r.preservationPoints || []).join(' ; ').replace(/"/g, '""')}"`,
      `"${(r.improvementPoints || []).join(' ; ').replace(/"/g, '""')}"`,
      `"${(r.freeComments || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `observation_owl_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startEdit = (r) => {
    setEditingRecord(r.id);
    setEditData({ ...r });
  };

  const saveEdit = async () => {
    try {
      await updateDoc(doc(db, 'observationTrainingReports', editingRecord), {
        ...editData,
        updatedAt: new Date()
      });
      setRecords(prev => prev.map(r => r.id === editingRecord ? { ...editData, id: editingRecord } : r));
      setEditingRecord(null);
      setEditData(null);
    } catch (err) {
      console.error("Error saving edit", err);
      alert('שגיאה בעדכון הרשומה');
    }
  };

  const filteredRecords = records.filter(r => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      (r.traineeName || '').toLowerCase().includes(term) ||
      (r.observationPostName || '').toLowerCase().includes(term) ||
      (r.formTypeName || '').toLowerCase().includes(term) ||
      (r.date || '').includes(term)
    );
    const matchesTrainee = traineeFilter ? r.traineeName === traineeFilter : true;
    const matchesPost = postFilter ? r.observationPostName === postFilter : true;
    const matchesType = typeFilter ? r.practiceType === typeFilter : true;
    
    return matchesSearch && matchesTrainee && matchesPost && matchesType;
  });

  if (editingRecord && editData) {
    return (
      <div className={theme.page.wrapper}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={theme.page.title}>עריכת רשומה</h2>
          <button onClick={() => setEditingRecord(null)} className="p-2"><X size={20}/></button>
        </div>
        
        <div className="space-y-4 bg-card p-4 rounded-xl shadow-md border border-border">
          <input type="text" placeholder="שם החונכת" value={editData.tutorName || ''} onChange={e => setEditData({...editData, tutorName: e.target.value})} className={theme.input.base} />
          <input type="text" placeholder="שם התצפיתנית" value={editData.traineeName} onChange={e => setEditData({...editData, traineeName: e.target.value})} className={theme.input.base} />
          <input type="date" value={editData.date} onChange={e => setEditData({...editData, date: e.target.value})} className={theme.input.base} />
          <textarea placeholder="מתווה" value={editData.exerciseOutline} onChange={e => setEditData({...editData, exerciseOutline: e.target.value})} className={theme.input.textarea} />
          
          <div className="space-y-2">
            <label className="text-sm text-secondary">לשימור</label>
            {[0,1,2].map(i => (
              <input key={i} type="text" value={editData.preservationPoints[i]} onChange={e => {
                const newArr = [...editData.preservationPoints];
                newArr[i] = e.target.value;
                setEditData({...editData, preservationPoints: newArr});
              }} className={theme.input.base} />
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-accent">לשיפור</label>
            {[0,1,2].map(i => (
              <input key={i} type="text" value={editData.improvementPoints[i]} onChange={e => {
                const newArr = [...editData.improvementPoints];
                newArr[i] = e.target.value;
                setEditData({...editData, improvementPoints: newArr});
              }} className={theme.input.base} />
            ))}
          </div>

          <button onClick={saveEdit} className={theme.button.save + " w-full h-12 mt-4"}>
            <Save size={20} className="ml-2"/> שמור שינויים
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={theme.page.wrapper}>
      <h2 className={theme.page.title}>📋 רשומות תרגול</h2>
      
      <div className="relative mb-4">
        <input 
          type="text" 
          placeholder="חיפוש לפי שם, תצפית, תאריך..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={theme.input.base + " pl-10"}
        />
        <Search className="absolute left-3 top-2.5 text-muted-foreground w-5 h-5" />
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold opacity-70">רשימת דיווחים ({filteredRecords.length})</h3>
        <button 
          onClick={handleExportCSV} 
          className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors"
        >
          <Download size={14} /> ייצוא CSV
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <select value={traineeFilter} onChange={e => setTraineeFilter(e.target.value)} className={theme.input.select + " py-1.5 text-xs"}>
          <option value="">כל המתורגלות</option>
          {uniqueTrainees.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={postFilter} onChange={e => setPostFilter(e.target.value)} className={theme.input.select + " py-1.5 text-xs"}>
          <option value="">כל העמדות</option>
          {uniquePosts.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={theme.input.select + " py-1.5 text-xs"}>
          <option value="">כל הסוגים</option>
          {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground">טוען נתונים...</p>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map(r => {
            const isExpanded = expandedId === r.id;
            return (
              <div key={r.id} className={theme.card.base + " p-0 overflow-hidden"}>
                {/* Header */}
                <div 
                  className="p-3 flex items-center justify-between cursor-pointer bg-card hover:bg-muted/10 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                >
                  <div className="flex flex-1 items-center gap-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-sm truncate">{r.traineeName}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{r.date}</span>
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded-sm">{r.observationPostName}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate hidden sm:block max-w-[40%]">{r.exerciseOutline}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 border-t border-border bg-muted/5 space-y-4">
                    <div className="space-y-2">
                      {r.tutorName && <p className="text-sm"><strong>חונכת:</strong> {r.tutorName}</p>}
                      {r.exerciseOutline && <p className="text-sm"><strong>מתווה:</strong> {r.exerciseOutline}</p>}
                      <p className="text-sm"><strong>כוחות משולבים:</strong> {r.jointForces ? `כן (${r.jointForcesDetails}${r.jointForcesFrameworkName ? ` - ${r.jointForcesFrameworkName}` : ''})` : 'לא'}</p>
                      <p className="text-sm"><strong>ביום אויב:</strong> {r.enemySimulation ? 'כן' : 'לא'}</p>
                      <p className="text-sm"><strong>סמן לייזר:</strong> {r.laserPointerUsage ? 'כן' : 'לא'}</p>
                      {r.additionalObservationPost && <p className="text-sm"><strong>תצפית נוספת:</strong> {r.additionalObservationPost}</p>}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-bold text-secondary mb-1">לשימור</p>
                        <ul className="text-xs list-disc list-inside space-y-1 text-muted-foreground">
                          {(r.preservationPoints || []).filter(p => p.trim() !== '').map((p, i) => <li key={i}>{p}</li>)}
                          {(r.preservationPoints || []).filter(p => p.trim() !== '').length === 0 && <li>אין</li>}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-accent mb-1">לשיפור</p>
                        <ul className="text-xs list-disc list-inside space-y-1 text-muted-foreground">
                          {(r.improvementPoints || []).filter(p => p.trim() !== '').map((p, i) => <li key={i}>{p}</li>)}
                          {(r.improvementPoints || []).filter(p => p.trim() !== '').length === 0 && <li>אין</li>}
                        </ul>
                      </div>
                    </div>

                    {r.freeComments && (
                      <p className="text-sm"><strong>הערות:</strong> {r.freeComments}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                      <button onClick={() => handleExportWA(r)} className={theme.button.save + " flex-1 py-2 text-xs"}>
                        <Share2 size={16} /> ייצוא
                      </button>
                      <button onClick={() => startEdit(r)} className={theme.button.ghost + " flex-1 py-2 text-xs bg-muted/30"}>
                        <Edit2 size={16} /> עריכה
                      </button>
                      <button onClick={() => handleDelete(r.id)} className={theme.button.danger + " flex-1 py-2 text-xs"}>
                        <Trash2 size={16} /> מחיקה
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {filteredRecords.length === 0 && !loading && (
            <div className={theme.empty.wrapper}>
              <FileText className={theme.empty.icon + " mx-auto"} />
              <p>לא נמצאו רשומות</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
