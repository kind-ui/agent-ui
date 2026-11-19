import { Sidebar, SidebarHandle, SidebarInset, SidebarPanel, SidebarTrigger } from "@/components/ui/sidebar";

const chats = [
  "Nightly export timeouts",
  "Retry with backoff",
  "Reports service latency",
  "Alert on long runs",
  "Release notes for 2.4",
];

export default function SidebarExample() {
  return (
    <Sidebar
      label="Chats"
      className="h-[420px] w-full overflow-hidden rounded-xl border border-[var(--kind-color-border)]"
    >
      <SidebarPanel>
        <nav aria-label="Recent chats" className="p-2">
          <ul className="flex flex-col gap-0.5">
            {chats.map((chat) => (
              <li key={chat}>
                <a
                  href="#chat"
                  className="block truncate rounded-md px-2.5 py-1.5 text-sm hover:bg-[var(--kind-color-hover)]"
                >
                  {chat}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </SidebarPanel>
      <SidebarHandle />
      <SidebarInset>
        <header className="flex items-center gap-2 border-b border-[var(--kind-color-border)] px-3 py-2">
          <SidebarTrigger />
          <h3 className="m-0 text-sm font-medium">Nightly export timeouts</h3>
        </header>
        <p className="m-0 p-4 text-sm text-[var(--kind-color-muted)]">
          Drag the handle to resize the chats, or press the button beside the title to hide them.
        </p>
      </SidebarInset>
    </Sidebar>
  );
}
