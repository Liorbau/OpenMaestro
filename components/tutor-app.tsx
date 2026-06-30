"use client";

import { useEffect, useState } from "react";
import { Onboarding } from "@/components/onboarding";
import { TutorShell } from "@/components/tutor-shell";
import { downloadToCache, loadModel } from "@/lib/llm/engine";
import { instantModelFor, selectModel } from "@/lib/llm/registry";
import type { Course } from "@/lib/syllabus";
import { readProfile, saveProfile, type StudentProfile } from "@/lib/tutor/profile";

// Top-level gate: first-run onboarding (name + degree) → then the shell showing only the
// chosen degree's courses. Profile is read after mount (client-only) to avoid a hydration
// mismatch, so the server renders nothing until we know who the student is.
export function TutorApp({ allCourses }: { allCourses: Course[] }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<StudentProfile>({});

  useEffect(() => {
    setProfile(readProfile());
    setReady(true);
    // Instant-start: prefetch the moment the app opens so the download overlaps onboarding.
    // Two-tier (big model): stream the full weights to disk in the background while a tiny
    // model boots for the first lesson. Small model: just prefetch it directly.
    // Fire-and-forget; the lesson view surfaces any real load error.
    const full = selectModel();
    if (instantModelFor(full).id !== full.id) {
      void downloadToCache(full).catch(() => {});
    } else {
      void loadModel(full).catch(() => {});
    }
  }, []);

  if (!ready) {
    return null;
  }

  if (!profile.name || !profile.track) {
    return (
      <Onboarding
        onComplete={(name, track) => {
          const next: StudentProfile = { ...profile, name, track };
          saveProfile(next);
          setProfile(next);
        }}
      />
    );
  }

  const courses = allCourses.filter((c) => c.track === profile.track);
  const changeName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const next: StudentProfile = { ...profile, name: trimmed };
    saveProfile(next);
    setProfile(next);
  };
  return (
    <TutorShell courses={courses} studentName={profile.name} onChangeName={changeName} />
  );
}
