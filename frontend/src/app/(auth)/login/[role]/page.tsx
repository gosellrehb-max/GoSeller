"use client";

import { Suspense } from "react";
import { notFound, useParams } from "next/navigation";
import AuthForm from "@/features/auth/components/AuthForm";
import type { AccountType } from "@/contexts/AuthContext";

const LOGIN_ROLES: AccountType[] = ["customer", "seller", "rider"];

function isLoginRole(value: string): value is AccountType {
  return LOGIN_ROLES.includes(value as AccountType);
}

function LoginRoleInner() {
  const params = useParams();
  const raw = params.role;
  const segment = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  if (!segment || !isLoginRole(segment)) notFound();
  return <AuthForm role={segment} mode="login" />;
}

export default function LoginRolePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginRoleInner />
    </Suspense>
  );
}
