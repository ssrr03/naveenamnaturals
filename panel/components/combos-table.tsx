"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Edit, Trash2, AlertCircle, Plus, Eye, EyeOff } from "tabler-icons-react";

interface Combo {
  id: number;
  name: string;
  slug: string;
  comboPrice: number;
  originalPrice: number;
  discount: number;
  productCount: number;
  isActive: boolean;
  images: string[];
  tag?: string;
}

export default function CombosTable() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchCombos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/combos?limit=${limit}&offset=${offset}`);
      if (res.ok) {
        const data = await res.json();
        setCombos(data.data || []);
        setTotal(data.pagination.total || 0);
      } else {
        throw new Error("Failed to fetch combos");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombos();
  }, [limit, offset]);

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/combos/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCombos(combos.filter((c) => c.id !== id));
        setDeleteId(null);
      } else {
        throw new Error("Failed to delete combo");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/combos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        setCombos(
          combos.map((c) =>
            c.id === id ? { ...c, isActive: !currentStatus } : c
          )
        );
      }
    } catch (err) {
      console.error("Error toggling combo status:", err);
    }
  };

  if (loading && combos.length === 0) {
    return <div className="text-center py-8">Loading combos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Combos</h2>
        <Link
          href="/combos/new"
          className="flex gap-2 items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Combo
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {combos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No combos yet</p>
          <Link href="/combos/new" className="text-blue-600 hover:underline mt-2">
            Create your first combo
          </Link>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Products</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Discount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Tag</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {combos.map((combo) => (
                  <tr key={combo.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{combo.name}</p>
                        <p className="text-sm text-gray-500">{combo.slug}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {combo.productCount} items
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-semibold">₹{combo.comboPrice.toFixed(2)}</p>
                        <p className="text-gray-500">MRP: ₹{combo.originalPrice.toFixed(2)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {combo.discount}% OFF
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {combo.tag ? (
                          <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                            {combo.tag}
                          </span>
                        ) : (
                          "-"
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleActive(combo.id, combo.isActive)}
                        className={`p-2 rounded ${
                          combo.isActive
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {combo.isActive ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/combos/${combo.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        {deleteId === combo.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDelete(combo.id)}
                              disabled={deleting}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              {deleting ? "..." : "Confirm"}
                            </button>
                            <button
                              onClick={() => setDeleteId(null)}
                              className="px-3 py-1 bg-gray-300 text-xs rounded hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteId(combo.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} combos
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>

              <button
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
                className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
