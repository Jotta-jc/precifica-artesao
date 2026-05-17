type ProductPricingCardProps = {
  custoTotalProduto: number;
  maoDeObra: number;
  multiplicadorValorizacao: number;
  precoSugerido: number;
};

export function ProductPricingCard({
  custoTotalProduto,
  maoDeObra,
  multiplicadorValorizacao,
  precoSugerido,
}: ProductPricingCardProps) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        padding: "18px",
        borderRadius: "24px",
      }}
    >
      <h2
        style={{
          fontSize: "28px",
          marginBottom: "40px",
          color: "#0f172a",
        }}
      >
        Precificação Inteligente
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "30px",
        }}
      >
        <div>
          <strong
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#6b7280",
            }}
          >
            Custo Materiais
          </strong>

          <span
            style={{
              fontSize: "24px",
              color: "#dc2626",
              fontWeight: "bold",
            }}
          >
            R$ {custoTotalProduto.toFixed(2)}
          </span>
        </div>

        <div>
          <strong
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#6b7280",
            }}
          >
            Mão de Obra
          </strong>

          <span
            style={{
              fontSize: "24px",
              color: "#2563eb",
              fontWeight: "bold",
            }}
          >
            R$ {maoDeObra.toFixed(2)}
          </span>
        </div>

        <div>
          <strong
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#6b7280",
            }}
          >
            Multiplicador
          </strong>

          <span
            style={{
              fontSize: "24px",
              color: "#7c3aed",
              fontWeight: "bold",
            }}
          >
            {multiplicadorValorizacao.toFixed(1)}x
          </span>
        </div>

        <div>
          <strong
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#6b7280",
            }}
          >
            Preço Sugerido
          </strong>

          <span
            style={{
              fontSize: "24px",
              color: "#16a34a",
              fontWeight: "bold",
            }}
          >
            R$ {precoSugerido.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}