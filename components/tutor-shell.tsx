"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ControlCenter } from "@/components/control-center";
import { LessonChat } from "@/components/lesson-chat";
import { Sidebar } from "@/components/sidebar";
import type { Course } from "@/lib/syllabus";
import { touchToday } from "@/lib/tutor/engagement";
import { type Engagement, emptyEngagement } from "@/lib/tutor/engagement-core";
import {
  emptyProgress,
  markComplete,
  type Progress,
  readProgress,
} from "@/lib/tutor/progress";

function firstIncompleteLessonId(course: Course, progress: Progress): string {
  const completed = new Set(progress.completedLessonIds);
  const next = course.lessons.find((l) => !completed.has(l.id));
  return next?.id ?? course.lessons[course.lessons.length - 1]?.id ?? "";
}

export function TutorShell({
  courses,
  studentName,
  onChangeName,
}: {
  courses: Course[];
  studentName?: string;
  onChangeName: (name: string) => void;
}) {
  const [activeCourseId, setActiveCourseId] = useState(courses[0]?.id ?? "");
  const course = courses.find((c) => c.id === activeCourseId) ?? courses[0];
  if (!course) {
    return null;
  }
  // key on course.id so lesson/progress state resets cleanly when switching course.
  return (
    <TutorShellInner
      key={course.id}
      courses={courses}
      course={course}
      onSelectCourse={setActiveCourseId}
      studentName={studentName}
      onChangeName={onChangeName}
    />
  );
}

function TutorShellInner({
  courses,
  course,
  onSelectCourse,
  studentName,
  onChangeName,
}: {
  courses: Course[];
  course: Course;
  onSelectCourse: (courseId: string) => void;
  studentName?: string;
  onChangeName: (name: string) => void;
}) {
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [engagement, setEngagement] = useState<Engagement>(emptyEngagement);
  const [controlOpen, setControlOpen] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState<string>(
    () => course.lessons[0]?.id ?? "",
  );

  // Load per-device progress for this course after mount (hydration-safe).
  useEffect(() => {
    const stored = readProgress(course.id);
    setProgress(stored);
    setActiveLessonId(firstIncompleteLessonId(course, stored));
  }, [course]);

  // Count today's visit toward the streak (idempotent per day).
  useEffect(() => {
    setEngagement(touchToday());
  }, []);

  const handleComplete = useCallback(
    (lessonId: string) => {
      setProgress(markComplete(course.id, lessonId));
      const idx = course.lessons.findIndex((l) => l.id === lessonId);
      const following = course.lessons[idx + 1];
      if (following) {
        setActiveLessonId(following.id);
      }
    },
    [course],
  );

  const goToLesson = useCallback((lessonId: string) => {
    setActiveLessonId(lessonId);
  }, []);

  const summaries = useMemo(
    () =>
      courses.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        track: c.track,
      })),
    [courses],
  );

  const activeLesson = useMemo(
    () =>
      course.lessons.find((l) => l.id === activeLessonId) ?? course.lessons[0],
    [activeLessonId, course.lessons],
  );

  return (
    <div className="flex h-svh overflow-hidden">
      <Sidebar
        availableCourses={summaries}
        course={course}
        progress={progress}
        engagement={engagement}
        activeLessonId={activeLesson.id}
        onSelectCourse={onSelectCourse}
        onSelectLesson={goToLesson}
        onOpenControl={() => setControlOpen(true)}
      />
      <ControlCenter
        open={controlOpen}
        onClose={() => setControlOpen(false)}
        courses={courses}
        activeCourseId={course.id}
        onSelectCourse={onSelectCourse}
        studentName={studentName}
        onChangeName={onChangeName}
      />
      <main className="tutor-backdrop relative flex min-w-0 flex-1 flex-col">
        <LessonChat
          key={activeLesson.id}
          course={course}
          lesson={activeLesson}
          isComplete={progress.completedLessonIds.includes(activeLesson.id)}
          onComplete={handleComplete}
          studentName={studentName}
          onChangeName={onChangeName}
        />
      </main>
    </div>
  );
}
