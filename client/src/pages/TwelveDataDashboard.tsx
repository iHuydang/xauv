import { TwelveDataControl } from "@/components/TwelveDataControl";

export default function TwelveDataDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">TwelveData Market Intelligence</h1>
          <p className="text-muted-foreground mt-2">
            Advanced financial market data integration and real-time analytics
          </p>
        </div>

        <TwelveDataControl />
      </div>
    </div>
  );
}
