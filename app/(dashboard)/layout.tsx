import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex h-screen">
			{/* サイドバー */}
			<Sidebar />

			{/* メインコンテンツ */}
			<main className="flex-1 ml-20 p-6 bg-gray-100 overflow-y-auto">
				{children}
			</main>
		</div>
	);
}