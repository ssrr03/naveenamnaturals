"use client";

import ComboForm from "@/components/combo-form";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Metadata } from "next";

export default function EditComboPage() {
  const params = useParams();
  const comboId = params.id as string;
  const [combo, setCombo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCombo = async () => {
      try {
        const res = await fetch(`/api/admin/combos/${comboId}`);
        if (res.ok) {
          const data = await res.json();
          setCombo(data.data);
        } else {
          throw new Error("Failed to fetch combo");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCombo();
  }, [comboId]);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  return <ComboForm comboId={comboId} initialData={combo} />;
}
