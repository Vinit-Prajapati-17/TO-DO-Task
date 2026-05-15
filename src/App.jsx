import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { FiUser, FiCheckCircle, FiClock, FiAlertCircle, FiSearch, FiPlus, FiTrash2, FiEdit3, FiLock, FiLogOut, FiShield, FiDownload, FiMinus } from 'react-icons/fi';
import { MdDashboard } from 'react-icons/md';
import './AppStyles.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [personName, setPersonName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [taskSize, setTaskSize] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProgress, setEditingProgress] = useState(null);
  const [progressValue, setProgressValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  const ADMIN_PASSWORD = 'admin123';

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
      } catch (error) { console.error('Error:', error); }
    }
  };

  const deleteTask = async (id) => {
    if (!isAdmin) { alert('Only admin can delete tasks!'); return; }
    if (window.confirm('Are you sure?')) {
      try { await deleteDoc(doc(db, 'tasks', id)); } catch (error) { console.error('Error:', error); }
    }
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
    let filtered = tasks || [];
    if (filter === 'active') filtered = filtered.filter(t => !t.completedStatus);
    else if (filter === 'completed') filtered = filtered.filter(t => t.completedStatus);
    if (searchQuery.trim()) filtered = filtered.filter(t => (t.person||'').toLowerCase().includes(searchQuery.toLowerCase()) || (t.task||'').toLowerCase().includes(searchQuery.toLowerCase()));
    return filtered;
  };

  const filteredTasks = getFilteredTasks();
  const stats = {
    total: (tasks||[]).length,
    active: (tasks||[]).filter(t => !t.completedStatus).length,
    completed: (tasks||[]).filter(t => t.completedStatus).length,
    highPriority: (tasks||[]).filter(t => t.priority === 'high' && !t.completedStatus).length
  };

  return (
    <div className="app">
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
      {loading ? (
        <div className="loading-screen"><div className="loading-spinner"></div><p>Loading...</p></div>
      ) : (
        <div className="container">
          <div className="header">
            <div className="header-top">
              <div className="logo-section"><MdDashboard className="logo-icon" /><h1>Task Manager</h1></div>
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
            <div className="stats-bar">
              <div className="stat-item"><MdDashboard className="stat-icon" /><div className="stat-content"><span className="stat-value">{stats.total}</span><span className="stat-label">Total</span></div></div>
              <div className="stat-item"><FiClock className="stat-icon" /><div className="stat-content"><span className="stat-value">{stats.active}</span><span className="stat-label">Active</span></div></div>
              <div className="stat-item"><FiCheckCircle className="stat-icon" /><div className="stat-content"><span className="stat-value">{stats.completed}</span><span className="stat-label">Completed</span></div></div>
              <div className="stat-item stat-highlight"><FiAlertCircle className="stat-icon" /><div className="stat-content"><span className="stat-value">{stats.highPriority}</span><span className="stat-label">High Priority</span></div></div>
            </div>
            {isAdmin && (
              <form onSubmit={addTask} className="task-form">
                <div className="form-row">
                  <input type="text" placeholder="Person" value={personName} onChange={(e) => setPersonName(e.target.value)} className="input" />
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
                <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
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
                      {isAdmin && <button onClick={() => deleteTask(task.id)} className="btn-delete"><FiTrash2 /></button>}
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
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
