import CombosTable from "@/components/combos-table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Combos | Admin Dashboard",
  description: "Manage product combos",
};

export default function CombosPage() {
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <CombosTable />
      </div>
    </div>
  );
}
