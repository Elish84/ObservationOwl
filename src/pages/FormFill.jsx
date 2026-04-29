import React, { useState, useEffect } from 'react';
import theme from '../theme';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { Send, CheckCircle2 } from 'lucide-react';

export default function FormFill() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].slice(0, 5),
    formType: '',
    tutorName: '',
    traineeName: '',
    observationPost: '',
    additionalObservationPost: '',
    exerciseOutline: '',
    jointForces: false,
    jointForcesFramework: '',
    jointForcesDetails: '',
    enemySimulation: false,
    laserPointerUsage: false,
    preservationPoints: ['', '', ''],
    improvementPoints: ['', '', ''],
    freeComments: ''
  });

  const [formTypes, setFormTypes] = useState([]);
  const [posts, setPosts] = useState([]);
  const [frameworks, setFrameworks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Fetch active form types and posts
    const fetchDropdowns = async () => {
      try {
        const typesSnap = await getDocs(query(collection(db, 'formTypes'), where('active', '==', true)));
        const postsSnap = await getDocs(query(collection(db, 'observationPosts'), where('active', '==', true)));
        const fwSnap = await getDocs(query(collection(db, 'frameworks'), where('active', '==', true)));
        
        const typesData = typesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const postsData = postsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const fwData = fwSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        setFormTypes(typesData);
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
    setIsSubmitting(true);
    try {
      // 1. Save to Firestore
      const reportData = {
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date(),
        formTypeName: formTypes.find(t => t.id === formData.formType)?.name || formData.formType || "רגיל",
        observationPostName: posts.find(p => p.id === formData.observationPost)?.name || formData.observationPost || "כללי",
        jointForcesFrameworkName: formData.jointForcesFramework ? (frameworks.find(f => f.id === formData.jointForcesFramework)?.name || formData.jointForcesFramework) : "",
      };
      await addDoc(collection(db, 'observationTrainingReports'), reportData);

      // 2. Generate WhatsApp URL
      const filledPreservation = formData.preservationPoints.filter(p => p.trim() !== '');
      const filledImprovement = formData.improvementPoints.filter(p => p.trim() !== '');

      const text = `🦉 *סיכום תרגול תצפית*

📅 *תאריך:* ${formData.date}
🕒 *שעה:* ${formData.time}
${reportData.formTypeName && reportData.formTypeName !== 'רגיל' ? `📋 *סוג טופס:* ${reportData.formTypeName}\n` : ''}👤 *שם התצפיתנית:* ${formData.traineeName}
${formData.tutorName ? `👤 *שם החונכת:* ${formData.tutorName}\n` : ''}📍 *עמדת תצפית:* ${reportData.observationPostName}
${formData.additionalObservationPost ? `📌 *תצפית נוספת:* ${formData.additionalObservationPost}\n` : ''}${formData.exerciseOutline ? `🎯 *מתווה התרגיל:*\n${formData.exerciseOutline}\n\n` : ''}🤝 *כוחות משולבים:* ${formData.jointForces ? 'כן' : 'לא'}
${formData.jointForces && formData.jointForcesDetails ? `*פירוט כוח:* ${formData.jointForcesDetails} ${reportData.jointForcesFrameworkName ? `(מסגרת: ${reportData.jointForcesFrameworkName})` : ''}\n` : ''}🎭 *ביום אויב:* ${formData.enemySimulation ? 'כן' : 'לא'}
🔦 *שימוש בסמן לייזר:* ${formData.laserPointerUsage ? 'כן' : 'לא'}

${filledPreservation.length > 0 ? `✅ *נקודות לשימור:*\n${filledPreservation.map((p, i) => `${i+1}. ${p}`).join('\n')}\n\n` : ''}${filledImprovement.length > 0 ? `🔧 *נקודות לשיפור:*\n${filledImprovement.map((p, i) => `${i+1}. ${p}`).join('\n')}\n\n` : ''}${formData.freeComments ? `📝 *הערות נוספות:*\n${formData.freeComments}` : ''}`;

      const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      
      setSuccess(true);
      window.open(waUrl, '_blank');

      // Reset form
      setTimeout(() => {
        setFormData({
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0].slice(0, 5),
          formType: '',
          tutorName: '',
          traineeName: '',
          observationPost: '',
          additionalObservationPost: '',
          exerciseOutline: '',
          jointForces: false,
          jointForcesFramework: '',
          jointForcesDetails: '',
          enemySimulation: false,
          laserPointerUsage: false,
          preservationPoints: ['', '', ''],
          improvementPoints: ['', '', ''],
          freeComments: ''
        });
        setSuccess(false);
        window.scrollTo(0,0);
      }, 3000);

    } catch (err) {
      console.error("Error saving form", err);
      alert("שגיאה בשמירת הטופס");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={theme.page.wrapper}>
      <h2 className={theme.page.title}>🦉 מילוי סיכום תרגול תצפית</h2>
      
      {success ? (
        <div className="flex flex-col items-center justify-center p-10 bg-primary/20 rounded-xl text-primary mt-10">
          <CheckCircle2 size={64} className="mb-4" />
          <h3 className="text-xl font-bold">הטופס נשמר בהצלחה!</h3>
          <p className="text-sm opacity-80 text-center mt-2">פותח את וואטסאפ...</p>
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

          <div className="space-y-1">
            <label className={theme.label.base}>סוג טופס <span className="text-destructive">*</span></label>
            <select required value={formData.formType} onChange={e => handleChange('formType', e.target.value)} className={theme.input.select}>
              <option value="" disabled>בחר סוג טופס</option>
              {formTypes.length === 0 && <option value="רגיל">רגיל (ברירת מחדל)</option>}
              {formTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className={theme.label.base}>שם החונכת</label>
            <input type="text" placeholder="הכנס שם מלא" value={formData.tutorName} onChange={e => handleChange('tutorName', e.target.value)} className={theme.input.base} />
          </div>

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

          <button type="submit" disabled={isSubmitting} className={theme.button.primary + " mt-6 sticky bottom-24 z-10"}>
            <Send size={20} />
            {isSubmitting ? 'שומר...' : 'שמירה ויציאה ל-WhatsApp'}
          </button>
        </form>
      )}
    </div>
  );
}
