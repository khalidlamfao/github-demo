import { useState } from 'react';
import axios from 'axios';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isRegister ? '/api/register' : '/api/login';
    try {
      const res = await axios.post(url, { username, password });
      localStorage.setItem('token', res.data.token);
      onLogin();
    } catch {
      alert('Authentication failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-80 space-y-4">
        <h2 className="text-xl font-bold text-center">
          {isRegister ? 'Create Account' : 'Login'}
        </h2>
        <input
          className="w-full border px-3 py-2 rounded"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          className="w-full border px-3 py-2 rounded"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {isRegister ? 'Register' : 'Login'}
        </button>
        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
          className="w-full text-sm text-blue-500 underline hover:text-blue-700"
        >
          {isRegister ? 'Already have an account?' : 'Create an account'}
        </button>
      </form>
    </div>
  );
}

