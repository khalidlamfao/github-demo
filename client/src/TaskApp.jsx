import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');
  const socketRef = useRef(null);

  const token = localStorage.getItem('token');

  const axiosInstance = axios.create({
    baseURL: '/api',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  useEffect(() => {
    if (!token) {
      alert('You are not logged in.');
      return;
    }

    fetchTasks();

    const socket = io({
      auth: {
        token
      }
    });
    socketRef.current = socket;

    socket.on('task-created', task => {
      setTasks(prev => [...prev, task]);
    });

    socket.on('task-deleted', id => {
      setTasks(prev => prev.filter(t => t.id !== id));
    });

    socket.on('task-updated', updated => {
      setTasks(prev =>
        prev.map(t => (t.id === updated.id ? updated : t))
      );
    });

    return () => socket.disconnect();
  }, [token]);

  const fetchTasks = async () => {
    try {
      const res = await axiosInstance.get('/tasks');
      setTasks(res.data);
    } catch (err) {
      alert('Failed to fetch tasks');
    }
  };

  const addTask = async () => {
    if (!title.trim()) return;
    const tempTask = { id: Date.now(), title, completed: false };
    setTasks(prev => [...prev, tempTask]);
    setTitle('');
    try {
      await axiosInstance.post('/tasks', { title });
    } catch {
      alert('Failed to add task');
      setTasks(prev => prev.filter(t => t.id !== tempTask.id));
    }
  };

  const deleteTask = async task => {
    const backup = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== task.id));
    try {
      await axiosInstance.delete(`/tasks/${task.id}`);
    } catch {
      alert('Failed to delete task');
      setTasks(backup);
    }
  };

  const toggleComplete = async task => {
    const updated = { ...task, completed: !task.completed };
    setTasks(prev => prev.map(t => (t.id === task.id ? updated : t)));
    try {
      await axiosInstance.put(`/tasks/${task.id}`, updated);
    } catch {
      alert('Failed to update task');
      fetchTasks();
    }
  };

  const startEdit = task => {
    setEditingTask(task);
    setEditedTitle(task.title);
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditedTitle('');
  };

  const saveEdit = async () => {
    const updated = { ...editingTask, title: editedTitle };
    setTasks(prev =>
      prev.map(t => (t.id === updated.id ? updated : t))
    );
    setEditingTask(null);
    setEditedTitle('');
    try {
      await axiosInstance.put(`/tasks/${updated.id}`, updated);
    } catch {
      alert('Failed to update task');
      fetchTasks();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-3xl font-bold text-center mb-6">Task Manager</h1>
	 <button
           onClick={() => {
            localStorage.removeItem('token');
            window.location.reload();
          }}
           className="text-sm text-red-600 hover:underline float-right"
             >
           Logout
         </button>


        <div className="flex gap-2 mb-4">
          <input
            className="flex-grow border border-gray-300 rounded px-3 py-2"
            placeholder="Add new task..."
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={addTask}
          >
            Add
          </button>
        </div>

        <ul>
          {tasks.map(task => (
            <li
              key={task.id}
              className="flex items-center justify-between border-b py-2"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleComplete(task)}
                />
                <span
                  className={`${
                    task.completed ? 'line-through text-gray-400' : ''
                  }`}
                >
                  {task.title}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  className="text-sm text-yellow-600 hover:underline"
                  onClick={() => startEdit(task)}
                >
                  Edit
                </button>
                <button
                  className="text-sm text-red-600 hover:underline"
                  onClick={() => deleteTask(task)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>

        {editingTask && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="bg-white rounded p-6 shadow-xl w-96">
              <h2 className="text-lg font-semibold mb-4">Edit Task</h2>
              <input
                className="w-full border px-3 py-2 rounded mb-4"
                value={editedTitle}
                onChange={e => setEditedTitle(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  onClick={saveEdit}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

