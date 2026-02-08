
import Link from 'next/link';
import { FaHome } from 'react-icons/fa';
import { ProfileSidebarWrapper } from './ProfileSidebarWrapper';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row h-full min-h-[calc(100vh-64px)]">
      {/* Sidebar Navigation */}
      <ProfileSidebarWrapper />

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        {children}
      </div>
    </div>
  );
}
