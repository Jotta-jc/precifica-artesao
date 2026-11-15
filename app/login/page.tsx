"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { createClient } from "@/lib/supabase/client";

function AvisoErroLogin() {
  const searchParams =
    useSearchParams();

  if (searchParams.get("erro") !== "login") {
    return null;
  }

  return (
    <div
      role="alert"
      className="
        mb-6
        rounded-2xl
        border
        border-red-300
        bg-red-50
        p-4
        text-base
        font-semibold
        leading-relaxed
        text-red-800
      "
    >
      Não foi possível entrar. Tente
      novamente. Se o problema
      continuar, fale com o suporte.
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
const supabase = createClient();

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (session) {
        router.replace(
          "/dashboard"
        );
      }
    }

    checkUser();
  }, [router]);

async function loginGoogle() {
  try {
    setLoading(true);

    await supabase.auth.signInWithOAuth({
      provider: "google",

      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  } catch (error) {
    console.log(error);

    alert("Erro ao realizar login");
  } finally {
    setLoading(false);
  }
}
  return (
    <main
      className="
        flex
        min-h-full
        items-center
        justify-center
        bg-gray-100
        p-6
      "
    >
      <div
        className="
          w-full
          max-w-md
          rounded-3xl
          border
          border-slate-200
          bg-white
          p-8
          shadow-sm
        "
      >
        <div className="mb-8">
          <h1
            className="
              text-4xl
              font-black
              text-slate-900
            "
          >
            Precifica+
          </h1>

          <p
            className="
              mt-4
              text-lg
              leading-relaxed
              text-slate-500
            "
          >
            Organize e precifique o seu
            trabalho artesanal
          </p>
        </div>

        <Suspense fallback={null}>
          <AvisoErroLogin />
        </Suspense>

        <button
          onClick={loginGoogle}
          disabled={loading}
          className="
            w-full
            rounded-2xl
            bg-slate-900
            px-6
            py-5
            text-lg
            font-bold
            text-white
            transition-all
            hover:bg-slate-800
            disabled:opacity-70
          "
        >
          {loading
            ? "Entrando..."
            : "Entrar com Google"}
        </button>

        <p
          className="
            mt-6
            text-center
            text-sm
            leading-relaxed
            text-slate-400
          "
        >
          Ao entrar você acessa sua
          central estratégica artesanal.
        </p>
      </div>
    </main>
  );
}