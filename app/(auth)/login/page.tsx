'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok) {
                // Determine user's last project or create new one
                // For MVP, just go to a default or list page.
                // Let's assumed we have a project list page or we create a default one.

                // Fetch user's projects
                const projectsRes = await fetch(`/api/projects?userId=${data.user.id}`);
                const projectsData = await projectsRes.json();

                // Save user info for UI
                localStorage.setItem('currentUser', JSON.stringify(data.user));

                if (projectsData.projects && projectsData.projects.length > 0) {
                    router.push(`/projects/${projectsData.projects[0].id}`);
                } else {
                    // Create default project
                    const createRes = await fetch('/api/projects', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: data.user.id, title: 'My First Project' })
                    });
                    const newProject = await createRes.json();
                    router.push(`/projects/${newProject.project.id}`);
                }
            } else {
                alert(data.error);
            }
        } catch (e) {
            alert('Login error');
        }
    };

    return (
        <div>
            <form onSubmit={handleLogin} className="space-y-6">
                <div>
                    <label>
                        メールアドレス
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-1"
                        placeholder="user@example.com"
                        required
                    />
                </div>
                <div>
                    <label>
                        パスワード
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-1"
                        placeholder="********"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full py-2 px-4 bg-orange-400 text-white rounded-md hover:bg-orange-300 font-semibold"
                >
                    送信
                </button>
            </form>
        </div>
    );
}