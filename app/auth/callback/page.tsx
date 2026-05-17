"use client";

import {
  useEffect,
} from "react";

import {
  useRouter,
} from "next/navigation";

import { supabase } from "@/lib/supabase";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleAuth() {
      try {
        const currentUrl =
          window.location.href;

        const url =
          new URL(currentUrl);

        const code =
          url.searchParams.get(
            "code"
          );

        if (code) {
          await supabase.auth.exchangeCodeForSession(
            code
          );
        }

        router.replace(
          "/dashboard"
        );
      } catch (error) {
        console.log(error);

        router.replace(
          "/login"
        );
      }
    }

    handleAuth();
  }, [router]);

  return (
    <main
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-gray-100
      "
    >
      <div
        className="
          rounded-3xl
          bg-white
          p-8
          shadow-sm
        "
      >
        <h1
          className="
            text-2xl
            font-bold
            text-slate-900
          "
        >
          Entrando...
        </h1>

        <p
          className="
            mt-2
            text-slate-500
          "
        >
          Validando autenticação.
        </p>
      </div>
    </main>
  );
}