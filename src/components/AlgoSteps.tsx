"use client";
import { Box, Typography } from "@mui/material";

export interface StepDef {
  id: string;
  title: string;
  description: string;
}

interface AlgoStepsProps {
  steps: StepDef[];
  activeIdx: number;
  isDone?: boolean;
}

export default function AlgoSteps({ steps, activeIdx, isDone }: AlgoStepsProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      {steps.map((step, i) => {
        const isActive = !isDone && i === activeIdx;
        const isCompleted = isDone || i < activeIdx;

        return (
          <Box
            key={step.id}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.25,
              p: "10px 12px",
              borderRadius: 1,
              border: "1px solid",
              borderColor: isActive
                ? "rgba(99, 102, 241, 0.2)"
                : "transparent",
              bgcolor: isActive ? "rgba(99, 102, 241, 0.06)" : "transparent",
              transition: "all 0.35s ease",
            }}
          >
            <Box
              sx={{
                flexShrink: 0,
                width: 26,
                height: 26,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                fontSize: "0.7rem",
                fontWeight: 700,
                transition: "all 0.35s ease",
                ...(isActive
                  ? {
                      background:
                        "linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)",
                      border: "1.5px solid",
                      borderColor: "secondary.main",
                      color: "#fff",
                      boxShadow: "0 0 20px rgba(124,58,237,0.15)",
                      animation: "pulseMarker 1.5s ease-in-out infinite",
                    }
                  : isCompleted
                    ? {
                        background:
                          "linear-gradient(135deg, #059669, #34d399)",
                        border: "1.5px solid",
                        borderColor: "success.main",
                        color: "#fff",
                      }
                    : {
                        bgcolor: "rgba(99,102,241,0.08)",
                        border: "1.5px solid rgba(99,102,241,0.2)",
                        color: "text.disabled",
                      }),
              }}
            >
              {i + 1}
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: "text.primary",
                }}
              >
                {step.title}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  color: "text.disabled",
                  lineHeight: 1.4,
                  mt: 0.25,
                }}
              >
                {step.description}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
