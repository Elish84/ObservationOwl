/**
 * 🎨 THEME CONFIG - ינשוף לתצפיות
 * קובץ עיצוב מרכזי - כל שינוי עיצובי נעשה כאן בלבד.
 */

// ─── צבעים ───────────────────────────────────────────────
// הצבעים מנוהלים ב-index.css ו-tailwind.config.js דרך CSS variables.
// כאן מגדירים את CLASS NAMES המשמשים בכל האפליקציה.

export const theme = {
  // ── כותרת עליונה ──
  header: {
    wrapper: 'bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3 shadow-lg',
    title: 'text-lg font-bold leading-tight',
    subtitle: 'text-xs opacity-80',
    icon: 'w-5 h-5 opacity-40 mr-auto',
  },

  // ── ניווט תחתון ──
  bottomNav: {
    wrapper: 'fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50',
    inner: 'flex justify-around items-center h-16 max-w-lg mx-auto',
    tabActive: 'text-secondary font-semibold',
    tabInactive: 'text-muted-foreground hover:text-foreground',
    tabBase: 'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all',
    iconActive: 'w-5 h-5 stroke-[2.5]',
    iconInactive: 'w-5 h-5',
    indicator: 'absolute bottom-0 w-8 h-0.5 bg-secondary rounded-full',
    label: 'text-[10px]',
  },

  // ── עמודים ──
  page: {
    wrapper: 'p-4 max-w-lg mx-auto space-y-4 pb-20',
    title: 'text-lg font-bold flex items-center justify-center gap-2',
    subtitle: 'text-xs text-muted-foreground',
  },

  // ── כרטיסים ──
  card: {
    base: 'border-0 shadow-md bg-card rounded-xl overflow-hidden',
    shadow: 'border-0 shadow-lg rounded-xl overflow-hidden',
    headerGradient: 'bg-gradient-to-l from-primary/10 via-secondary/10 to-accent/10 pb-3',
  },

  // ── כפתורים ──
  button: {
    primary: 'w-full h-14 text-lg font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors',
    save: 'bg-secondary hover:bg-secondary/90 text-secondary-foreground flex items-center justify-center gap-2 transition-colors rounded-lg',
    danger: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center justify-center gap-2 transition-colors rounded-lg',
    ghost: 'text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 transition-colors rounded-lg',
    icon: 'h-8 w-8 flex items-center justify-center rounded-lg transition-colors',
  },

  // ── תוויות שדות ──
  label: {
    base: 'text-sm font-medium',
    secondary: 'text-sm font-medium text-secondary',
    accent: 'text-sm font-medium text-accent',
    xs: 'text-xs font-medium',
  },

  // ── תגיות (badges) ──
  badge: {
    post: 'bg-secondary/10 text-secondary px-2 py-0.5 rounded-full text-xs font-medium',
    formType: 'bg-accent/10 text-accent px-2 py-0.5 rounded-full text-xs font-medium',
  },

  // ── סטטיסטיקות ──
  statCard: {
    wrapper: 'border-0 shadow-md overflow-hidden bg-card rounded-xl',
    content: 'p-4 flex items-center gap-3',
    iconBase: 'w-10 h-10 rounded-xl flex items-center justify-center text-lg',
    value: 'text-xl font-bold',
    labelText: 'text-xs text-muted-foreground truncate',
  },

  // ── גרפים ──
  chartColors: {
    primary: 'hsl(140,60%,40%)',   // ירוק
    secondary: 'hsl(270,40%,60%)', // סגול
    tertiary: 'hsl(222,47%,30%)',  // נייבי
    quaternary: 'hsl(43,74%,66%)', // זהב
    quinary: 'hsl(170,50%,50%)',   // ציאן
    muted: 'hsl(222,20%,75%)',     // אפור
  },

  // ── שדות טקסט ──
  input: {
    base: 'text-sm text-right w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-ring',
    center: 'text-center text-sm w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-ring',
    textarea: 'text-sm text-right w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-ring min-h-[100px]',
    select: 'text-sm text-right w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-ring',
    checkbox: 'w-4 h-4 rounded border-border text-primary focus:ring-ring',
  },

  // ── כפתורי כן/לא ──
  yesNo: {
    wrapper: 'flex gap-2 w-full',
    yes: 'flex-1 h-10 rounded-lg flex items-center justify-center transition-colors bg-secondary text-secondary-foreground font-medium',
    no: 'flex-1 h-10 rounded-lg flex items-center justify-center transition-colors bg-primary text-primary-foreground font-medium',
    inactive: 'flex-1 h-10 rounded-lg flex items-center justify-center transition-colors bg-muted text-muted-foreground font-medium',
  },

  // ── אדמין ──
  admin: {
    wrapper: 'p-4 max-w-lg mx-auto space-y-4 pb-20',
    addButton: 'h-10 w-10 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-full shadow-lg flex items-center justify-center',
    itemRow: 'flex items-center gap-2 p-3 bg-muted/50 rounded-lg justify-between',
  },

  // ── ריק / טעינה ──
  empty: {
    wrapper: 'text-center py-12 text-muted-foreground',
    icon: 'text-4xl mb-2 flex justify-center opacity-50',
  },
};

export default theme;
