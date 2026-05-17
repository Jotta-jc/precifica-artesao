import { supabase } from "@/lib/supabase";

export default async function Home() {
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