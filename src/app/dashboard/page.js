import React from 'react'
import Dashboard from '@/components/Dashboard'
import { getSession, withPageAuthRequired } from '@auth0/nextjs-auth0'

export default withPageAuthRequired(
  async function DashboardPage() {
    const session = await getSession();
    // console.log(session);
    return (
      <div>
        <Dashboard user={session?.user} />
      </div>
    );
  },
  { returnTo: "/" }
);
