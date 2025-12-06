'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    
    // 現在のパスに基づいてスタイルを切り替える
    const getTabStyle = (path: string) => {
        const isActive = pathname === path;
        return isActive
            ? "w-1/2 py-4 text-center font-bold border-b-2 border-orange-400"
            : "w-1/2 py-4 text-center font-medium text-gray-400 hover:text-gray-900 border-b border-gray-200";
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-lg">

                {/* タブ切り替え */}
                <div className="flex">
                    <Link href="/login" className={getTabStyle('/login')}>
                        ログイン
                    </Link>
                    <Link href="/signup" className={getTabStyle('/signup')}>
                        新規登録
                    </Link>
                </div>

                {/* コンテンツ */}
                <div className="p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}