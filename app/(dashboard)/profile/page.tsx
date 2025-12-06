'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; avatar: string }>({ id: '', name: '', avatar: '' });
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      setName(u.name || '');
      setAvatar(u.avatar || '');
    } else {
      router.push('/login');
    }
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, name, avatar })
      });
      const data = await res.json();

      if (res.ok) {
        // Update local storage
        const newUser = { ...user, name, avatar };
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        setUser(newUser);
        alert("プロフィールを更新しました");
        // Force reload to update sidebar or use context in real app
        window.location.reload();
      } else {
        alert("更新に失敗しました");
      }
    } catch (e) {
      alert("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">プロフィール編集</h1>
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <form onSubmit={handleUpdate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ユーザー名</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:border-orange-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">アバター設定 (色)</label>
            <div className="flex gap-2">
              {['#f87171', '#fb923c', '#fbbf24', '#4ade80', '#60a5fa', '#a78bfa', '#f472b6'].map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAvatar(color)}
                  className={`w-8 h-8 rounded-full border-2 ${avatar === color ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">簡易的な色選択です。</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white font-bold py-2 rounded hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? '更新中...' : '保存する'}
          </button>
        </form>
      </div>
    </div>
  );
}
