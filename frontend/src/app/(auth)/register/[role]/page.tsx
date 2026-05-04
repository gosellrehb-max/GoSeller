"use client";

import { Suspense, useEffect } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import AuthForm from "@/features/auth/components/AuthForm";
import type { AccountType } from "@/contexts/AuthContext";

const REGISTER_ROLES: AccountType[] = ["customer", "seller", "rider"];

function isRegisterRole(value: string): value is AccountType {
  return REGISTER_ROLES.includes(value as AccountType);
}

/** Sellers/riders register as customers first, then switch roles (see product decisions). */
function RegisterRoleRedirect({ info }: { info: "seller" | "rider" }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/register/customer?info=${info}`);
  }, [router, info]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500 text-sm">Redirecting to registration…</p>
    </div>
  );
}

function RegisterRoleInner() {
  const params = useParams();
  const raw = params.role;
  const segment = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  if (!segment || !isRegisterRole(segment)) notFound();

  if (segment === "seller") return <RegisterRoleRedirect info="seller" />;
  if (segment === "rider") return <RegisterRoleRedirect info="rider" />;
  return <AuthForm role="customer" mode="signup" />;
}

export default function RegisterRolePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterRoleInner />
    </Suspense>
  );
}
