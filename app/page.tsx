import { createClient } from "@/lib/supabase/client";

export default async function Home() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("test")
    .select("*");

  console.log(data);
  console.log(error);

  return (
    <main>
      <h1>Supabase conectado 🚀</h1>
    </main>
  );
}