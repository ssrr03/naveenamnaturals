import { Metadata } from "next";
import React from "react";
import SubscriptionsTable from "@/components/subscriptions-table";

export const metadata: Metadata = {
  title: "Subscriptions | Admin Dashboard",
  description: "Manage customer subscriptions",
};

export default function SubscriptionsPage() {
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <SubscriptionsTable />
      </div>
    </div>
  );
}