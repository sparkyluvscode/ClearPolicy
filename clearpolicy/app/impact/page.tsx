import Testimonials from "@/components/Testimonials";
import { Card } from "@/components/ui";

export default function ImpactPage() {
  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <h1 className="page-title">Impact</h1>
        <p className="page-subtitle">Stories from people using ClearPolicy to understand measures faster.</p>
      </Card>
      <Testimonials />
    </div>
  );
}


