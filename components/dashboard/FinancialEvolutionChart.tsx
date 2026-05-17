"use client";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type FinancialEvolutionChartProps = {
  data: {
    nome: string;
    precoSugerido: number;
  }[];
};

export function FinancialEvolutionChart({
  data,
}: FinancialEvolutionChartProps) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        padding: "24px",
        borderRadius: "24px",
        marginTop: "24px",
        width: "100%",
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
            lineHeight: 1.2,
          }}
        >
          Evolução Financeira 📈
        </h2>

        <p
          style={{
            color: "#64748b",
            fontSize: "15px",
            lineHeight: 1.5,
          }}
        >
          Visualização da valorização artesanal
        </p>
      </div>

      <div
        style={{
          width: "100%",
          height: "320px",
          minHeight: "320px",
        }}
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <LineChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: -20,
              bottom: 0,
            }}
          >
            <CartesianGrid
              stroke="#e5e7eb"
              strokeDasharray="4 4"
            />

            <XAxis
              dataKey="nome"
              tick={{
                fontSize: 14,
                fill: "#64748b",
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{
                fontSize: 14,
                fill: "#64748b",
              }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                borderRadius: "14px",
                border: "none",
                boxShadow:
                  "0 10px 30px rgba(0,0,0,0.1)",
                fontSize: "14px",
              }}
            />

            <Line
              type="monotone"
              dataKey="precoSugerido"
              stroke="#16a34a"
              strokeWidth={4}
              dot={{
                r: 6,
                fill: "#16a34a",
              }}
              activeDot={{
                r: 8,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}