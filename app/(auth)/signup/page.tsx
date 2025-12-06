'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();

            if (res.ok) {
                // Save user info for UI
                localStorage.setItem('currentUser', JSON.stringify(data.user));

                // Auto login or create project
                const createRes = await fetch('/api/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: data.user.id, title: 'My First Project' })
                });
                const newProject = await createRes.json();
                router.push(`/projects/${newProject.project.id}`);
            } else {
                alert(data.error);
            }
        } catch (e) {
            alert('Signup error');
        }
    };

    return (
        <div>
            <form onSubmit={handleSignup} className="space-y-6">
                <div>
                    <label>
                        ユーザーネーム <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-1"
                        placeholder="アプリで使用する名前を入力してください"
                        required
                    />
                </div>
                <div>
                    <label>
                        メールアドレス <span className="text-red-500">*</span>
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
                        パスワード <span className="text-red-500">*</span>
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