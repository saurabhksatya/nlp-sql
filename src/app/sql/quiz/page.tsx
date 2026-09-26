"use client";

import { Suspense } from "react";
import { QuizContainer } from "@/components/QuizContainer";

export default function SqlQuizPage() {
  return (
    <div data-page="sql" className="page-sql">
      <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center">Loading SQL Quiz...</div>}>
        <QuizContainer initialMode="sql" />
      </Suspense>
    </div>
  );
}
