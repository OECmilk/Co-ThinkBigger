import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Co-Think Bigger</h1>
      <p className="text-gray-600 mb-8">Collaborative Idea Generation Tool</p>
      <Link
        href="/projects/default"
        className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-bold shadow-lg"
      >
        Start App
      </Link>
    </div>
  );
}
