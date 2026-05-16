import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { FiUser, FiCheckCircle, FiClock, FiAlertCircle, FiSearch, FiPlus, FiTrash2, FiEdit3, FiLock, FiLogOut, FiShield, FiDownload, FiMinus, FiBarChart2, FiTrendingUp, FiActivity, FiCalendar, FiAward, FiTarget } from 'react-icons/fi';
import { MdDashboard } from 'react-icons/md';
import './AppStyles.css';

const DEFAULT_PERSONS = ['Vinit','Shreyash','Dhyan','Pooja','Urvashi','Ritika','Rohit','Jenish','Sakshi','Sunny','Kuldip','Dhruv','Kasam'];

function App() {
  const [tasks, setTasks] = useState([]);
  const [persons, setPersons] = useState(() => {
    try {
      const saved = localStorage.getItem('customPersons');
      const custom = saved ? JSON.parse(saved) : [];
      const merged = [...DEFAULT_PERSONS];
      custom.forEach(p => { if (!merged.includes(p)) merged.push(p); });
      return merged;
    } catch { return DEFAULT_PERSONS; }
  });
  const [personName, setPersonName] = useState('');
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [newPersonInput, setNewPersonInput] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [taskSize, setTaskSize] = useState('');
  const [filter, setFilter] = useState('active');
  const [taskType, setTaskType] = useState('annotation');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProgress, setEditingProgress] = useState(null);
  const [progressValue, setProgressValue] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [editPerson, setEditPerson] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSize, setEditSize] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPerson, setCelebrationPerson] = useState('');
  
  const ADMIN_PASSWORD = 'admin123';

  const confirmAddPerson = () => {
    const name = newPersonInput.trim();
    if (!name) return;
    if (!persons.includes(name)) {
      const updated = [...persons, name];
      setPersons(updated);
      const custom = updated.filter(p => !DEFAULT_PERSONS.includes(p));
      localStorage.setItem('customPersons', JSON.stringify(custom));
    }
    setPersonName(name);
    setIsAddingPerson(false);
    setNewPersonInput('');
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowPasswordPrompt(false);
      setPasswordInput('');
      localStorage.setItem('isAdmin', 'true');
    } else {
      alert('Incorrect password!');
      setPasswordInput('');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('isAdmin');
  };

  useEffect(() => {
    const savedAdminStatus = localStorage.getItem('isAdmin');
    if (savedAdminStatus === 'true') {
      setIsAdmin(true);
    }
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(tasksData);
      setLoading(false);
    }, (error) => {
      console.error('Firebase Error:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addTask = async (e) => {
    e.preventDefault();
    if (!isAdmin) { alert('Only admin can add tasks!'); return; }
    if (personName.trim() && taskDescription.trim()) {
      try {
        await addDoc(collection(db, 'tasks'), {
          person: personName.trim(),
          task: taskDescription.trim(),
          priority: priority,
          dueDate: dueDate,
          taskSize: taskSize ? parseInt(taskSize) : 0,
          completed: 0,
          completedStatus: false,
          taskType: taskType,
          createdAt: new Date().toISOString()
        });
        setPersonName(''); setTaskDescription(''); setPriority('medium'); setDueDate(''); setTaskSize('');
      } catch (error) { console.error('Error adding task:', error); }
    }
  };

  const updateProgress = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    const newCompleted = parseInt(progressValue) || 0;
    if (newCompleted >= 0 && newCompleted <= task.taskSize) {
      try {
        await updateDoc(doc(db, 'tasks', taskId), { completed: newCompleted, completedStatus: newCompleted >= task.taskSize });
        setEditingProgress(null); setProgressValue('');
      } catch (error) { console.error('Error:', error); }
    }
  };

  const incrementProgress = async (taskId, amount) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const newCompleted = Math.min(Math.max(task.completed + amount, 0), task.taskSize);
      try {
        await updateDoc(doc(db, 'tasks', taskId), { completed: newCompleted, completedStatus: newCompleted >= task.taskSize });
      } catch (error) { console.error('Error:', error); }
    }
  };

  const toggleTask = async (id) => {
    if (!isAdmin) { alert('Only admin can mark tasks as complete!'); return; }
    const task = tasks.find(t => t.id === id);
    if (task) {
      const newStatus = !task.completedStatus;
      try {
        await updateDoc(doc(db, 'tasks', id), { completedStatus: newStatus, completed: newStatus ? task.taskSize : 0 });
        if (newStatus) {
          setCelebrationPerson(task.person || 'Team');
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 4000);
        }
      } catch (error) { console.error('Error:', error); }
    }
  };

  // Confetti particles config
  const CONFETTI = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    color: ['#FFD700','#FF6B6B','#4ade80','#60a5fa','#f472b6','#fb923c','#a78bfa'][i % 7],
    size: 6 + Math.random() * 8,
    shape: i % 3,
  }));

  const deleteTask = async (id) => {
    if (!isAdmin) { alert('Only admin can delete tasks!'); return; }
    if (window.confirm('Are you sure?')) {
      try { await deleteDoc(doc(db, 'tasks', id)); } catch (error) { console.error('Error:', error); }
    }
  };

  const openEditTask = (task) => {
    setEditingTask(task.id);
    setEditPerson(task.person || '');
    setEditDescription(task.task || '');
    setEditSize(task.taskSize ? task.taskSize.toString() : '0');
  };

  const saveEditTask = async (e) => {
    e.preventDefault();
    if (!editPerson.trim() || !editDescription.trim()) { alert('Name and description cannot be empty!'); return; }
    const newSize = parseInt(editSize) || 0;
    const task = tasks.find(t => t.id === editingTask);
    const newCompleted = Math.min(task.completed || 0, newSize);
    try {
      await updateDoc(doc(db, 'tasks', editingTask), {
        person: editPerson.trim(),
        task: editDescription.trim(),
        taskSize: newSize,
        completed: newCompleted,
        completedStatus: newSize > 0 ? newCompleted >= newSize : task.completedStatus
      });
      setEditingTask(null);
    } catch (error) { console.error('Error updating task:', error); }
  };

  const exportToExcel = () => {
    const completedTasks = tasks.filter(task => task.completedStatus);
    if (completedTasks.length === 0) { alert('No completed tasks!'); return; }
    let csvContent = "Person,Task,Priority,Due Date,Size,Completed,Created\n";
    completedTasks.forEach(task => {
      csvContent += [task.person||'', (task.task||'').replace(/,/g, ';'), task.priority||'', task.dueDate||'', task.taskSize||'', task.completed||'', task.createdAt ? new Date(task.createdAt).toLocaleDateString() : ''].join(',') + "\n";
    });
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tasks_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const getFilteredTasks = () => {
    if (taskType === 'analytics') return [];
    let filtered = (tasks || []).filter(t => (t.taskType || 'annotation') === taskType);
    if (filter === 'active') filtered = filtered.filter(t => !t.completedStatus);
    else if (filter === 'completed') filtered = filtered.filter(t => t.completedStatus);
    if (searchQuery.trim()) filtered = filtered.filter(t => (t.person||'').toLowerCase().includes(searchQuery.toLowerCase()) || (t.task||'').toLowerCase().includes(searchQuery.toLowerCase()));
    return filtered;
  };

  const filteredTasks = getFilteredTasks();
  const typedTasks = taskType === 'analytics' ? [] : (tasks || []).filter(t => (t.taskType || 'annotation') === taskType);
  const stats = {
    total: typedTasks.length,
    active: typedTasks.filter(t => !t.completedStatus).length,
    completed: typedTasks.filter(t => t.completedStatus).length,
    highPriority: typedTasks.filter(t => t.priority === 'high' && !t.completedStatus).length
  };

  // ── Celebration overlay ────────────────────────────────────────────
  const CelebrationOverlay = () => (
    <div className="celebration-overlay" onClick={() => setShowCelebration(false)}>
      <div className="confetti-container">
        {CONFETTI.map(p => (
          <div key={p.id} className={`confetti-piece shape-${p.shape}`} style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            background: p.color,
            width: p.size,
            height: p.shape === 2 ? p.size : p.size * 0.4,
            borderRadius: p.shape === 2 ? '50%' : p.shape === 1 ? '2px' : '1px',
          }} />
        ))}
      </div>
      {/* Firecracker bursts */}
      {[15,50,85].map((x, i) => (
        <div key={i} className="burst" style={{ left:`${x}%`, top:`${20 + i*15}%`, animationDelay:`${i*0.4}s` }}>
          {Array.from({length: 12}, (_, j) => (
            <div key={j} className="burst-ray" style={{ transform:`rotate(${j*30}deg)`, background: ['#FFD700','#FF6B6B','#60a5fa'][i] }} />
          ))}
        </div>
      ))}
      <div className="celebration-card" onClick={e => e.stopPropagation()}>
        <div className="cel-emoji">🎉</div>
        <h2 className="cel-title">Congratulations!</h2>
        <p className="cel-person">{celebrationPerson}</p>
        <p className="cel-msg">Task Completed Successfully</p>
        <div className="cel-divider" />
        <p className="cel-sub">✨ Keep doing Great work! ✨</p>
        <button className="cel-close" onClick={() => setShowCelebration(false)}>Awesome! 🚀</button>
      </div>
    </div>
  );

  // ── Analytics helpers ──────────────────────────────────────────────
  const buildAnalytics = (type) => {
    const all = (tasks || []).filter(t => (t.taskType || 'annotation') === type);
    const completed = all.filter(t => t.completedStatus);
    const active = all.filter(t => !t.completedStatus);
    const totalUnits = all.reduce((s, t) => s + (t.taskSize || 0), 0);
    const doneUnits  = all.reduce((s, t) => s + (t.completed || 0), 0);
    const completionRate = all.length ? Math.round((completed.length / all.length) * 100) : 0;
    const unitRate = totalUnits ? Math.round((doneUnits / totalUnits) * 100) : 0;
    const overdue = active.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length;
    const today = new Date(); today.setHours(0,0,0,0);
    const addedToday = all.filter(t => { const d = new Date(t.createdAt); d.setHours(0,0,0,0); return d.getTime() === today.getTime(); }).length;
    // per person
    const personMap = {};
    all.forEach(t => {
      if (!personMap[t.person]) personMap[t.person] = { name: t.person, total: 0, done: 0, units: 0, doneUnits: 0 };
      personMap[t.person].total++;
      if (t.completedStatus) personMap[t.person].done++;
      personMap[t.person].units += (t.taskSize || 0);
      personMap[t.person].doneUnits += (t.completed || 0);
    });
    const persons = Object.values(personMap).sort((a,b) => b.total - a.total);
    // priority split
    const priorities = {
      high:   all.filter(t => t.priority === 'high').length,
      medium: all.filter(t => t.priority === 'medium').length,
      low:    all.filter(t => t.priority === 'low').length,
    };
    // last 7 days activity
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
      const count = all.filter(t => { const td = new Date(t.createdAt); td.setHours(0,0,0,0); return td.getTime() === d.getTime(); }).length;
      days.push({ label, count });
    }
    const maxDay = Math.max(...days.map(d => d.count), 1);
    // recent 5 tasks
    const recent = [...all].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    return { all, completed, active, totalUnits, doneUnits, completionRate, unitRate, overdue, addedToday, persons, priorities, days, maxDay, recent };
  };

  const AnalyticsDashboard = ({ type, accent }) => {
    const d = buildAnalytics(type);
    const label = type === 'annotation' ? 'Annotation' : 'QA';
    const circumference = 2 * Math.PI * 40;
    return (
      <div className="analytics-panel">
        <div className="analytics-header">
          <span className="analytics-type-badge" style={{background: accent}}>{label}</span>
          <h2 className="analytics-title"><FiBarChart2 /> {label} Analytics</h2>
          <span className="analytics-updated">Live · {new Date().toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'})}</span>
        </div>

        {/* KPI row */}
        <div className="an-kpi-row">
          <div className="an-kpi"><FiTarget className="an-kpi-icon" /><span className="an-kpi-val">{d.all.length}</span><span className="an-kpi-label">Total Tasks</span></div>
          <div className="an-kpi"><FiClock className="an-kpi-icon" style={{color:'#60a5fa'}} /><span className="an-kpi-val" style={{color:'#60a5fa'}}>{d.active.length}</span><span className="an-kpi-label">Active</span></div>
          <div className="an-kpi"><FiCheckCircle className="an-kpi-icon" style={{color:'#4ade80'}} /><span className="an-kpi-val" style={{color:'#4ade80'}}>{d.completed.length}</span><span className="an-kpi-label">Completed</span></div>
          <div className="an-kpi"><FiAlertCircle className="an-kpi-icon" style={{color:'#f87171'}} /><span className="an-kpi-val" style={{color:'#f87171'}}>{d.overdue}</span><span className="an-kpi-label">Overdue</span></div>
          <div className="an-kpi"><FiActivity className="an-kpi-icon" style={{color:'#a78bfa'}} /><span className="an-kpi-val" style={{color:'#a78bfa'}}>{d.addedToday}</span><span className="an-kpi-label">Added Today</span></div>
          <div className="an-kpi"><FiTrendingUp className="an-kpi-icon" style={{color:'#fbbf24'}} /><span className="an-kpi-val" style={{color:'#fbbf24'}}>{d.unitRate}%</span><span className="an-kpi-label">Unit Progress</span></div>
        </div>

        <div className="an-body">
          {/* Completion ring */}
          <div className="an-card an-ring-card">
            <h3 className="an-card-title"><FiAward /> Completion Rate</h3>
            <div className="an-ring-wrap">
              <svg viewBox="0 0 100 100" className="an-ring-svg">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="10" />
                <circle cx="50" cy="50" r="40" fill="none" stroke={accent} strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (d.completionRate / 100) * circumference}
                  strokeLinecap="round"
                  style={{transform:'rotate(-90deg)', transformOrigin:'50% 50%', transition:'stroke-dashoffset 1s ease'}}
                />
                <text x="50" y="46" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="900">{d.completionRate}%</text>
                <text x="50" y="62" textAnchor="middle" fill="#888" fontSize="7">COMPLETE</text>
              </svg>
            </div>
            <div className="an-ring-stats">
              <div className="an-ring-stat"><span style={{color:'#4ade80'}}>●</span> {d.completed.length} Done</div>
              <div className="an-ring-stat"><span style={{color:'#60a5fa'}}>●</span> {d.active.length} Active</div>
            </div>
            <div className="an-units-bar-wrap">
              <div className="an-units-label"><span>Units Progress</span><span>{d.doneUnits} / {d.totalUnits}</span></div>
              <div className="an-units-track"><div className="an-units-fill" style={{width:`${d.unitRate}%`, background: accent}} /></div>
            </div>
          </div>

          {/* Priority breakdown */}
          <div className="an-card">
            <h3 className="an-card-title"><FiAlertCircle /> Priority Breakdown</h3>
            {[['high','#FFD700',d.priorities.high],['medium','#94a3b8',d.priorities.medium],['low','#475569',d.priorities.low]].map(([p,c,v]) => (
              <div key={p} className="an-prio-row">
                <span className="an-prio-label">{p.toUpperCase()}</span>
                <div className="an-prio-track">
                  <div className="an-prio-fill" style={{width: d.all.length ? `${(v/d.all.length)*100}%` : '0%', background: c}} />
                </div>
                <span className="an-prio-count">{v}</span>
              </div>
            ))}
            <div className="an-spacer" />
            <h3 className="an-card-title" style={{marginTop:'1rem'}}><FiCalendar /> 7-Day Activity</h3>
            <div className="an-bar-chart">
              {d.days.map((day, i) => (
                <div key={i} className="an-bar-col">
                  <div className="an-bar-track">
                    <div className="an-bar-fill" style={{height:`${(day.count/d.maxDay)*100}%`, background: accent}} />
                  </div>
                  <span className="an-bar-count">{day.count}</span>
                  <span className="an-bar-label">{day.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Per-person breakdown */}
          <div className="an-card an-card-wide">
            <h3 className="an-card-title"><FiUser /> Team Breakdown</h3>
            {d.persons.length === 0 ? <p className="an-empty">No data yet</p> : (
              <div className="an-person-table">
                <div className="an-person-thead">
                  <span>Person</span><span>Tasks</span><span>Done</span><span>Units Done / Total</span><span>Progress</span>
                </div>
                {d.persons.map(p => {
                  const pct = p.total ? Math.round((p.done/p.total)*100) : 0;
                  const uPct = p.units ? Math.round((p.doneUnits/p.units)*100) : 0;
                  return (
                    <div key={p.name} className="an-person-row">
                      <span className="an-person-name"><FiUser style={{opacity:.5}} /> {p.name}</span>
                      <span className="an-person-num">{p.total}</span>
                      <span className="an-person-num" style={{color:'#4ade80'}}>{p.done}</span>
                      <span className="an-person-num">{p.doneUnits} / {p.units}</span>
                      <div className="an-person-bar-wrap">
                        <div className="an-person-bar-track">
                          <div className="an-person-bar-fill" style={{width:`${pct}%`, background: accent}} />
                        </div>
                        <span className="an-person-pct">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent tasks */}
          <div className="an-card an-card-wide">
            <h3 className="an-card-title"><FiActivity /> Recent Tasks</h3>
            {d.recent.length === 0 ? <p className="an-empty">No tasks yet</p> : (
              <div className="an-recent-list">
                {d.recent.map(t => (
                  <div key={t.id} className="an-recent-row">
                    <div className={`an-recent-dot ${t.completedStatus ? 'done' : t.dueDate && new Date(t.dueDate) < new Date() ? 'overdue' : 'active'}`} />
                    <div className="an-recent-info">
                      <span className="an-recent-name">{t.person}</span>
                      <span className="an-recent-task">{t.task}</span>
                    </div>
                    <div className="an-recent-meta">
                      <span className={`an-recent-badge priority-badge ${t.priority}`}>{t.priority.toUpperCase()}</span>
                      {t.dueDate && <span className="an-recent-due"><FiCalendar /> {new Date(t.dueDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>}
                      <span className="an-recent-created">{new Date(t.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'})}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      {showCelebration && <CelebrationOverlay />}
      {showPasswordPrompt && (
        <div className="modal-overlay" onClick={() => setShowPasswordPrompt(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title"><FiLock />Admin Access</h2>
            <p className="modal-subtitle">Enter password</p>
            <form onSubmit={handlePasswordSubmit}>
              <input type="password" placeholder="Password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="password-input" autoFocus />
              <div className="modal-buttons">
                <button type="submit" className="btn-submit">Login</button>
                <button type="button" onClick={() => { setShowPasswordPrompt(false); setPasswordInput(''); }} className="btn-cancel-modal">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editingTask && (
        <div className="modal-overlay" onClick={() => setEditingTask(null)}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title"><FiEdit3 />Edit Task</h2>
            <form onSubmit={saveEditTask} className="edit-form">
              <label className="edit-label">Person Name</label>
              <input type="text" value={editPerson} onChange={(e) => setEditPerson(e.target.value)} className="password-input" placeholder="Person name" />
              <label className="edit-label">Task Description</label>
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="password-input edit-textarea" placeholder="Task description" rows={3} />
              <label className="edit-label">Task Size (total units)</label>
              <input type="number" value={editSize} onChange={(e) => setEditSize(e.target.value)} className="password-input" placeholder="Task size" min="0" />
              <div className="modal-buttons">
                <button type="submit" className="btn-submit">Save Changes</button>
                <button type="button" onClick={() => setEditingTask(null)} className="btn-cancel-modal">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {loading ? (
        <div className="loading-screen"><div className="loading-spinner"></div><p>Loading...</p></div>
      ) : (
        <div className="container">
          <div className="header">
            <div className="header-top">
              <div className="logo-section"><MdDashboard className="logo-icon" /><h1>Task Manager</h1></div>
              <div className="nav-group">
                <nav className="type-nav">
                  <button className={`type-nav-btn ${taskType === 'annotation' ? 'active' : ''}`} onClick={() => setTaskType('annotation')}>Annotation</button>
                  <button className={`type-nav-btn ${taskType === 'qa' ? 'active' : ''}`} onClick={() => setTaskType('qa')}>QA</button>
                </nav>
                <button className={`analytics-standalone-btn ${taskType === 'analytics' ? 'active' : ''}`} onClick={() => setTaskType('analytics')}><FiBarChart2 /> Analytics</button>
              </div>
              <div className="admin-controls">
                {isAdmin ? (
                  <div className="admin-badge-container">
                    <span className="admin-badge"><FiShield />Admin Mode</span>
                    <button onClick={handleLogout} className="btn-logout"><FiLogOut />Logout</button>
                  </div>
                ) : (
                  <button onClick={() => setShowPasswordPrompt(true)} className="btn-admin-login"><FiLock />Admin Login</button>
                )}
              </div>
            </div>
          </div>
          <div className="main-content">
            {taskType === 'analytics' ? (
              <div className="analytics-root">
                <AnalyticsDashboard type="annotation" accent="#FFD700" />
                <AnalyticsDashboard type="qa" accent="#60a5fa" />
              </div>
            ) : (
              <>
            <div className="stats-bar">
              <div className="stat-item"><MdDashboard className="stat-icon" /><div className="stat-content"><span className="stat-value">{stats.total}</span><span className="stat-label">Total</span></div></div>
              <div className="stat-item"><FiClock className="stat-icon" /><div className="stat-content"><span className="stat-value">{stats.active}</span><span className="stat-label">Active</span></div></div>
              <div className="stat-item"><FiCheckCircle className="stat-icon" /><div className="stat-content"><span className="stat-value">{stats.completed}</span><span className="stat-label">Completed</span></div></div>
              <div className="stat-item stat-highlight"><FiAlertCircle className="stat-icon" /><div className="stat-content"><span className="stat-value">{stats.highPriority}</span><span className="stat-label">High Priority</span></div></div>
            </div>
            {isAdmin && (
              <form onSubmit={addTask} className="task-form">
                <div className="form-row">
                  <div className="person-select-wrap">
                    {isAddingPerson ? (
                      <div className="person-add-inline">
                        <input
                          type="text"
                          placeholder="New person name"
                          value={newPersonInput}
                          onChange={(e) => setNewPersonInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmAddPerson(); } if (e.key === 'Escape') { setIsAddingPerson(false); setNewPersonInput(''); } }}
                          className="input"
                          autoFocus
                        />
                        <button type="button" className="btn-confirm-person" onClick={confirmAddPerson}>✓</button>
                        <button type="button" className="btn-cancel-person" onClick={() => { setIsAddingPerson(false); setNewPersonInput(''); }}>✕</button>
                      </div>
                    ) : (
                      <select
                        value={personName}
                        onChange={(e) => { if (e.target.value === '__add__') { setIsAddingPerson(true); setPersonName(''); } else { setPersonName(e.target.value); } }}
                        className="select"
                      >
                        <option value="">Select Person</option>
                        {persons.map(p => <option key={p} value={p}>{p}</option>)}
                        <option value="__add__">➕ Add new person...</option>
                      </select>
                    )}
                  </div>
                  <input type="text" placeholder="Task" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} className="input flex-2" />
                  <input type="number" placeholder="Size" value={taskSize} onChange={(e) => setTaskSize(e.target.value)} className="input" min="0" />
                </div>
                <div className="form-row">
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="select">
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
                  <button type="submit" className="btn-add"><FiPlus />Add Task</button>
                </div>
              </form>
            )}
            <div className="controls">
              <div className="search-box"><FiSearch className="search-icon" /><input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" /></div>
              <div className="filter-buttons">
                <button className={`filter-btn ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>Active</button>
                <button className={`filter-btn ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>Completed</button>
              </div>
            </div>
            <div className="tasks-list">
              {filteredTasks.length === 0 ? (
                <div className="empty-state"><p>No tasks</p></div>
              ) : (
                filteredTasks.map(task => (
                  <div key={task.id} className={`task-card priority-${task.priority}`}>
                    <div className={`task-item ${task.completedStatus ? 'completed' : ''}`}>
                      {isAdmin && (<div className="task-checkbox"><input type="checkbox" checked={task.completedStatus} onChange={() => toggleTask(task.id)} id={`task-${task.id}`} /><label htmlFor={`task-${task.id}`}></label></div>)}
                      <div className="task-content">
                        <div className="task-header-row">
                          <div className="task-person"><FiUser className="person-icon" />{task.person}</div>
                          <div className="task-badges">
                            <span className={`priority-badge ${task.priority}`}>{task.priority.toUpperCase()}</span>
                            {task.dueDate && <span className="due-date">{new Date(task.dueDate).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        <div className="task-description">{task.task}</div>
                        {task.taskSize > 0 && (
                          <div className="progress-section">
                            <div className="progress-bar-container">
                              <div className="progress-bar-fill" style={{width: `${(task.completed / task.taskSize) * 100}%`}}></div>
                              <span className="progress-text">{task.completed} / {task.taskSize}</span>
                            </div>
                            <div className="progress-controls">
                              <button className="progress-btn minus" onClick={() => incrementProgress(task.id, -1)} disabled={task.completed <= 0}><FiMinus /></button>
                              <button className="progress-btn plus" onClick={() => incrementProgress(task.id, 1)} disabled={task.completed >= task.taskSize}><FiPlus /></button>
                              <button className="progress-btn edit" onClick={() => { setEditingProgress(task.id); setProgressValue(task.completed.toString()); }}><FiEdit3 />Edit</button>
                            </div>
                            {editingProgress === task.id && (
                              <div className="progress-edit">
                                <input type="number" value={progressValue} onChange={(e) => setProgressValue(e.target.value)} className="progress-input" min="0" max={task.taskSize} autoFocus />
                                <button className="progress-save" onClick={() => updateProgress(task.id)}>Save</button>
                                <button className="progress-cancel" onClick={() => { setEditingProgress(null); setProgressValue(''); }}>Cancel</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {isAdmin && (
                        <div className="task-admin-actions">
                          <button onClick={() => openEditTask(task)} className="btn-edit-task" title="Edit task"><FiEdit3 /></button>
                          <button onClick={() => deleteTask(task.id)} className="btn-delete" title="Delete task"><FiTrash2 /></button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {stats.completed > 0 && (
              <div className="export-section">
                <button className="btn-export" onClick={exportToExcel}><FiDownload />Export</button>
                <span className="export-info">{stats.completed} completed</span>
              </div>
            )}
            </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
