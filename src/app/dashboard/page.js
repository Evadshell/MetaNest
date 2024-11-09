import React from 'react'
import { useUser } from '@auth0/nextjs-auth0/client';
import Dashboard from '@/components/Dashboard'
export default  function DashboardPage() {
  const { user, error, isLoading } = useUser();
  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
       <Dashboard user={user} />
    </div>
  )
}

