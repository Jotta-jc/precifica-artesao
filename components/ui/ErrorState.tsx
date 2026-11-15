import { Button } from "@/components/ui/Button";
import { Icone } from "@/components/ui/Icone";

interface ErrorStateProps {
  /** Texto amigável. Nunca passar a mensagem técnica do banco. */
  mensagem?: string;
  aoTentarDeNovo?: () => void;
}

export function ErrorState({
  mensagem = "Não foi possível carregar. Verifique sua internet e tente de novo.",
  aoTentarDeNovo,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-4 rounded-3xl border border-perigo-suave bg-perigo-suave p-5"
    >
      <div className="flex items-start gap-3 text-lg text-texto">
        <Icone
          nome="alerta"
          className="mt-0.5 text-perigo"
        />
        <p>{mensagem}</p>
      </div>

      {aoTentarDeNovo && (
        <Button
          variante="secundario"
          onClick={aoTentarDeNovo}
        >
          Tentar de novo
        </Button>
      )}
    </div>
  );
}
