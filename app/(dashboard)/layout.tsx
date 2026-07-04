import { SignoutButton } from '@/components/SignoutButton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">TrainArduino</h1>
          <div className="space-x-4">
            <a href="/" className="text-gray-700 hover:text-blue-600">
              Dashboard
            </a>
            <SignoutButton />
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto p-4">{children}</main>
    </div>
  );
}
