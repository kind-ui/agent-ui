// The host's controls sit in the composer's `attach` cell and wrap onto more lines when they don't fit.
export const controls = {
  gridArea: "attach",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "6px",
  minWidth: "0",
} as const;
