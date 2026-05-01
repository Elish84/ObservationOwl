import React, { useState, useEffect } from 'react';
import theme from '../theme';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { Plus, Trash2, Check, X, ShieldAlert, KeyRound, Mail } from 'lucide-react';

export default function Admin({ isAdmin, user }) {
  const navigate = useNavigate();
  const [formTypes, setFormTypes] = useState([]);
  const [posts, setPosts] = useState([]);
  const [frameworks, setFrameworks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for new items
  const [newFormType, setNewFormType] = useState('');
  const [newPost, setNewPost] = useState('');
  const [newFramework, setNewFramework] = useState('');

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const typesSnap = await getDocs(query(collection(db, 'formTypes'), orderBy('createdAt', 'desc')));
      const postsSnap = await getDocs(query(collection(db, 'observationPosts'), orderBy('createdAt', 'desc')));
      const frameworksSnap = await getDocs(query(collection(db, 'frameworks'), orderBy('createdAt', 'desc')));
      
      setFormTypes(typesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setPosts(postsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setFrameworks(frameworksSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetching admin data", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (error) {
      console.error('Login failed', error);
      setLoginError('התחברות נכשלה. בדוק אימייל וסיסמא או שאין לך הרשאה במערכת.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleAddFormType = async () => {
    if (!newFormType.trim()) return;
    try {
      await addDoc(collection(db, 'formTypes'), {
        name: newFormType,
        active: true,
        createdAt: new Date()
      });
      setNewFormType('');
      fetchAdminData();
    } catch (err) {
      console.error("Error adding form type", err);
    }
  };

  const handleAddPost = async () => {
    if (!newPost.trim()) return;
    try {
      await addDoc(collection(db, 'observationPosts'), {
        name: newPost,
        active: true,
        createdAt: new Date()
      });
      setNewPost('');
      fetchAdminData();
    } catch (err) {
      console.error("Error adding post", err);
    }
  };

  const handleAddFramework = async () => {
    if (!newFramework.trim()) return;
    try {
      await addDoc(collection(db, 'frameworks'), {
        name: newFramework,
        active: true,
        createdAt: new Date()
      });
      setNewFramework('');
      fetchAdminData();
    } catch (err) {
      console.error("Error adding framework", err);
    }
  };

  const toggleActive = async (collectionName, id, currentStatus) => {
    try {
      await updateDoc(doc(db, collectionName, id), { active: !currentStatus });
      fetchAdminData();
    } catch (err) {
      console.error("Error toggling status", err);
    }
  };

  const handleDelete = async (collectionName, id) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק פריט זה?')) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      fetchAdminData();
    } catch (err) {
      console.error("Error deleting", err);
    }
  };

  if (!user) {
    return (
      <div className={theme.page.wrapper}>
        <div className="flex flex-col items-center justify-center mt-10 gap-6 max-w-sm mx-auto">
          <ShieldAlert size={64} className="text-secondary opacity-50" />
          <h2 className={theme.page.title}>כניסת מנהלים</h2>
          
          <form onSubmit={handleLogin} className="w-full space-y-4 bg-card p-6 rounded-xl border border-border shadow-md">
            <div className="space-y-1">
              <label className={theme.label.base}>אימייל</label>
              <div className="relative">
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={theme.input.base + " pr-10"} 
                  dir="ltr"
                  placeholder="admin@example.com"
                />
                <Mail size={18} className="absolute right-3 top-2.5 text-muted-foreground" />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className={theme.label.base}>סיסמא</label>
              <div className="relative">
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={theme.input.base + " pr-10"} 
                  dir="ltr"
                  placeholder="******"
                />
                <KeyRound size={18} className="absolute right-3 top-2.5 text-muted-foreground" />
              </div>
            </div>

            {loginError && <p className="text-sm text-destructive text-center">{loginError}</p>}

            <button type="submit" className={theme.button.primary + " mt-4"}>
              התחבר
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={theme.page.wrapper}>
        <div className="flex flex-col items-center justify-center mt-20 gap-4 max-w-sm mx-auto text-center">
          <ShieldAlert size={64} className="text-destructive opacity-50" />
          <h2 className={theme.page.title}>אין הרשאת גישה</h2>
          <p className="text-muted-foreground">המשתמש <strong className="text-foreground">{user.email}</strong> אינו מוגדר כמנהל במערכת.</p>
          <button onClick={handleLogout} className={theme.button.ghost + " mt-4 bg-muted/50 px-4 py-2"}>
            התנתק מהמערכת
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={theme.page.wrapper}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={theme.page.title}>ניהול מערכת</h2>
      </div>
      
      {loading ? (
        <p className="text-center text-muted-foreground">טוען נתונים...</p>
      ) : (
        <div className="space-y-6">
          {/* Form Types Admin */}
          <div className={theme.card.base + " p-4"}>
            <h3 className="font-bold mb-4 text-secondary">סוגי טפסים</h3>
            
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="הוסף סוג טופס חדש..." 
                value={newFormType} 
                onChange={(e) => setNewFormType(e.target.value)}
                className={theme.input.base}
              />
              <button onClick={handleAddFormType} className={theme.button.save + " px-4"}>
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-2">
              {formTypes.map(type => (
                <div key={type.id} className={theme.admin.itemRow}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${type.active ? 'bg-primary' : 'bg-destructive'}`}></span>
                    <span className={type.active ? 'text-foreground' : 'text-muted-foreground line-through'}>{type.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleActive('formTypes', type.id, type.active)} className="p-1.5 text-muted-foreground hover:text-foreground">
                      {type.active ? <X size={16} /> : <Check size={16} />}
                    </button>
                    <button onClick={() => handleDelete('formTypes', type.id)} className="p-1.5 text-destructive/70 hover:text-destructive">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {formTypes.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">אין סוגי טפסים במערכת</p>}
            </div>
          </div>

          {/* Observation Posts Admin */}
          <div className={theme.card.base + " p-4"}>
            <h3 className="font-bold mb-4 text-primary">עמדות תצפית</h3>
            
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="הוסף עמדת תצפית חדשה..." 
                value={newPost} 
                onChange={(e) => setNewPost(e.target.value)}
                className={theme.input.base}
              />
              <button onClick={handleAddPost} className={theme.button.save + " px-4"}>
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-2">
              {posts.map(post => (
                <div key={post.id} className={theme.admin.itemRow}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${post.active ? 'bg-primary' : 'bg-destructive'}`}></span>
                    <span className={post.active ? 'text-foreground' : 'text-muted-foreground line-through'}>{post.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleActive('observationPosts', post.id, post.active)} className="p-1.5 text-muted-foreground hover:text-foreground">
                      {post.active ? <X size={16} /> : <Check size={16} />}
                    </button>
                    <button onClick={() => handleDelete('observationPosts', post.id)} className="p-1.5 text-destructive/70 hover:text-destructive">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {posts.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">אין עמדות תצפית במערכת</p>}
            </div>
          </div>

          {/* Frameworks Admin */}
          <div className={theme.card.base + " p-4"}>
            <h3 className="font-bold mb-4 text-accent">מסגרות (כוחות משולבים)</h3>
            
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="הוסף מסגרת חדשה..." 
                value={newFramework} 
                onChange={(e) => setNewFramework(e.target.value)}
                className={theme.input.base}
              />
              <button onClick={handleAddFramework} className={theme.button.save + " px-4"}>
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-2">
              {frameworks.map(fw => (
                <div key={fw.id} className={theme.admin.itemRow}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${fw.active ? 'bg-primary' : 'bg-destructive'}`}></span>
                    <span className={fw.active ? 'text-foreground' : 'text-muted-foreground line-through'}>{fw.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleActive('frameworks', fw.id, fw.active)} className="p-1.5 text-muted-foreground hover:text-foreground">
                      {fw.active ? <X size={16} /> : <Check size={16} />}
                    </button>
                    <button onClick={() => handleDelete('frameworks', fw.id)} className="p-1.5 text-destructive/70 hover:text-destructive">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {frameworks.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">אין מסגרות במערכת</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
