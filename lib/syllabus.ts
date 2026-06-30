import type { AuthoredQuestion } from "@/lib/tutor/quiz";
import biz101 from "@/data/syllabus/BIZ101.json";
import fe101 from "@/data/syllabus/FE101.json";
import py101 from "@/data/syllabus/PY101.json";

export type Lesson = {
  id: string;
  title: string;
  outcomes: string[];
  // Authored mastery quiz (fixed / pooled / template questions). When absent, completion
  // falls back to the skeptical assessor (model-judged, fail-closed). See CLAUDE.md.
  quiz?: AuthoredQuestion[];
};

export type Track = "Biz" | "SWE";

export type Course = {
  id: string;
  title: string;
  description?: string;
  track: Track;
  lessons: Lesson[];
};

export type CourseSummary = Pick<Course, "id" | "title" | "description" | "track">;

// Courses are bundled (imported JSON), not read from disk — so they work identically at
// build time, in serverless, and in a static export, with no filesystem tracing issues.
const COURSES: Course[] = [py101, biz101, fe101] as unknown as Course[];

export function getAllCourses(): Course[] {
  return COURSES;
}

export function coursesForTrack(track: Track): Course[] {
  return COURSES.filter((c) => c.track === track);
}

export async function loadCourse(courseId: string): Promise<Course> {
  const course = COURSES.find((c) => c.id === courseId);
  if (!course) {
    throw new Error(`Unknown course: ${courseId}`);
  }
  return course;
}

export function getLesson(course: Course, lessonId: string): Lesson {
  const lesson = course.lessons.find((l) => l.id === lessonId);
  if (!lesson) {
    throw new Error(`Lesson "${lessonId}" not found in course "${course.id}"`);
  }
  return lesson;
}

export async function listCourseIds(): Promise<string[]> {
  return COURSES.map((c) => c.id);
}

export async function listCourseSummaries(): Promise<CourseSummary[]> {
  return COURSES.map(({ id, title, description, track }) => ({
    id,
    title,
    description,
    track,
  })).sort((a, b) => a.title.localeCompare(b.title));
}
