import React, { useState, useEffect } from 'react';
import theme from '../theme';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { Send, CheckCircle2 } from 'lucide-react';

export default function FormFill() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].slice(0, 5),
    practiceType: '',
    tutorName: '',
    traineeName: '',
    observationPost: '',
    additionalObservationPost: '',
    exerciseOutline: '',
    metrics: {
      'התמצאות והזדטרות': 'לא רלוונטי',
      'איכות הכוונת הכוח (כיוונים , רדיפות)': 'לא רלוונטי',
      'תקשורת מול הכוח (רציפות ואיכות)': 'לא רלוונטי',
      'הכרת המרחב': 'לא רלוונטי',
      'עבודה נכונה עם האמצעי': 'לא רלוונטי',
      'שת"פ עם עמדות נוספות': 'לא רלוונטי'
    },
    jointForces: false,
    jointForcesFramework: '',
    jointForcesDetails: '',
    enemySimulation: false,
    laserPointerUsage: false,
    preservationPoints: ['', '', ''],
    improvementPoints: ['', '', ''],
    freeComments: ''
  });

  const [posts, setPosts] = useState([]);
  const [frameworks, setFrameworks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(null); // stores { text, waUrl }

  useEffect(() => {
    // Fetch active form types and posts
    const fetchDropdowns = async () => {
      try {
        const postsSnap = await getDocs(query(collection(db, 'observationPosts'), where('active', '==', true)));
        const fwSnap = await getDocs(query(collection(db, 'frameworks'), where('active', '==', true)));
        
        const postsData = postsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const fwData = fwSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        setPosts(postsData);
        setFrameworks(fwData);
      } catch (err) {
        console.error("Error fetching dropdowns", err);
      }
    };
    fetchDropdowns();
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => {
      const newArr = [...prev[field]];
      newArr[index] = value;
      return { ...prev, [field]: newArr };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.practiceType) {
      alert("נא לבחור סוג תרגול");
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Save to Firestore
      const reportData = {
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date(),
        observationPostName: posts.find(p => p.id === formData.observationPost)?.name || formData.observationPost || "כללי",
        jointForcesFrameworkName: formData.jointForcesFramework ? (frameworks.find(f => f.id === formData.jointForcesFramework)?.name || formData.jointForcesFramework) : "",
      };
      await addDoc(collection(db, 'observationTrainingReports'), reportData);

      // 2. Generate WhatsApp URL
      const filledPreservation = formData.preservationPoints.filter(p => p.trim() !== '');
      const filledImprovement = formData.improvementPoints.filter(p => p.trim() !== '');

      let metricsText = '';
      if (formData.practiceType === 'תרגול בחניכה') {
        const measured = Object.values(formData.metrics).filter(v => v !== 'לא רלוונטי');
        let scoreText = '';
        if (measured.length > 0) {
          const sum = measured.reduce((a, b) => a + parseInt(b), 0);
          const normalizedScore = Math.round((sum / measured.length) * 20);
          scoreText = `\n📊 *ציון תרגול:* ${normalizedScore} מתוך 100`;
        }
        
        metricsText = `\n📉 *מדדי ביצוע:*\n`;
        Object.entries(formData.metrics).forEach(([key, value]) => {
          metricsText += `- ${key}: ${value}\n`;
        });
        if (scoreText) {
          metricsText += scoreText + '\n\n';
        } else {
          metricsText += '\n';
        }
      }

      const text = `🦉 *סיכום תרגול תצפית*

📅 *תאריך:* ${formData.date}
🕒 *שעה:* ${formData.time}
${formData.practiceType ? `📋 *סוג תרגול:* ${formData.practiceType}\n` : ''}👤 *שם התצפיתנית:* ${formData.traineeName}
${formData.practiceType === 'תרגול בחניכה' && formData.tutorName ? `👤 *שם החונכת:* ${formData.tutorName}\n` : ''}📍 *עמדת תצפית:* ${reportData.observationPostName}
${formData.additionalObservationPost ? `📌 *תצפית נוספת:* ${formData.additionalObservationPost}\n` : ''}${formData.exerciseOutline ? `🎯 *מתווה התרגיל:*\n${formData.exerciseOutline}\n\n` : ''}${metricsText}🤝 *כוחות משולבים:* ${formData.jointForces ? 'כן' : 'לא'}
${formData.jointForces && formData.jointForcesDetails ? `*פירוט כוח:* ${formData.jointForcesDetails} ${reportData.jointForcesFrameworkName ? `(מסגרת: ${reportData.jointForcesFrameworkName})` : ''}\n` : ''}🎭 *ביום אויב:* ${formData.enemySimulation ? 'כן' : 'לא'}
🔦 *שימוש בסמן לייזר:* ${formData.laserPointerUsage ? 'כן' : 'לא'}

${filledPreservation.length > 0 ? `✅ *נקודות לשימור:*\n${filledPreservation.map((p, i) => `${i+1}. ${p}`).join('\n')}\n\n` : ''}${filledImprovement.length > 0 ? `🔧 *נקודות לשיפור:*\n${filledImprovement.map((p, i) => `${i+1}. ${p}`).join('\n')}\n\n` : ''}${formData.freeComments ? `📝 *הערות נוספות:*\n${formData.freeComments}` : ''}`;

      const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      
      setSuccess({ text, waUrl });
      window.open(waUrl, '_blank');

    } catch (err) {
      console.error("Error saving form", err);
      alert("שגיאה בשמירת הטופס");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMetric = (label) => {
    return (
      <div key={label} className="space-y-1 mt-3">
        <label className={theme.label.xs}>{label}</label>
        <div className="flex gap-1">
          {['1', '2', '3', '4', '5', 'לא רלוונטי'].map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  metrics: { ...prev.metrics, [label]: opt }
                }))
              }}
              className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                formData.metrics[label] === opt 
                  ? opt === 'לא רלוונטי' ? 'bg-muted text-muted-foreground border border-transparent' : 'bg-secondary text-secondary-foreground border border-transparent'
                  : 'bg-background border border-border text-foreground hover:bg-muted'
              }`}
            >
              {opt === 'לא רלוונטי' ? 'ל/ר' : opt}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={theme.page.wrapper}>
      <h2 className={theme.page.title}>🦉 מילוי סיכום תרגול תצפית</h2>
      
      {success ? (
        <div className="flex flex-col items-center justify-center p-8 bg-card rounded-xl border-2 border-primary/20 shadow-xl mt-10 space-y-6">
          <div className="bg-primary/10 p-4 rounded-full">
            <CheckCircle2 size={64} className="text-primary" />
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-foreground">הטופס נשמר בהצלחה!</h3>
            <p className="text-muted-foreground mt-2">הנתונים נשמרו במערכת.</p>
          </div>
          
          <div className="w-full space-y-3">
            <button 
              onClick={() => window.open(success.waUrl, '_blank')}
              className={theme.button.primary + " w-full h-14 text-lg"}
            >
              <Send size={24} /> שליחה לוואטסאפ
            </button>
            
            <button 
              onClick={() => {
                setFormData({
                  date: new Date().toISOString().split('T')[0],
                  time: new Date().toTimeString().split(' ')[0].slice(0, 5),
                  practiceType: '',
                  tutorName: '',
                  traineeName: '',
                  observationPost: '',
                  additionalObservationPost: '',
                  exerciseOutline: '',
                  metrics: {
                    'התמצאות והזדטרות': 'לא רלוונטי',
                    'איכות הכוונת הכוח (כיוונים , רדיפות)': 'לא רלוונטי',
                    'תקשורת מול הכוח (רציפות ואיכות)': 'לא רלוונטי',
                    'הכרת המרחב': 'לא רלוונטי',
                    'עבודה נכונה עם האמצעי': 'לא רלוונטי',
                    'שת"פ עם עמדות נוספות': 'לא רלוונטי'
                  },
                  jointForces: false,
                  jointForcesFramework: '',
                  jointForcesDetails: '',
                  enemySimulation: false,
                  laserPointerUsage: false,
                  preservationPoints: ['', '', ''],
                  improvementPoints: ['', '', ''],
                  freeComments: ''
                });
                setSuccess(null);
                window.scrollTo(0,0);
              }}
              className={theme.button.ghost + " w-full h-12 bg-muted/30"}
            >
              מילוי טופס חדש
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1 space-y-1">
              <label className={theme.label.base}>תאריך</label>
              <input type="date" required value={formData.date} onChange={e => handleChange('date', e.target.value)} className={theme.input.base} />
            </div>
            <div className="flex-1 space-y-1">
              <label className={theme.label.base}>שעה</label>
              <input type="time" required value={formData.time} onChange={e => handleChange('time', e.target.value)} className={theme.input.base} />
            </div>
          </div>

          <div className="space-y-2">
            <label className={theme.label.base}>סוג תרגול? <span className="text-destructive">*</span></label>
            <div className={theme.yesNo.wrapper}>
              <button type="button" onClick={() => handleChange('practiceType', 'תרגול עצמי')} className={formData.practiceType === 'תרגול עצמי' ? theme.yesNo.yes : theme.yesNo.inactive}>תרגול עצמי</button>
              <button type="button" onClick={() => handleChange('practiceType', 'תרגול בחניכה')} className={formData.practiceType === 'תרגול בחניכה' ? theme.yesNo.no : theme.yesNo.inactive}>תרגול בחניכה</button>
            </div>
          </div>

          {formData.practiceType === 'תרגול בחניכה' && (
            <div className="space-y-1">
              <label className={theme.label.base}>שם החונכת</label>
              <input type="text" placeholder="הכנס שם מלא" value={formData.tutorName} onChange={e => handleChange('tutorName', e.target.value)} className={theme.input.base} />
            </div>
          )}

          <div className="space-y-1">
            <label className={theme.label.base}>שם התצפיתנית <span className="text-destructive">*</span></label>
            <input type="text" required placeholder="הכנס שם מלא" value={formData.traineeName} onChange={e => handleChange('traineeName', e.target.value)} className={theme.input.base} />
          </div>

          <div className="space-y-1">
            <label className={theme.label.base}>עמדת תצפית <span className="text-destructive">*</span></label>
            <select required value={formData.observationPost} onChange={e => handleChange('observationPost', e.target.value)} className={theme.input.select}>
              <option value="" disabled>בחר עמדת תצפית</option>
              {posts.length === 0 && <option value="כללי">עמדה כללית (ברירת מחדל)</option>}
              {posts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className={theme.label.base}>תצפית נוספת</label>
            <input type="text" value={formData.additionalObservationPost} onChange={e => handleChange('additionalObservationPost', e.target.value)} className={theme.input.base} />
          </div>

          <div className="space-y-1">
            <label className={theme.label.base}>מתווה התרגיל</label>
            <textarea placeholder="תאר את מתווה התרגיל בקצרה" value={formData.exerciseOutline} onChange={e => handleChange('exerciseOutline', e.target.value)} className={theme.input.textarea} />
          </div>

          {formData.practiceType === 'תרגול בחניכה' && (
            <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border">
              <label className={theme.label.secondary}>מדדי ביצוע</label>
              {[
                'התמצאות והזדטרות',
                'איכות הכוונת הכוח (כיוונים , רדיפות)',
                'תקשורת מול הכוח (רציפות ואיכות)',
                'הכרת המרחב',
                'עבודה נכונה עם האמצעי',
                'שת"פ עם עמדות נוספות'
              ].map(renderMetric)}
            </div>
          )}

          <div className="space-y-2">
            <label className={theme.label.base}>האם היו כוחות משולבים?</label>
            <div className={theme.yesNo.wrapper}>
              <button type="button" onClick={() => handleChange('jointForces', true)} className={formData.jointForces ? theme.yesNo.yes : theme.yesNo.inactive}>כן</button>
              <button type="button" onClick={() => handleChange('jointForces', false)} className={!formData.jointForces ? theme.yesNo.no : theme.yesNo.inactive}>לא</button>
            </div>
            {formData.jointForces && (
              <div className="flex gap-2 mt-2">
                <div className="flex-1">
                  <select required value={formData.jointForcesFramework} onChange={e => handleChange('jointForcesFramework', e.target.value)} className={theme.input.select}>
                    <option value="" disabled>בחר מסגרת</option>
                    {frameworks.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div className="flex-[2]">
                  <input type="text" placeholder="איזה כוח השתתף?" required value={formData.jointForcesDetails} onChange={e => handleChange('jointForcesDetails', e.target.value)} className={theme.input.base} />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className={theme.label.base}>האם היה ביום אויב?</label>
            <div className={theme.yesNo.wrapper}>
              <button type="button" onClick={() => handleChange('enemySimulation', true)} className={formData.enemySimulation ? theme.yesNo.yes : theme.yesNo.inactive}>כן</button>
              <button type="button" onClick={() => handleChange('enemySimulation', false)} className={!formData.enemySimulation ? theme.yesNo.no : theme.yesNo.inactive}>לא</button>
            </div>
          </div>

          <div className="space-y-2">
            <label className={theme.label.base}>האם נעשה שימוש בסמן לייזר?</label>
            <div className={theme.yesNo.wrapper}>
              <button type="button" onClick={() => handleChange('laserPointerUsage', true)} className={formData.laserPointerUsage ? theme.yesNo.yes : theme.yesNo.inactive}>כן</button>
              <button type="button" onClick={() => handleChange('laserPointerUsage', false)} className={!formData.laserPointerUsage ? theme.yesNo.no : theme.yesNo.inactive}>לא</button>
            </div>
          </div>

          <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border">
            <label className={theme.label.secondary}>נקודות לשימור</label>
            {[0, 1, 2].map(i => (
              <input key={`preserve-${i}`} type="text" placeholder={`נקודה ${i+1}`} value={formData.preservationPoints[i]} onChange={e => handleArrayChange('preservationPoints', i, e.target.value)} className={theme.input.base} />
            ))}
          </div>

          <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border">
            <label className={theme.label.accent}>נקודות לשיפור</label>
            {[0, 1, 2].map(i => (
              <input key={`improve-${i}`} type="text" placeholder={`נקודה ${i+1}`} value={formData.improvementPoints[i]} onChange={e => handleArrayChange('improvementPoints', i, e.target.value)} className={theme.input.base} />
            ))}
          </div>

          <div className="space-y-1">
            <label className={theme.label.base}>הערות חופשיות</label>
            <textarea value={formData.freeComments} onChange={e => handleChange('freeComments', e.target.value)} className={theme.input.textarea} />
          </div>

          <button type="submit" disabled={isSubmitting} className={theme.button.primary + " mt-8 w-full h-14"}>
            <Send size={20} />
            {isSubmitting ? 'שומר...' : 'שמירה ויציאה ל-WhatsApp'}
          </button>
        </form>
      )}
    </div>
  );
}
