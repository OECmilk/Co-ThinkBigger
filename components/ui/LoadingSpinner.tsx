
export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
      <p className="text-gray-500 text-sm font-semibold animate-pulse">Loading...</p>
    </div>
  );
}
