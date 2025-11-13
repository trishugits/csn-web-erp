import { Outlet } from "react-router-dom";
import { StudentSidebar } from "./StudentSidebar";
import { StudentHeader } from "./StudentHeader";

export const StudentLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar />
      <div className="md:ml-64 ml-0">
        <StudentHeader />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
