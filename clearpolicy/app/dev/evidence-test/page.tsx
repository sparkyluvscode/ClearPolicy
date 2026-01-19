import { notFound } from "next/navigation";
import EvidenceTestClient from "./EvidenceTestClient";

export default function EvidenceTestPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <EvidenceTestClient />;
}
