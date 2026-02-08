
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export function ProfileLink({
  profile,
  user
}: {
  profile: { id: string, avatarUrl: string | null } | null,
  user: any
}) {
  const pathname = usePathname();
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    const match = pathname?.match(/\/dashboard\/projects\/([^\/]+)/);
    if (match) {
      setProjectId(match[1]);
    } else {
      setProjectId(null);
    }
  }, [pathname]);

  // Generate href
  const href = profile ? `/dashboard/profile/${profile.id}${projectId ? `?projectId=${projectId}` : ''}` : '#';

  return (
    <Link
      href={href}
      className="flex items-center gap-2 hover:opacity-70 transition-opacity"
    >
      <div className="w-8 h-8 bg-stone-200 pixel-border-sm overflow-hidden flex items-center justify-center font-bold text-stone-500">
        {/* Display avatar image if available, otherwise initial */}
        {profile?.avatarUrl ? (
          <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          (user.user_metadata.username || user.email || '?')[0].toUpperCase()
        )}
      </div>
      <span className="font-bold text-sm hidden md:block">
        {user.user_metadata.username || user.email}
      </span>
    </Link>
  );
}
