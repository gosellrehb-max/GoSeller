"use client";

import { Suspense } from "react";
import ForgotPasswordView from "@/features/auth/components/ForgotPasswordView";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPasswordView />
    </Suspense>
  );
}
