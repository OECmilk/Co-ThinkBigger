'use client';

import Sidebar from "@/components/layout/Sidebar";
import { useState } from "react";
import { IoMenu } from "react-icons/io5";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	return (
		<div className="flex h-screen relative">
			{/* Mobile Hamburger Button */}
			<button
				className="md:hidden fixed top-4 left-4 z-40 bg-orange-500 text-white p-2 rounded shadow-lg"
				onClick={() => setIsSidebarOpen(true)}
			>
				<IoMenu size={24} />
			</button>

			{/* Sidebar with mobile state */}
			<Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

			{/* Overlay for mobile when sidebar is open */}
			{isSidebarOpen && (
				<div
					className="fixed inset-0 bg-black/50 z-40 md:hidden"
					onClick={() => setIsSidebarOpen(false)}
				/>
			)}

			{/* Main Content */}
			{/* ml-0 on mobile, ml-20 on desktop */}
			{/* p-0 on mobile (edge-to-edge), p-6 on desktop */}
			<main className="flex-1 ml-0 md:ml-20 p-0 md:p-6 bg-gray-100 overflow-y-auto w-full">
				<div className="pt-14 md:pt-0 h-full">
					{children}
				</div>
			</main>
		</div>
	);
}