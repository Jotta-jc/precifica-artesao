import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code =
    requestUrl.searchParams.get("code");

 console.log(
  "URL COMPLETA:",
  request.url
);

console.log(
  "SEARCH:",
  requestUrl.search
);

console.log(
  "CODE:",
  code
);

  if (code) {
    const supabase =
      await createClient();

    const result =
      await supabase.auth.exchangeCodeForSession(
        code
      );

    console.log(
      "SESSION:",
      result.error
    );
  }

  return NextResponse.redirect(
    `${requestUrl.origin}/dashboard`
  );
}