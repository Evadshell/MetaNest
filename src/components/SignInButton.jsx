// src/components/SignInButton.js
"use client";
import { signIn } from "next-auth/react";

export default function SignInButton() {
  return (
    <button
      onClick={() => signIn(undefined, { callbackUrl: "/dashboard" })}
    >
      Sign in
    </button>
  );
}
