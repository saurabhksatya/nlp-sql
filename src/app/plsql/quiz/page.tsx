"use client";

import { Suspense } from "react";
import { QuizContainer } from "@/components/QuizContainer";

export default function PlSqlQuizPage() {
  return (
    <div data-page="plsql" className="page-plsql">
      <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center">Loading PL/SQL Quiz...</div>}>
        <QuizContainer initialMode="plsql" />
      </Suspense>
    </div>
  );
}
