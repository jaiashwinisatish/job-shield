import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import BackgroundAnimation from "./BackgroundAnimation";
import FloatingShapes from "./FloatingShapes";
import OrbitalElements from "./OrbitalElements";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <BackgroundAnimation />
      <FloatingShapes />
      <OrbitalElements />
      <div className="relative z-10">
        <Navbar />
        <main className="flex-1 pt-16">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
