import { Outlet } from "react-router-dom";
import { TeacherSidebar } from "./TeacherSidebar";
import { TeacherHeader } from "./TeacherHeader";

export const TeacherLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <TeacherSidebar />
      <div className="md:ml-64 ml-0">
        <TeacherHeader />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
