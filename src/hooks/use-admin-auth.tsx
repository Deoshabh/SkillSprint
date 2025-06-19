import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAdminAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  return {
    isAdmin: user?.role === 'admin',
    isLoading: loading,
    user
  };
}

export function AdminProtected({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAdminAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!isAdmin) {
    return <div className="flex justify-center items-center min-h-screen">Access Denied</div>;
  }

  return <>{children}</>;
}
