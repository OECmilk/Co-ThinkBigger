'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  title: string;
  updatedAt: string;
  userId: string;
  owner: { name: string; email: string };
  members: { id: string }[];
}

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState('');

  // Invite Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(userStr);
    setCurrentUserId(user.id);
    fetchProjects(user.id);
  }, []);

  const fetchProjects = async (userId: string) => {
    try {
      const res = await fetch(`/api/projects?userId=${userId}`);
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!currentUserId) return;
    const title = prompt("新しいプロジェクトの名前を入力してください");
    if (!title) return;

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, title })
      });
      const data = await res.json();
      if (data.project) {
        router.push(`/projects/${data.project.id}`);
      }
    } catch (e) {
      alert("作成に失敗しました");
    }
  };

  const deleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!confirm("本当に削除しますか？この操作は取り消せません。")) return;

    try {
      const res = await fetch(`/api/projects/${projectId}?userId=${currentUserId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
      } else {
        alert("削除できませんでした");
      }
    } catch (e) {
      alert("エラーが発生しました");
    }
  }

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.length < 2) {
      setSearchResults([]);
      return;
    }
    // Debounce usually needed, but simple for MVP
    const res = await fetch(`/api/users/search?q=${val}&currentUserId=${currentUserId}`);
    const data = await res.json();
    setSearchResults(data.users || []);
  }

  const inviteUser = async (userId: string) => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (res.ok) {
        alert("招待しました！");
        setIsInviteOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("招待エラー");
    }
  }

  const openInvite = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setSelectedProjectId(projectId);
    setIsInviteOpen(true);
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">プロジェクト一覧</h1>
        <button
          onClick={createProject}
          className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600 transition-colors font-bold"
        >
          + 新規プロジェクト
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => {
          const isOwner = project.userId === currentUserId;
          return (
            <div
              key={project.id}
              onClick={() => router.push(`/projects/${project.id}`)}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-orange-300 cursor-pointer transition-all group relative"
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-bold text-gray-800">{project.title}</h2>
                {isOwner ? (
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">Owner</span>
                ) : (
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Shared</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Owner: {isOwner ? 'あなた' : project.owner?.name}<br />
                Updated: {new Date(project.updatedAt).toLocaleDateString()}
              </p>

              <div className="flex justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button
                  onClick={(e) => openInvite(e, project.id)}
                  className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100"
                >
                  招待
                </button>
                {isOwner && (
                  <button
                    onClick={(e) => deleteProject(e, project.id)}
                    className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100"
                  >
                    削除
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          プロジェクトがありません。新しく作成しましょう！
        </div>
      )}

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 bg-black/5 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setIsInviteOpen(false)}>
          <div className="bg-white p-6 rounded-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">メンバーを招待</h3>
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="名前またはメールで検索..."
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:border-orange-500"
              autoFocus
            />
            <div className="max-h-60 overflow-y-auto space-y-2">
              {searchResults.map(u => (
                <div key={u.id} className="flex justify-between items-center p-2 border border-gray-100 rounded hover:bg-gray-50">
                  <div>
                    <div className="font-bold text-sm">{u.name}</div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </div>
                  <button
                    onClick={() => inviteUser(u.id)}
                    className="text-xs bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600"
                  >
                    追加
                  </button>
                </div>
              ))}
              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="text-center text-gray-400 text-sm py-2">ユーザーが見つかりません</div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setIsInviteOpen(false)} className="text-gray-500 hover:text-gray-700 text-sm">キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
