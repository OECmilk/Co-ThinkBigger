
'use client';

import Link from "next/link";
import { IoHomeOutline, IoPeopleOutline, IoNotificationsOutline, IoClose } from "react-icons/io5";
import { SlLogout } from "react-icons/sl";
import { useEffect, useState } from "react";
import NotificationDrawer from "../chat/NotificationDrawer";
import { useRouter } from "next/navigation";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [userName, setUserName] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || 'User');
        setUserId(user.id);
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
    <>
      <aside
        className={`
          w-20 bg-orange-300 text-white flex flex-col p-4 z-50 items-center h-screen fixed left-0 top-0
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="md:hidden w-full flex justify-center mb-4">
           <button onClick={onClose} className="p-2 hover:bg-orange-400 rounded-full">
             <IoClose size={24} />
           </button>
        </div>

        <nav className="flex flex-col gap-6 items-center mt-4 w-full">
          {/* 1. Notification */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-md relative transition-colors ${showNotifications ? 'bg-orange-500' : 'hover:bg-orange-200'}`}
            title="Notifications"
          >
            <IoNotificationsOutline size={28} />
          </button>

          {/* 2. User Profile */}
          {userName && (
            <Link href="/profile" className="flex flex-col items-center gap-1 hover:bg-orange-200 p-2 rounded-md w-full" title="Profile">
              <div className="w-8 h-8 rounded-full bg-white text-orange-500 flex items-center justify-center font-bold text-sm">
                {userName[0].toUpperCase()}
              </div>
            </Link>
          )}

          {/* 3. Home */}
          <Link href="/projects/default" className="hover:bg-orange-200 p-2 rounded-md" title="Home">
            <IoHomeOutline size={28} />
          </Link>

          {/* 4. Projects */}
          <Link href="/projects" className="hover:bg-orange-200 p-2 rounded-md" title="Projects">
            <IoPeopleOutline size={28} />
          </Link>
        </nav>

        <div className="mt-auto flex flex-col items-center gap-4 mb-4 w-full">
          <button
            onClick={handleLogout}
            className="hover:bg-orange-200 p-2 rounded-md text-white"
            title="Logout"
          >
            <SlLogout size={24} />
          </button>
          <div className="text-[10px] opacity-70 mt-2">v1.1</div>
        </div>
      </aside>

      {userId && (
        <NotificationDrawer
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          userId={userId}
        />
      )}
    </>
  );
}
