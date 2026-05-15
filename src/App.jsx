import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { FiUser, FiCheckCircle, FiClock, FiAlertCircle, FiSearch, FiPlus, FiTrash2, FiEdit3, FiLock, FiLogOut, FiShield, FiDownload, FiMinus } from 'react-icons/fi';
import { MdDashboard } from 'react-icons/md';

// Inline styles - Modern Black, Yellow, White Theme
const styles = {
  app: {
    minHeight: '100vh',
    background: '#0a0a0a',
    padding: '0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  container: {
    maxWidth: '100%',
    margin: '0',
    background: '#0a0a0a',
    minHeight: '100vh'
  },
  header: {
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    padding: '2.5rem 2rem',
    color: 'white'
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2.5rem',
    gap: '2rem',
    flexWrap: 'wrap'
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  logoIcon: {
    fontSize: '3rem',
    color: 'white'
  },
  h1: {
    fontSize: '2.25rem',
    fontWeight: '800',
    letterSpacing: '-0.025em',
    margin: 0
  },
  adminControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  adminBadgeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    background: 'rgba(255, 255, 255, 0.15)',
    padding: '0.75rem 1.25rem',
    borderRadius: '100px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  adminBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    background: 'rgba(255, 255, 255, 0.25)',
    padding: '0.5rem 1rem',
    borderRadius: '100px',
    fontSize: '0.875rem',
    fontWeight: '700'
  },
  btnLogout: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1.25rem',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '100px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  btnAdminLogin: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '0.875rem 1.75rem',
    background: 'white',
    color: '#6366f1',
    border: 'none',
    borderRadius: '100px',
    fontSize: '0.9375rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  },
  statsBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.5rem'
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '20px',
    padding: '1.75rem',
    transition: 'all 0.3s ease'
  },
  statIcon: {
    fontSize: '2.5rem',
    color: 'white'
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  statValue: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: 'white',
    lineHeight: '1'
  },
  statLabel: {
    fontSize: '0.875rem',
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  taskForm: {
    padding: '2.5rem 2rem',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb'
  },
  formRow: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    flexWrap: 'wrap'
  },
  input: {
    padding: '1rem 1.25rem',
    border: '2px solid #e5e7eb',
    borderRadius: '16px',
    background: 'white',
    fontSize: '1rem',
    fontWeight: '500',
    flex: '1',
    minWidth: '200px'
  },
  select: {
    padding: '1rem 1.25rem',
    border: '2px solid #e5e7eb',
    borderRadius: '16px',
    background: 'white',
    fontSize: '1rem',
    fontWeight: '500',
    flex: '1',
    minWidth: '200px',
    cursor: 'pointer'
  },
  btnAdd: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.625rem',
    padding: '1rem 2.5rem',
    background: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)',
    textTransform: 'uppercase'
  },
  controls: {
    padding: '2rem',
    background: 'white',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '2rem',
    flexWrap: 'wrap'
  },
  searchBox: {
    position: 'relative',
    flex: '1',
    maxWidth: '500px'
  },
  searchIcon: {
    position: 'absolute',
    left: '1.25rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#4b5563',
    fontSize: '1.25rem',
    pointerEvents: 'none'
  },
  searchInput: {
    width: '100%',
    padding: '1rem 1.25rem 1rem 3.5rem',
    border: '2px solid #e5e7eb',
    borderRadius: '16px',
    background: '#f9fafb',
    fontSize: '1rem',
    fontWeight: '500'
  },
  filterButtons: {
    display: 'flex',
    gap: '0.75rem',
    background: '#f3f4f6',
    padding: '0.5rem',
    borderRadius: '16px'
  },
  filterBtn: {
    padding: '0.75rem 1.5rem',
    background: 'transparent',
    color: '#374151',
    border: 'none',
    borderRadius: '12px',
    fontSize: '0.9375rem',
    fontWeight: '700',
    cursor: 'pointer',
    textTransform: 'uppercase'
  },
  filterBtnActive: {
    background: '#6366f1',
    color: 'white',
    boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.3)'
  },
  tasksList: {
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    background: '#f9fafb',
    minHeight: '500px'
  },
  taskCard: {
    background: 'white',
    borderRadius: '20px',
    padding: '2rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    border: '2px solid transparent',
    borderLeft: '6px solid #6366f1'
  },
  taskItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1.5rem'
  },
  taskContent: {
    flex: '1'
  },
  taskHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  taskPerson: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontWeight: '800',
    color: '#111827',
    fontSize: '1.125rem'
  },
  taskBadges: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap'
  },
  priorityBadge: {
    padding: '0.5rem 1rem',
    borderRadius: '100px',
    fontSize: '0.75rem',
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  taskDescription: {
    color: '#374151',
    fontSize: '1rem',
    lineHeight: '1.75',
    fontWeight: '500',
    marginBottom: '1.5rem'
  },
  progressSection: {
    marginTop: '1.5rem',
    padding: '1.5rem',
    background: '#f9fafb',
    borderRadius: '16px',
    border: '2px solid #e5e7eb'
  },
  progressBarContainer: {
    position: 'relative',
    height: '48px',
    background: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    marginBottom: '1.25rem',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)',
    transition: 'width 0.4s ease'
  },
  progressText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '0.9375rem',
    fontWeight: '800',
    color: '#111827'
  },
  progressControls: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  progressBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.875rem 1.5rem',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    background: 'white'
  },
  btnDelete: {
    width: '48px',
    height: '48px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    background: 'white',
    color: '#ef4444',
    fontSize: '1.25rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  exportSection: {
    padding: '2.5rem 2rem',
    background: '#111827',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '2rem',
    flexWrap: 'wrap'
  },
  btnExport: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1.125rem 2.5rem',
    background: 'white',
    color: '#111827',
    border: 'none',
    borderRadius: '16px',
    fontSize: '1.0625rem',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
    textTransform: 'uppercase'
  },
  exportInfo: {
    color: 'white',
    fontSize: '1rem',
    fontWeight: '700'
  },
  loadingScreen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '500px',
    padding: '4rem'
  }
};

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
  
  const ADMIN_PASSWORD = 'admin123'; // Change this to your desired password

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowPasswordPrompt(false);
      setPasswordInput('');
      localStorage.setItem('isAdmin', 'true');
    } else {
      alert('❌ Incorrect password!');
      setPasswordInput('');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('isAdmin');
  };

  // Check if user was previously logged in as admin
  useEffect(() => {
    const savedAdminStatus = localStorage.getItem('isAdmin');
    if (savedAdminStatus === 'true') {
      setIsAdmin(true);
    }
  }, []);

  // Real-time listener for tasks
  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData);
      setLoading(false);
      console.log('✅ Firebase connected! Tasks loaded:', tasksData.length);
    }, (error) => {
      console.error('❌ Firebase Error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Show user-friendly error
      if (error.code === 'permission-denied') {
        alert('⚠️ Firebase Error: Permission denied. Please enable Firestore Database in Firebase Console and set security rules to test mode.');
      } else if (error.code === 'failed-precondition') {
        alert('⚠️ Firebase Error: Firestore is not enabled. Please go to Firebase Console → Build → Firestore Database → Create Database');
      } else {
        alert('⚠️ Firebase Error: ' + error.message);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addTask = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('⚠️ Only admin can add tasks!');
      return;
    }
    if (personName.trim() && taskDescription.trim()) {
      try {
        console.log('📝 Adding task to Firebase...');
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
        console.log('✅ Task added successfully!');
        setPersonName('');
        setTaskDescription('');
        setPriority('medium');
        setDueDate('');
        setTaskSize('');
      } catch (error) {
        console.error('❌ Error adding task:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        if (error.code === 'permission-denied') {
          alert('⚠️ Permission denied! Please check Firebase security rules.\n\nGo to Firebase Console → Firestore Database → Rules and set:\n\nrules_version = \'2\';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}');
        } else {
          alert('Failed to add task: ' + error.message);
        }
      }
    }
  };

  const updateProgress = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    const newCompleted = parseInt(progressValue) || 0;
    
    if (newCompleted >= 0 && newCompleted <= task.taskSize) {
      try {
        await updateDoc(doc(db, 'tasks', taskId), {
          completed: newCompleted,
          completedStatus: newCompleted >= task.taskSize
        });
        setEditingProgress(null);
        setProgressValue('');
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    }
  };

  const incrementProgress = async (taskId, amount) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const newCompleted = Math.min(Math.max(task.completed + amount, 0), task.taskSize);
      try {
        await updateDoc(doc(db, 'tasks', taskId), {
          completed: newCompleted,
          completedStatus: newCompleted >= task.taskSize
        });
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    }
  };

  const toggleTask = async (id) => {
    if (!isAdmin) {
      alert('⚠️ Only admin can mark tasks as complete!');
      return;
    }
    const task = tasks.find(t => t.id === id);
    if (task) {
      const newStatus = !task.completedStatus;
      try {
        await updateDoc(doc(db, 'tasks', id), {
          completedStatus: newStatus,
          completed: newStatus ? task.taskSize : 0
        });
      } catch (error) {
        console.error('Error toggling task:', error);
      }
    }
  };

  const deleteTask = async (id) => {
    if (!isAdmin) {
      alert('⚠️ Only admin can delete tasks!');
      return;
    }
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const exportToExcel = () => {
    const completedTasks = tasks.filter(task => task.completedStatus);
    
    if (completedTasks.length === 0) {
      alert('No completed tasks to export!');
      return;
    }

    // Create CSV content
    let csvContent = "Person Name,Task Description,Priority,Due Date,Task Size,Completed Amount,Created Date\n";
    
    completedTasks.forEach(task => {
      const row = [
        task.person || '',
        (task.task || '').replace(/,/g, ';'),
        task.priority || 'N/A',
        task.dueDate || 'N/A',
        task.taskSize || 'N/A',
        task.completed || 'N/A',
        task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A'
      ].join(',');
      
      csvContent += row + "\n";
    });

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `completed_tasks_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFilteredTasks = () => {
    let filtered = tasks || [];

    if (filter === 'active') {
      filtered = filtered.filter(task => !task.completedStatus);
    } else if (filter === 'completed') {
      filtered = filtered.filter(task => task.completedStatus);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(task => 
        (task.person || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.task || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredTasks = getFilteredTasks();
  const stats = {
    total: (tasks || []).length,
    active: (tasks || []).filter(t => !t.completedStatus).length,
    completed: (tasks || []).filter(t => t.completedStatus).length,
    highPriority: (tasks || []).filter(t => t.priority === 'high' && !t.completedStatus).length
  };

  return (
    <div style={styles.app}>
      {showPasswordPrompt && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowPasswordPrompt(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              borderRadius: '20px',
              padding: '2.5rem',
              maxWidth: '420px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(255, 215, 0, 0.4)',
              border: '3px solid #FFD700',
              position: 'relative'
            }}
          >
            <h2 style={{
              textAlign: 'center',
              color: '#000000',
              fontSize: '1.75rem',
              fontWeight: 900,
              marginBottom: '0.5rem',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem'
            }}>
              <FiLock style={{ fontSize: '1.5rem' }} />
              Admin Access
            </h2>
            <p className="modal-subtitle" style={{
              textAlign: 'center',
              color: '#6c757d',
              fontSize: '0.9rem',
              fontWeight: 600,
              marginBottom: '1.5rem'
            }}>Enter password to manage tasks</p>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                placeholder="Enter admin password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="password-input"
                autoFocus
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '3px solid #dee2e6',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '1.5rem',
                  background: '#ffffff',
                  boxSizing: 'border-box'
                }}
              />
              <div className="modal-buttons" style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="submit" 
                  className="btn-submit"
                  style={{
                    flex: 1,
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    color: '#000000',
                    border: '3px solid #FFD700',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)'
                  }}
                >Login</button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowPasswordPrompt(false);
                    setPasswordInput('');
                  }} 
                  className="btn-cancel-modal"
                  style={{
                    flex: 1,
                    padding: '1rem',
                    background: '#ffffff',
                    color: '#000000',
                    border: '3px solid #000000',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {loading ? (
        <div style={styles.loadingScreen}>
          <div className="loading-spinner"></div>
          <p>Loading tasks...</p>
        </div>
      ) : (
        <div style={styles.container}>
          <div style={styles.header}>
            <div style={styles.headerTop}>
              <div style={styles.logoSection}>
                <MdDashboard style={styles.logoIcon} />
                <h1 style={styles.h1}>Task Manager</h1>
              </div>
              <div style={styles.adminControls}>
                {isAdmin ? (
                  <div style={styles.adminBadgeContainer}>
                    <span style={styles.adminBadge}>
                      <FiShield className="badge-icon" />
                      Admin Mode
                    </span>
                    <button onClick={handleLogout} style={styles.btnLogout}>
                      <FiLogOut className="btn-icon" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowPasswordPrompt(true)} 
                    style={styles.btnAdminLogin}
                  >
                    <FiLock className="btn-icon" />
                    Admin Login
                  </button>
                )}
              </div>
            </div>
          <div style={styles.statsBar}>
            <div style={styles.statItem}>
              <MdDashboard style={styles.statIcon} />
              <div style={styles.statContent}>
                <span style={styles.statValue}>{stats.total}</span>
                <span style={styles.statLabel}>Total Tasks</span>
              </div>
            </div>
            <div style={styles.statItem}>
              <FiClock style={styles.statIcon} />
              <div style={styles.statContent}>
                <span style={styles.statValue}>{stats.active}</span>
                <span style={styles.statLabel}>Active</span>
              </div>
            </div>
            <div style={styles.statItem}>
              <FiCheckCircle style={styles.statIcon} />
              <div style={styles.statContent}>
                <span style={styles.statValue}>{stats.completed}</span>
                <span style={styles.statLabel}>Completed</span>
              </div>
            </div>
            <div style={{...styles.statItem, background: 'rgba(245, 158, 11, 0.25)', borderColor: 'rgba(245, 158, 11, 0.4)'}}>
              <FiAlertCircle style={styles.statIcon} />
              <div style={styles.statContent}>
                <span style={styles.statValue}>{stats.highPriority}</span>
                <span style={styles.statLabel}>High Priority</span>
              </div>
            </div>
          </div>
        </div>
        
        {isAdmin && (
          <form onSubmit={addTask} className="task-form">
            <div className="form-row">
            <input
              type="text"
              placeholder="Person Name"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              className="input"
            />
            <input
              type="text"
              placeholder="Task Description"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="input flex-2"
            />
            <input
              type="number"
              placeholder="Task Size"
              value={taskSize}
              onChange={(e) => setTaskSize(e.target.value)}
              className="input"
              min="0"
            />
          </div>
          <div className="form-row">
            <select 
              value={priority} 
              onChange={(e) => setPriority(e.target.value)}
              className="select"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input"
            />
            <button type="submit" className="btn-add">
              <FiPlus className="btn-icon" />
              Add Task
            </button>
          </div>
          </form>
        )}

        <div className="controls">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Active
            </button>
            <button 
              className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Completed
            </button>
          </div>
        </div>

        <div className="tasks-list">
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>No tasks found</p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div key={task.id} className={`task-card priority-${task.priority}`}>
                <div className={`task-item ${task.completedStatus ? 'completed' : ''}`}>
                  {isAdmin && (
                    <div className="task-checkbox">
                      <input
                        type="checkbox"
                        checked={task.completedStatus}
                        onChange={() => toggleTask(task.id)}
                        id={`task-${task.id}`}
                      />
                      <label htmlFor={`task-${task.id}`}></label>
                    </div>
                  )}
                  <div className="task-content">
                    <div className="task-header-row">
                      <div className="task-person">
                        <FiUser className="person-icon" />
                        {task.person}
                      </div>
                      <div className="task-badges">
                        <span className={`priority-badge ${task.priority}`}>
                          {task.priority === 'high' ? '🔥' : task.priority === 'medium' ? '⚡' : '📌'} {task.priority.toUpperCase()}
                        </span>
                        {task.dueDate && (
                          <span className="due-date">📅 {new Date(task.dueDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="task-description">{task.task}</div>
                    
                    {task.taskSize > 0 && (
                      <div className="progress-section">
                        <div className="progress-bar-container">
                          <div 
                            className="progress-bar-fill" 
                            style={{width: `${(task.completed / task.taskSize) * 100}%`}}
                          ></div>
                          <span className="progress-text">
                            {task.completed} / {task.taskSize} completed
                          </span>
                        </div>
                        
                        <div className="progress-controls">
                          <button 
                            className="progress-btn minus"
                            onClick={() => incrementProgress(task.id, -1)}
                            disabled={task.completed <= 0}
                          >
                            <FiMinus />
                          </button>
                          <button 
                            className="progress-btn plus"
                            onClick={() => incrementProgress(task.id, 1)}
                            disabled={task.completed >= task.taskSize}
                          >
                            <FiPlus />
                          </button>
                          <button 
                            className="progress-btn edit"
                            onClick={() => {
                              setEditingProgress(task.id);
                              setProgressValue(task.completed.toString());
                            }}
                          >
                            <FiEdit3 className="btn-icon" />
                            Edit
                          </button>
                        </div>

                        {editingProgress === task.id && (
                          <div className="progress-edit">
                            <input
                              type="number"
                              value={progressValue}
                              onChange={(e) => setProgressValue(e.target.value)}
                              className="progress-input"
                              min="0"
                              max={task.taskSize}
                              placeholder="Enter completed amount"
                              autoFocus
                            />
                            <button 
                              className="progress-save"
                              onClick={() => updateProgress(task.id)}
                            >
                              Save
                            </button>
                            <button 
                              className="progress-cancel"
                              onClick={() => {
                                setEditingProgress(null);
                                setProgressValue('');
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => deleteTask(task.id)} 
                      className="btn-delete"
                      aria-label="Delete task"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {stats.completed > 0 && (
          <div className="export-section">
            <button className="btn-export" onClick={exportToExcel}>
              <FiDownload className="btn-icon" />
              Export Completed Tasks
            </button>
            <span className="export-info">
              {stats.completed} completed task{stats.completed !== 1 ? 's' : ''} ready to export
            </span>
          </div>
        )}
        </div>
      )}
    </div>
  );
}

export default App;
