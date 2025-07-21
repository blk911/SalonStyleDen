import React, { useState, useEffect } from 'react';

export default function TaikosVault() {
  const [memories, setMemories] = useState([]);
  const [form, setForm] = useState({ title: '', textContent: '', tags: '' });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      fetch(`/api/taikos/memory?userId=${user.id}`)
        .then(res => res.json())
        .then(data => setMemories(data.memories));
    }
  }, []);

  const submit = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const res = await fetch('/api/taikos/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId: user.id,
        ...form, 
        tags: form.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      }),
    });
    const data = await res.json();
    setMemories([...memories, data.artifact]);
    setForm({ title: '', textContent: '', tags: '' });
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Memory Vault</h2>
        
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="space-y-4">
            <input 
              placeholder="Title" 
              value={form.title} 
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <textarea 
              placeholder="Memory" 
              value={form.textContent} 
              onChange={e => setForm({ ...form, textContent: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input 
              placeholder="Tags (comma-separated)" 
              value={form.tags} 
              onChange={e => setForm({ ...form, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button 
              onClick={submit}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Save
            </button>
          </div>
        </div>

        <div className="memories space-y-4">
          {memories.map((m: any) => (
            <div key={m.id} className="memory-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{m.title}</h3>
              <p className="text-gray-700 mb-2">{m.textContent}</p>
              <small className="text-gray-500">Tags: {m.tags.join(', ')}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
