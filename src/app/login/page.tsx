"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormFields";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { SCHOOL_TAGLINE } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push("/portal");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--hmc-blue-soft)]">
      <div className="hidden w-1/2 flex-col items-center justify-center bg-gradient-to-br from-[var(--hmc-blue)] to-[var(--hmc-blue-dark)] p-12 text-white lg:flex">
        <Image
          src="/hmc-logo.png"
          alt="Harris Memorial College logo"
          width={120}
          height={120}
          className="mb-8 object-contain drop-shadow-lg"
          priority
        />
        <h1 className="text-center text-3xl font-bold">Librarian Portal</h1>
        <p className="mt-3 max-w-sm text-center text-blue-100">
          Harris Memorial College Library Management System
        </p>
        <p className="mt-8 max-w-sm text-center text-sm font-medium leading-relaxed text-blue-200">
          {SCHOOL_TAGLINE}
        </p>
        <p className="mt-1 text-xs text-blue-300">Est. 1903</p>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <BrandLogo size="md" subtitle="Librarian Portal" className="justify-center" />
          </div>

          <div className="mb-6 hidden lg:block">
            <h2 className="text-2xl font-bold text-[var(--hmc-blue)]">Sign In</h2>
            <p className="mt-1 text-sm text-[var(--hmc-text-muted)]">Access the librarian management portal</p>
          </div>

          <form onSubmit={handleSubmit} className="card-hmc p-8">
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="librarian@hmc.edu.ph"
            />
            <div className="mt-4">
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="mt-6 w-full shadow-sm" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-6 text-center">
            <Link href="/" className="text-sm font-medium text-[var(--hmc-blue)] transition hover:text-[var(--hmc-blue-dark)]">
              ← Back to Library Home
            </Link>
            {" · "}
            <Link href="/opac" className="text-sm font-medium text-[var(--hmc-blue)] transition hover:text-[var(--hmc-blue-dark)]">
              OPAC
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
