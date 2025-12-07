
'use client';

import { useState, useEffect } from 'react';
import { IoClose, IoNotificationsOutline } from 'react-icons/io5';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  read: boolean;
  createdAt: string;
  message: {
    id: string;
    content: string;
    user: { name: string; avatar: string | null };
    project: { id: string; title: string };
    candidate: { id: string; text: string } | null;
  };
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function NotificationDrawer({ isOpen, onClose, userId }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && userId) {
      fetchNotifications();
    }
  }, [isOpen, userId]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/users/${userId}/notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);

        // Mark fetched notifications as read
        const unreadIds = data.notifications.filter((n: Notification) => !n.read).map((n: Notification) => n.id);
        if (unreadIds.length > 0) {
          await fetch(`/api/users/${userId}/notifications`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationIds: unreadIds })
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = (n: Notification) => {
    onClose();
    if (n.message.project) {
      const projectId = n.message.project.id;
      const candidateId = n.message.candidate?.id;

      // Navigation with query params to trigger chat opening
      const params = new URLSearchParams();
      if (candidateId) {
        params.set('chatCandidateId', candidateId);
      } else {
        params.set('openChat', 'true');
      }
      router.push(`/projects/${projectId}?${params.toString()}`);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-transparent z-[105]"
          onClick={onClose}
        />
      )}
      <div className={`fixed top-4 left-24 w-80 bg-white shadow-2xl rounded-xl transition-all duration-300 z-[110] border border-gray-200 flex flex-col ${isOpen ? 'opacity-100 translate-x-0 visible' : 'opacity-0 -translate-x-4 invisible'}`}>
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
            <IoNotificationsOutline className="text-orange-500" /> Notifications
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <IoClose />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No new notifications</div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 border-b hover:bg-orange-50 cursor-pointer transition-colors ${!n.read ? 'bg-orange-50/30' : ''}`}
              >
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-xs overflow-hidden">
                    {n.message.user.avatar ? <img src={n.message.user.avatar} alt={n.message.user.name} /> : n.message.user.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1 flex justify-between">
                      <span className="font-semibold">{n.message.user.name}</span>
                      <span className="text-[10px]">{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm text-gray-800 line-clamp-2 mb-1">
                      {n.message.content}
                    </div>
                    <div className="text-[10px] text-gray-400 bg-gray-100 inline-block px-2 py-1 rounded">
                      in {n.message.project.title} {n.message.candidate ? `> ${n.message.candidate.text.substring(0, 10)}...` : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
