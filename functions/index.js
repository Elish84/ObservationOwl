const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { OpenAI } = require("openai");

admin.initializeApp();

const { setGlobalOptions } = require("firebase-functions/v2");
setGlobalOptions({ region: "me-west1" });

exports.askOwl = onCall(async (request) => {
  try {
    const { question, filters } = request.data;

    // TODO: Apply filters based on filters object (e.g. date ranges, specific posts)
    let query = admin.firestore().collection('observationTrainingReports');
    
    // Simplistic approach for all documents since advanced filtering might require indexing
    const reportsSnapshot = await query.get();
    
    if (reportsSnapshot.empty) {
      return { answer: "אין מספיק מידע במערכת כדי לענות על שאלתך כרגע." };
    }

    let reports = reportsSnapshot.docs.map(doc => doc.data());
    
    // Apply filters from client
    if (filters) {
      if (filters.trainee) {
        reports = reports.filter(r => r.traineeName === filters.trainee);
      }
      if (filters.post) {
        reports = reports.filter(r => r.observationPostName === filters.post);
      }
      if (filters.type) {
        reports = reports.filter(r => r.practiceType === filters.type);
      }
      if (filters.customContext) {
        const ctx = filters.customContext.toLowerCase();
        reports = reports.filter(r => 
          JSON.stringify(r).toLowerCase().includes(ctx)
        );
      }
    }

    if (reports.length === 0) {
      return { answer: "לא נמצאו תרגולים המתאימים לסינון שבחרת." };
    }

    // Filtering down to a limited context so we don't overflow context windows
    const recentReports = reports.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)).slice(0, 50);

    const dataContext = recentReports.map(r => {
      let metricStr = '';
      if (r.metrics) {
        const validMetrics = Object.entries(r.metrics).filter(([k,v]) => v !== 'לא רלוונטי');
        if (validMetrics.length > 0) {
          metricStr = ', מדדים: ' + validMetrics.map(([k,v]) => `${k} (${v})`).join(', ');
        }
      }
      const preserve = r.preservationPoints ? r.preservationPoints.filter(p => p.trim() !== '').join(', ') : 'אין';
      const improve = r.improvementPoints ? r.improvementPoints.filter(p => p.trim() !== '').join(', ') : 'אין';
      return `תאריך: ${r.date}, סוג: ${r.practiceType || 'רגיל'}, תצפית: ${r.observationPostName}, תצפיתנית: ${r.traineeName}, מתווה: ${r.exerciseOutline}${metricStr}, לשימור: ${preserve || 'אין'}, לשיפור: ${improve || 'אין'}`;
    }).join('\n');

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OpenAI API Key");
    }

    const openai = new OpenAI({ apiKey });

    const systemPrompt = "אתה עוזר ניתוח מקצועי למערכת תרגול תצפיתניות. ענה בעברית בלבד, בצורה עניינית, מבצעית, ברורה וקצרה. התבסס רק על הנתונים שסופקו לך. אל תמציא נתונים. אם חסר מידע, ציין זאת.";
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `נתוני התרגולים האחרונים:\n${dataContext}\n\nשאלה: ${question}` }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    return { answer: response.choices[0].message.content };
  } catch (error) {
    console.error("Error in askOwl function:", error);
    return { error: `אירעה שגיאה: ${error.message || "שגיאה לא ידועה"}` };
  }
});
