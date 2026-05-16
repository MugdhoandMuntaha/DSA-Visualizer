import { Typography, Card, CardContent, Button, Chip, Box } from "@mui/material";
import PlayArrow from "@mui/icons-material/PlayArrow";
import Lock from "@mui/icons-material/Lock";
import Link from "next/link";
import { AlgoCardProps } from "@/lib/algorithms";

export default function AlgoCard({ title, description, complexity, href, color, icon, available }: AlgoCardProps) {
  return (
    <Card
      sx={{
        position: "relative",
        overflow: "visible",
        border: "1px solid",
        borderColor: available ? `${color}30` : "divider",
        bgcolor: (t) => t.palette.mode === "dark" ? "rgba(17,24,39,0.65)" : "rgba(255,255,255,0.75)",
        backdropFilter: "blur(12px)",
        transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: available ? 1 : 0.6,
        "&:hover": available ? {
          borderColor: `${color}60`,
          transform: "translateY(-6px)",
          boxShadow: `0 12px 40px ${color}20`,
        } : {},
      }}
    >
      {!available && (
        <Chip label="Coming Soon" size="small" icon={<Lock sx={{ fontSize: "12px !important" }} />}
          sx={{ position: "absolute", top: 12, right: 12, fontSize: "0.65rem", fontWeight: 700, bgcolor: "action.hover" }} />
      )}
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 2, background: `linear-gradient(135deg, ${color}, ${color}99)`, mb: 2,
          boxShadow: `0 0 30px ${color}25`, color: "#fff" }}>
          {icon}
        </Box>
        <Typography variant="h6" sx={{ fontSize: "1.15rem", fontWeight: 700, mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, lineHeight: 1.6, minHeight: 48 }}>
          {description}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Chip label={complexity} size="small"
            sx={{ fontSize: "0.68rem", fontWeight: 600, fontFamily: "var(--font-mono)", bgcolor: `${color}15`, color, border: `1px solid ${color}30` }} />
          {available ? (
            <Button component={Link} href={href} variant="contained" size="small" endIcon={<PlayArrow />}
              sx={{ fontSize: "0.78rem", background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                boxShadow: `0 0 20px ${color}25`, "&:hover": { filter: "brightness(1.15)" } }}>
              Visualize
            </Button>
          ) : (
            <Button variant="outlined" size="small" disabled sx={{ fontSize: "0.78rem" }}>Coming Soon</Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
