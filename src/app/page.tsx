import Navbar from "@/components/navbar/Navbar";
import Sidebar from "@/components/sidebar/Sidebar";
import Editor from "@/components/editor/Editor";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Sidebar />
      <Editor />
    </main>
  );
}
