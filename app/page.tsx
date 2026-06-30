import { TutorApp } from "@/components/tutor-app";
import { getAllCourses } from "@/lib/syllabus";

export default function Home() {
  // All courses are bundled; the client gate handles onboarding + degree filtering.
  return <TutorApp allCourses={getAllCourses()} />;
}
