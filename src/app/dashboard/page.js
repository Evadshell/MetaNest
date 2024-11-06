import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { PlusCircle, Users, Calendar, Trophy, Gamepad2 } from "lucide-react";
import { CreateWorkspaceModal } from "@/components/CreateWorkspaceModal";
import { ClientDashboard } from "@/components/ClientDashboard";

export default withPageAuthRequired(
  async function Dashboard() {
    const { user } = await getSession();
    const isProfileComplete = false;
    // const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const workspaces = [
      { id: "ws1", name: "Project Alpha", hash: "a1b2c3d4" },
      { id: "ws2", name: "Team Bravo", hash: "e5f6g7h8" },
    ];
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-indigo-800 dark:text-indigo-300">
              Welcome, {user.name}
            </h1>
            <div className="flex items-center space-x-4">
              <Link href="/profile">
                <Button
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Image
                    src={user.picture || "/placeholder-avatar.png"}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <span>Profile</span>
                </Button>
              </Link>
              <Button asChild variant="ghost">
                <Link href="/api/auth/logout">Sign out</Link>
              </Button>
            </div>
          </header>

          <main className="space-y-8">
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                  Your Workspaces
                </h2>
                {/* <Button
                  className="bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Workspace
                </Button>
                <CreateWorkspaceModal
                  isOpen={isCreateModalOpen}
                  onClose={() => setIsCreateModalOpen(false)}
                  onSuccess={(workspace) =>
                    router.push(`/workspace/${workspace.id}`)
                  }
                /> */}
                                <ClientDashboard />

              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workspaces.map((workspace) => (
                  <Card key={workspace.id}>
                    <CardHeader>
                      <CardTitle>{workspace.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Hash: {workspace.hash}
                      </p>
                      <Button className="mt-4 w-full" variant="outline">
                        Enter Workspace
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashboardCard
                title="Tasks"
                value="8"
                icon={<PlusCircle className="h-6 w-6" />}
              />
              <DashboardCard
                title="Team Members"
                value="12"
                icon={<Users className="h-6 w-6" />}
              />
              <DashboardCard
                title="Meetings"
                value="3"
                icon={<Calendar className="h-6 w-6" />}
              />
              <DashboardCard
                title="Rewards"
                value="520 pts"
                icon={<Trophy className="h-6 w-6" />}
              />
            </section>
          </main>
        </div>
      </div>
    );
  },
  { returnTo: "/" }
);

function DashboardCard({ title, value, icon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
