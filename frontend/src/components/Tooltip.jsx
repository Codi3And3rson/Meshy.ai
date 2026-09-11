import * as Tooltip from "@radix-ui/react-tooltip";

export default function Tip({ content, children }) {
  if (!content) return children;

  return (
    <Tooltip.Provider delayDuration={250}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            sideOffset={8}
            style={{
              maxWidth: 280,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid var(--glass-border)",
              background: "rgba(10, 16, 32, 0.96)",
              color: "var(--text-primary)",
              boxShadow: "var(--shadow-lg)",
              fontSize: 12,
              lineHeight: 1.35,
              zIndex: 100,
            }}
          >
            {content}
            <Tooltip.Arrow
              style={{ fill: "rgba(10, 16, 32, 0.96)" }}
              width={12}
              height={6}
            />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
