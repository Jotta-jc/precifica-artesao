type FinancialMetricsCardProps = {
  custoTotalProduto: number;
  maoDeObra: number;
  precoSugerido: number;
  margemLucro: number;
};

export function FinancialMetricsCard({
  custoTotalProduto,
  maoDeObra,
  precoSugerido,
  margemLucro,
}: FinancialMetricsCardProps) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        padding: "24px",
        borderRadius: "24px",
        marginTop: "24px",
      }}
    >
      <div
        style={{
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            fontSize: "28px",
            color: "#0f172a",
            marginBottom: "8px",
          }}
        >
          Métricas Financeiras 📊
        </h2>

        <p
          style={{
            color: "#64748b",
            fontSize: "15px",
          }}
        >
          Indicadores financeiros da precificação
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        <div
          style={{
            backgroundColor: "#eff6ff",
            padding: "18px",
            borderRadius: "18px",
          }}
        >
          <p
            style={{
              color: "#2563eb",
              marginBottom: "10px",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            Custo Total
          </p>

          <h3
            style={{
              fontSize: "18px",
              color: "#0f172a",
              fontWeight: "bold",
            }}
          >
            R$ {custoTotalProduto.toFixed(2)}
          </h3>
        </div>

        <div
          style={{
            backgroundColor: "#ecfeff",
            padding: "18px",
            borderRadius: "18px",
          }}
        >
          <p
            style={{
              color: "#0891b2",
              marginBottom: "10px",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            Mão de Obra
          </p>

          <h3
            style={{
              fontSize: "18px",
              color: "#0f172a",
              fontWeight: "bold",
            }}
          >
            R$ {maoDeObra.toFixed(2)}
          </h3>
        </div>

        <div
          style={{
            backgroundColor: "#f0fdf4",
            padding: "18px",
            borderRadius: "18px",
          }}
        >
          <p
            style={{
              color: "#15803d",
              marginBottom: "10px",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            Preço Sugerido
          </p>

          <h3
            style={{
              fontSize: "18px",
              color: "#0f172a",
              fontWeight: "bold",
            }}
          >
            R$ {precoSugerido.toFixed(2)}
          </h3>
        </div>

        <div
          style={{
            backgroundColor: "#faf5ff",
            padding: "18px",
            borderRadius: "18px",
          }}
        >
          <p
            style={{
              color: "#7e22ce",
              marginBottom: "10px",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            Margem de Lucro
          </p>

          <h3
            style={{
              fontSize: "18px",
              color: "#0f172a",
              fontWeight: "bold",
            }}
          >
            {margemLucro.toFixed(1)}%
          </h3>
        </div>
      </div>
    </div>
  );
}