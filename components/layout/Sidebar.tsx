'use client';

import Link from "next/link";
import { IoHomeOutline, IoPeopleOutline } from "react-icons/io5";
import { SlLogout } from "react-icons/sl";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Sidebar() {
  const [userName, setUserName] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || 'User');
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  return (
    <aside className="w-20 bg-orange-300 text-white flex flex-col p-4 z-50 items-center h-screen fixed left-0 top-0">
      <nav className="flex flex-col gap-4 items-center mt-4">
        <Link href="/projects/default" className="hover:bg-orange-200 p-2 rounded-md" title="Home">
          <IoHomeOutline size={28} />
        </Link>
        <Link href="/projects" className="hover:bg-orange-200 p-2 rounded-md" title="Projects">
          <IoPeopleOutline size={28} />
        </Link>
      </nav>

      <div className="mt-auto flex flex-col items-center gap-4 mb-4 w-full">
        {userName && (
          <Link href="/profile" className="text-xs font-bold text-center bg-orange-400 px-2 py-1 rounded w-full break-words hover:bg-orange-500 transition-colors shadow-sm text-white">
            {userName}
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="hover:bg-orange-200 p-2 rounded-md text-white"
          title="Logout"
        >
          <SlLogout size={24} />
        </button>
        <div className="text-[10px] opacity-70 mt-2">v1.0</div>
      </div>
    </aside>
  );
}
