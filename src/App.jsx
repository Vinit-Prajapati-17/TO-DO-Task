import { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';

function App() {
  const [tasks, setTasks] = useState([]);
  const [personName, setPersonName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [taskSize, setTaskSize] = useState('');
  const [showSubtaskInput, setShowSubtaskInput] = useState(null);
  const [subtaskText, setSubtaskText] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProgress, setEditingProgress] = useState(null);
  const [progressValue, setProgressValue] = useState('');
  const [loading, setLoading] = useState(true);

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
          subtasks: [],
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

  const addSubtask = async (taskId) => {
    if (subtaskText.trim()) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        try {
          await updateDoc(doc(db, 'tasks', taskId), {
            subtasks: [...task.subtasks, {
              id: Date.now(),
              text: subtaskText.trim(),
              completed: false
            }]
          });
          setSubtaskText('');
          setShowSubtaskInput(null);
        } catch (error) {
          console.error('Error adding subtask:', error);
        }
      }
    }
  };

  const toggleSubtask = async (taskId, subtaskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      try {
        const updatedSubtasks = task.subtasks.map(subtask =>
          subtask.id === subtaskId
            ? { ...subtask, completed: !subtask.completed }
            : subtask
        );
        await updateDoc(doc(db, 'tasks', taskId), {
          subtasks: updatedSubtasks
        });
      } catch (error) {
        console.error('Error toggling subtask:', error);
      }
    }
  };

  const deleteSubtask = async (taskId, subtaskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      try {
        const updatedSubtasks = task.subtasks.filter(subtask => subtask.id !== subtaskId);
        await updateDoc(doc(db, 'tasks', taskId), {
          subtasks: updatedSubtasks
        });
      } catch (error) {
        console.error('Error deleting subtask:', error);
      }
    }
  };

  const toggleTask = async (id) => {
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
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const exportToExcel = () => {
    const completedTasks = tasks.filter(task => task.completedStatus);
    
    if (completedTasks.length === 0) {
      alert('No completed tasks to export!');
      return;
    }

    // Create CSV content
    let csvContent = "Person Name,Task Description,Priority,Due Date,Task Size,Completed Amount,Subtasks Completed,Created Date\n";
    
    completedTasks.forEach(task => {
      const subtasksCompleted = task.subtasks.length > 0 
        ? `${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length}`
        : 'N/A';
      
      const row = [
        task.person,
        task.task.replace(/,/g, ';'), // Replace commas to avoid CSV issues
        task.priority,
        task.dueDate || 'N/A',
        task.taskSize || 'N/A',
        task.completed || 'N/A',
        subtasksCompleted,
        new Date(task.createdAt).toLocaleDateString()
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
    let filtered = tasks;

    if (filter === 'active') {
      filtered = filtered.filter(task => !task.completedStatus);
    } else if (filter === 'completed') {
      filtered = filtered.filter(task => task.completedStatus);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(task => 
        task.person.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.task.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredTasks = getFilteredTasks();
  const stats = {
    total: tasks.length,
    active: tasks.filter(t => !t.completedStatus).length,
    completed: tasks.filter(t => t.completedStatus).length,
    highPriority: tasks.filter(t => t.priority === 'high' && !t.completedStatus).length
  };

  return (
    <div className="app">
      {loading ? (
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading tasks...</p>
        </div>
      ) : (
        <div className="container">
          <div className="header">
          <h1>⚡ TASK MANAGER</h1>
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.active}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.completed}</span>
              <span className="stat-label">Done</span>
            </div>
            <div className="stat-item highlight">
              <span className="stat-value">{stats.highPriority}</span>
              <span className="stat-label">High Priority</span>
            </div>
          </div>
        </div>
        
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
            <button type="submit" className="btn-add">+ ADD TASK</button>
          </div>
        </form>

        <div className="controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Search tasks..."
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
                  <div className="task-checkbox">
                    <input
                      type="checkbox"
                      checked={task.completedStatus}
                      onChange={() => toggleTask(task.id)}
                      id={`task-${task.id}`}
                    />
                    <label htmlFor={`task-${task.id}`}></label>
                  </div>
                  <div className="task-content">
                    <div className="task-header-row">
                      <div className="task-person">👤 {task.person}</div>
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
                            −
                          </button>
                          <button 
                            className="progress-btn plus"
                            onClick={() => incrementProgress(task.id, 1)}
                            disabled={task.completed >= task.taskSize}
                          >
                            +
                          </button>
                          <button 
                            className="progress-btn edit"
                            onClick={() => {
                              setEditingProgress(task.id);
                              setProgressValue(task.completed.toString());
                            }}
                          >
                            ✏️ Edit
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

                    {task.subtasks.length > 0 && (
                      <div className="subtask-progress">
                        <span className="subtask-count">
                          📝 {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
                        </span>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => deleteTask(task.id)} 
                    className="btn-delete"
                    aria-label="Delete task"
                  >
                    ×
                  </button>
                </div>

                {task.subtasks.length > 0 && (
                  <div className="subtasks-list">
                    {task.subtasks.map(subtask => (
                      <div key={subtask.id} className={`subtask-item ${subtask.completed ? 'completed' : ''}`}>
                        <div className="task-checkbox">
                          <input
                            type="checkbox"
                            checked={subtask.completed}
                            onChange={() => toggleSubtask(task.id, subtask.id)}
                            id={`subtask-${subtask.id}`}
                          />
                          <label htmlFor={`subtask-${subtask.id}`}></label>
                        </div>
                        <div className="subtask-text">{subtask.text}</div>
                        <button 
                          onClick={() => deleteSubtask(task.id, subtask.id)} 
                          className="btn-delete-small"
                          aria-label="Delete subtask"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {showSubtaskInput === task.id ? (
                  <div className="subtask-input-container">
                    <input
                      type="text"
                      placeholder="Enter subtask..."
                      value={subtaskText}
                      onChange={(e) => setSubtaskText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSubtask(task.id)}
                      className="subtask-input"
                      autoFocus
                    />
                    <button onClick={() => addSubtask(task.id)} className="btn-add-subtask">
                      Add
                    </button>
                    <button onClick={() => {
                      setShowSubtaskInput(null);
                      setSubtaskText('');
                    }} className="btn-cancel">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowSubtaskInput(task.id)} 
                    className="btn-add-subtask-trigger"
                  >
                    + Add Subtask
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {stats.completed > 0 && (
          <div className="export-section">
            <button className="btn-export" onClick={exportToExcel}>
              📊 Export Completed Tasks to Excel
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
