"use client";

import React, { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { accessToken, initializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initializing && !accessToken) {
      router.replace("/login");
    }
  }, [accessToken, initializing, router]);

  // While we are checking if user has a valid refresh token
  if (initializing) {
    return <p>Loading...</p>;
  }

  if (!accessToken) {
    return <p>Redirecting to login...</p>;
  }

  return <>{children}</>;
}
