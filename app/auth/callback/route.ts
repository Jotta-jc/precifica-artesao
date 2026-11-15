import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code =
    requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?erro=login`
    );
  }

  const supabase =
    await createClient();

  const { error } =
    await supabase.auth.exchangeCodeForSession(
      code
    );

  if (error) {
    console.error(
      "Falha ao concluir o login:",
      error.message
    );

    return NextResponse.redirect(
      `${requestUrl.origin}/login?erro=login`
    );
  }

  return NextResponse.redirect(
    `${requestUrl.origin}/dashboard`
  );
}