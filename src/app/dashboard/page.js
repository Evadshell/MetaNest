import React from "react";
// import { useUser } from '@auth0/nextjs-auth0/client';
import Dashboard from "@/components/Dashboard";
// import { useSession } from 'next-auth/react';
import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";

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
