const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { OpenAI } = require("openai");

admin.initializeApp();

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

    const reports = reportsSnapshot.docs.map(doc => doc.data());
    
    // Filtering down to a limited context so we don't overflow context windows
    const recentReports = reports.sort((a,b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()).slice(0, 50);

    const dataContext = recentReports.map(r => 
      `תאריך: ${r.date}, תצפית: ${r.observationPostName}, מתווה: ${r.exerciseOutline}, נקודות לשימור: ${r.preservationPoints.join(', ')}, נקודות לשיפור: ${r.improvementPoints.join(', ')}`
    ).join('\n');

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
    return { error: "אירעה שגיאה בעיבוד השאלה. אנא ודא שהגדרת את סוד ה-OPENAI_API_KEY." };
  }
});
