export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <span className="text-3xl">🔥</span>
        <h2 className="text-xl font-bold text-text-primary mt-2">HabitFlow</h2>
        <p className="text-sm text-text-muted mt-1">Build better habits every day</p>
      </div>
      {children}
    </div>
  );
}
