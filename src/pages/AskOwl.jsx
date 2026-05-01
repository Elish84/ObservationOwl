import React, { useState, useEffect } from 'react';
import theme from '../theme';
import { functions, db } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, getDocs } from 'firebase/firestore';
import { MessageSquare, Send, Sparkles, Bird, Share2 } from 'lucide-react';

export default function AskOwl() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  
  // Filters
  const [traineeFilter, setTraineeFilter] = useState('');
  const [postFilter, setPostFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [customContext, setCustomContext] = useState('');

  useEffect(() => {
    const fetchMeta = async () => {
      const snap = await getDocs(collection(db, 'observationTrainingReports'));
      setRecords(snap.docs.map(d => d.data()));
    };
    fetchMeta();
  }, []);

  const uniqueTrainees = [...new Set(records.map(r => r.traineeName))].filter(Boolean).sort();
  const uniquePosts = [...new Set(records.map(r => r.observationPostName))].filter(Boolean).sort();
  const uniqueTypes = [...new Set(records.map(r => r.practiceType))].filter(Boolean).sort();

  const chips = [
    "מה הנקודות לשיפור שחוזרות הכי הרבה?",
    "באיזו תצפית היו הכי הרבה תרגולים?",
    "אילו דפוסים חוזרים קיימים בתרגולי יום אויב?",
    "תן לי סיכום מנהלים לחודש האחרון.",
    "מה כדאי לשפר בתרגולים הבאים?"
  ];

  const handleAsk = async (qText) => {
    const textToAsk = qText || question;
    if (!textToAsk.trim()) return;

    setLoading(true);
    setAnswer('');
    setQuestion(textToAsk);

    try {
      const askOwlFn = httpsCallable(functions, 'askOwl');
      const result = await askOwlFn({ 
        question: textToAsk, 
        filters: {
          trainee: traineeFilter,
          post: postFilter,
          type: typeFilter,
          customContext: customContext
        } 
      });
      if (result.data.error) {
        setAnswer(result.data.error);
      } else {
        setAnswer(result.data.answer);
      }
    } catch (err) {
      console.error("Ask owl error", err);
      setAnswer("אירעה שגיאה בתקשורת עם השרת. ודא שפונקציית askOwl פרוסה ומפתח ה-API מוגדר כראוי.");
    }
    setLoading(false);
  };

  const handleExportWA = () => {
    if (!answer) return;
    const text = `🦉 *שאל את הינשוף - תובנות תצפית*\n\n❓ *שאלה:*\n${question}\n\n✨ *התשובה:*\n${answer}\n\nהופק ע"י מערכת ינשוף לתצפיות 🦉`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className={theme.page.wrapper}>
      <h2 className={theme.page.title}>🦉 שאל את הינשוף</h2>
      <p className="text-sm text-center text-muted-foreground mb-6">
        הינשוף כאן כדי לעזור לך לנתח את מגמות התרגולים, להפיק לקחים ולייעל את משמרות התצפית.
      </p>

      {/* Filters UI */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm mb-6 space-y-3">
        <h4 className="text-xs font-bold text-secondary flex items-center gap-2">
          <Sparkles size={14}/> סינון מידע לינשוף (אופציונלי)
        </h4>
        <div className="grid grid-cols-3 gap-2">
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
        <input 
          type="text" 
          placeholder="טקסט חופשי לסינון (למשל: יום אויב, לייזר...)" 
          value={customContext} 
          onChange={e => setCustomContext(e.target.value)} 
          className={theme.input.base + " py-1.5 text-xs"}
        />
      </div>

      {/* Input */}
      <div className="relative mb-6">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="שאל שאלה חופשית על התרגולים..."
          className={theme.input.textarea + " pr-10 pb-12"}
        />
        <MessageSquare className="absolute top-3 right-3 text-muted-foreground w-5 h-5" />
        <button 
          onClick={() => handleAsk()}
          disabled={loading || !question.trim()}
          className="absolute bottom-3 left-3 bg-secondary hover:bg-secondary/90 transition-colors text-secondary-foreground p-2 rounded-lg disabled:opacity-50"
        >
          {loading ? <Sparkles size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {chips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleAsk(chip)}
            className="text-xs bg-card text-foreground px-3 py-2 rounded-full border border-border hover:bg-muted transition-colors text-right shadow-sm"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Answer */}
      {loading && (
        <div className="bg-card p-6 rounded-xl border border-border flex flex-col items-center justify-center gap-4 animate-pulse">
          <Bird size={48} className="text-secondary opacity-50" />
          <p className="text-secondary font-medium">הינשוף מנתח נתונים...</p>
        </div>
      )}

      {answer && !loading && (
        <div className="bg-card p-5 rounded-xl border border-secondary shadow-lg shadow-secondary/10 relative">
          <div className="absolute -top-3 -right-2 bg-secondary text-secondary-foreground w-8 h-8 rounded-full flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <h3 className="font-bold text-secondary mb-3">תשובת הינשוף:</h3>
          <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {answer}
          </div>
          <button 
            onClick={handleExportWA}
            className="mt-4 flex items-center justify-center gap-2 w-full bg-secondary/10 hover:bg-secondary/20 text-secondary font-bold py-2 rounded-lg transition-colors border border-secondary/20"
          >
            <Share2 size={16} /> שתף בוואטסאפ
          </button>
        </div>
      )}
    </div>
  );
}
