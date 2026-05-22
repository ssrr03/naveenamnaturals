"use client";

import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { IconPlus, IconEdit, IconTrash, IconAlertCircle } from "@tabler/icons-react";

interface Subscription {
  id: number;
  userId: number;
  userName: string;
  productId: number;
  productName: string;
  frequency: string; // e.g., "15_days", "monthly", "two_months"
  status: 'active' | 'paused' | 'cancelled';
  startDate: string;
  nextDeliveryDate: string;
  price: number;
  quantity: number;
}

export default function SubscriptionsTable() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      // Placeholder API call - you'll need to implement this backend endpoint
      const res = await fetch(`/api/admin/subscriptions?limit=${limit}&offset=${offset}`);
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.data || []);
        setTotal(data.pagination?.total || 0);
      } else {
        throw new Error("Failed to fetch subscriptions");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      // Placeholder API call - you'll need to implement this backend endpoint
      const res = await fetch(`/api/admin/subscriptions/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSubscriptions(subscriptions.filter((s) => s.id !== id));
        setDeleteId(null);
      } else {
        throw new Error("Failed to delete subscription");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading && subscriptions.length === 0) {
    return <div className="text-center py-8">Loading subscriptions...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Subscriptions</h2>
        <Link
          href="/subscriptions/new"
          className="flex gap-2 items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <IconPlus className="w-4 h-4" />
          New Subscription
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <IconAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {subscriptions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No subscriptions yet</p>
          <Link href="/subscriptions/new" className="text-blue-600 hover:underline mt-2">
            Create your first subscription
          </Link>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Product</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Frequency</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Next Delivery</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium">{subscription.userName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{subscription.productName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {subscription.frequency.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${
                          subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                          subscription.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                      }`}>
                        {subscription.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(subscription.nextDeliveryDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/subscriptions/${subscription.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <IconEdit className="w-4 h-4" />
                        </Link>

                        {deleteId === subscription.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDelete(subscription.id)}
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
                            onClick={() => setDeleteId(subscription.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <IconTrash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination (simplified for brevity, similar to CombosTable) */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} subscriptions
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