type RoleBadgeProps = {
  tier: "tier1" | "tier2" | "tier3";
  size?: "sm" | "md" | "lg";
};

export function RoleBadge({ tier, size = "md" }: RoleBadgeProps) {
  const tierConfig = {
    tier1: {
      label: "1차",
      gradient: "linear-gradient(135deg, #1A439C 0%, #2A64E0 100%)",
      shadow: "0px 4px 12px rgba(26, 68, 156, 0.25)",
    },
    tier2: {
      label: "2차",
      gradient: "linear-gradient(135deg, #00A3B5 0%, #00D0D9 100%)",
      shadow: "0px 4px 12px rgba(0, 163, 181, 0.25)",
    },
    tier3: {
      label: "3차",
      gradient: "linear-gradient(135deg, #6B23C0 0%, #9C41E6 100%)",
      shadow: "0px 4px 12px rgba(107, 35, 192, 0.25)",
    },
  };

  const sizeConfig = {
    sm: { padding: "4px 10px", fontSize: "12px", borderRadius: "8px" },
    md: { padding: "6px 14px", fontSize: "14px", borderRadius: "10px" },
    lg: { padding: "8px 18px", fontSize: "16px", borderRadius: "12px" },
  };

  const config = tierConfig[tier];
  const sizing = sizeConfig[size];

  return (
    <span
      className="inline-flex items-center justify-center text-white"
      style={{
        background: config.gradient,
        boxShadow: config.shadow,
        padding: sizing.padding,
        fontSize: sizing.fontSize,
        borderRadius: sizing.borderRadius,
        fontWeight: 600,
      }}
    >
      {config.label}
    </span>
  );
}
