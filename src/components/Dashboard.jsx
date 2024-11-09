"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Github, PlusCircle, Settings, User, Users } from "lucide-react";
import { ClientDashboard } from "@/components/ClientDashboard";
import { JoinWorkspaceModal } from "./JoinWorkSpaceModal";
import { JoinWorkspaceButton } from "./JoinWorkSpaceButton";

export default function Dashboard({ user }) {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const [ownWorkspaces, setOwnWorkspaces] = useState([]);
  const [joinedWorkspaces, setJoinedWorkspaces] = useState([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      const res = await fetch("/api/workspace");
      const data = await res.json();
      if (res.ok) {
        setOwnWorkspaces(data.workspaces.filter(w => w.ownerId === user.id));
        setJoinedWorkspaces(data.workspaces.filter(w => w.ownerId !== user.id));
      }
    };

    fetchWorkspaces();
  }, [user.id]);

  const handleJoinWorkspace = () => {
    // Implement the logic to join a workspace
    // This is where you'd make an API call to join the workspace
    // For now, we'll just redirect to the workspace page
    window.location.href = `http://localhost:3000/workspace/${workspaceId}`;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-700 to-indigo-800 text-white">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          // ... (particle options remain the same)
        }}
      />

      <aside className="w-64 bg-purple-900 p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
          <nav>
            <ClientDashboard />
            <Button
              variant="ghost"
              className="w-full justify-start mb-4"
              asChild
            >
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" /> Profile
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start mb-4" asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" /> Settings
              </Link>
            </Button>
            {/* <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" /> Join Workspace
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join a Workspace</DialogTitle>
                </DialogHeader>
                <Input
                  placeholder="Enter Workspace ID"
                  value={workspaceId}
                  onChange={(e) => setWorkspaceId(e.target.value)}
                />
                <Button onClick={handleJoinWorkspace}>Join</Button>
              </DialogContent>
            </Dialog> */}
            <JoinWorkspaceButton />
          </nav>
        </div>
        <div>
          <Button variant="ghost" asChild className="w-full justify-start">
            <Link href="/api/auth/logout">Sign out</Link>
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <header className="flex justify-between items-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold"
          >
            Welcome, {user.name}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Image
              src={user.picture || "/placeholder-avatar.png"}
              alt="Profile"
              width={64}
              height={64}
              className="rounded-full border-4 border-white"
            />
          </motion.div>
        </header>

        <section className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Your Workspaces</h2>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {ownWorkspaces.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}
            <WorkspaceCard isPlaceholder />
          </motion.div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Joined Workspaces</h2>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {joinedWorkspaces.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}
          </motion.div>
        </section>
      </main>
    </div>
  );
}

function WorkspaceCard({ workspace, isPlaceholder = false }) {
  return (
    <Card
      className={`bg-white/10 backdrop-blur-lg border-none ${
        isPlaceholder ? "opacity-50" : ""
      }`}
    >
      <CardHeader>
        <CardTitle className="flex items-center">
          {isPlaceholder ? (
            <>
              <PlusCircle className="mr-2 h-5 w-5" />
              New Workspace
            </>
          ) : (
            workspace.name
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPlaceholder ? (
          <p className="text-sm opacity-70">
            Create a new workspace to start collaborating
          </p>
        ) : (
          <p className="text-sm opacity-70 mb-4">
            Last active: {new Date(workspace.createdAt).toLocaleString()}
          </p>
        )}
        <Link href={isPlaceholder ? "/create-workspace" : `/workspace/${workspace.id}`}>
          <Button
            className="mt-4 w-full"
            variant={isPlaceholder ? "outline" : "default"}
          >
            {isPlaceholder ? "Create Workspace" : "Enter Workspace"}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}