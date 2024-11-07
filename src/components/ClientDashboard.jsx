"use client";
// ClientDashboard.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateWorkspaceModal } from "@/components/CreateWorkspaceModal";
import { PlusCircle } from "lucide-react";

export function ClientDashboard({  }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div>
      <Button
variant="ghost" className="w-full justify-start mb-4"        onClick={() => setIsCreateModalOpen(true)}
      >
        <PlusCircle className="mr-2 h-4 w-4" /> Create Workspace
      </Button>

      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
            console.log("donee");
        }}
      />
    </div>
  );
}
