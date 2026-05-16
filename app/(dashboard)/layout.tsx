import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { AICoachPanel } from '@/components/ai-coach-panel';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingDone: true, _count: { select: { habits: true } } },
  });

  if (user && !user.onboardingDone && user._count.habits === 0) {
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Navbar />
      <main className="md:pl-56 pt-14 md:pt-0 pb-16 md:pb-0 min-h-screen">
        <div className="max-w-3xl mx-auto px-5 py-6 md:px-10 md:py-8">
          {children}
        </div>
      </main>
      <AICoachPanel />
    </div>
  );
}
