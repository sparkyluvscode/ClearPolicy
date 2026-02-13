import { ReactNode } from "react";
import { ConversationSidebar } from "@/components/conversation/ConversationSidebar";

export default async function ExploreLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex gap-6">
      <aside className="hidden w-64 flex-shrink-0 lg:block">
        <div className="sticky top-24">
          <ConversationSidebar currentId={id} />
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
