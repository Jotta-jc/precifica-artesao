"use client";

import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  async function loginGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/auth/callback",
      },
    });
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f3f4f6",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "40px",
          borderRadius: "24px",
          border: "1px solid #e5e7eb",
          width: "100%",
          maxWidth: "420px",
        }}
      >
        <h1
          style={{
            fontSize: "42px",
            color: "#111827",
            marginBottom: "16px",
          }}
        >
          Login
        </h1>

        <p
          style={{
            fontSize: "20px",
            color: "#6b7280",
            marginBottom: "32px",
          }}
        >
          Entre com sua conta Google 🚀
        </p>

        <button
          onClick={loginGoogle}
          style={{
            width: "100%",
            padding: "18px",
            borderRadius: "14px",
            border: "none",
            backgroundColor: "#111827",
            color: "#ffffff",
            fontSize: "22px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Entrar com Google
        </button>
      </div>
    </main>
  );
}