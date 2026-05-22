import ComboForm from "@/components/combo-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Combo | Admin Dashboard",
  description: "Create a new product combo",
};

export default function NewComboPage() {
  return <ComboForm />;
}
