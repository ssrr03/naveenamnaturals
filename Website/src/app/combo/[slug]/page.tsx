"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import TopNavOne from "@/components/Header/TopNav/TopNavOne";
import MenuCosmeticThree from "@/components/Header/Menu/MenuCosmeticThree";
import Footer from "@/components/Footer/Footer";
import { AlertCircle, ShoppingCart, ArrowLeft } from "tabler-icons-react";

interface ComboProduct {
  id: number;
  productId: number;
  quantity: number;
  product?: {
    id: number;
    name: string;
    images: string[];
  };
  variant?: {
    id: number;
    name: string;
    price: number;
  };
}

interface Combo {
  id: number;
  name: string;
  slug: string;
  description?: string;
  comboPrice: number;
  originalPrice: number;
  discount: number;
  images: string[];
  tag?: string;
  items: ComboProduct[];
}

export default function ComboDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [combo, setCombo] = useState<Combo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCombo = async () => {
      if (!slug) {
        setLoading(false);
        setError("Invalid combo URL");
        return;
      }

      try {
        const res = await fetch(`/api/combos/slug/${encodeURIComponent(slug)}`);
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.message || "Combo not found");
        }

        const data = await res.json();
        setCombo(data.data || null);
      } catch (err: any) {
        setError(err.message || "Failed to load combo");
      } finally {
        setLoading(false);
      }
    };

    fetchCombo();
  }, [slug]);

  return (
    <div className="bg-white/70 text-[15px] sm:text-base">
      <TopNavOne props="style-one bg-primary" slogan="Welcome to Naveenam Naturals Store" />
      <div id="header" className="relative w-full">
        <MenuCosmeticThree />
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>

        {loading ? (
          <div className="rounded-lg border border-gray-200 p-10 text-center text-gray-600">Loading combo...</div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-red-700">
            <div className="flex items-center justify-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">{error}</span>
            </div>
            <p>If the combo exists, please try again later.</p>
          </div>
        ) : !combo ? (
          <div className="rounded-lg border border-gray-200 p-10 text-center text-gray-600">Combo not found.</div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="space-y-6">
              <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-100">
                {combo.images && combo.images.length > 0 ? (
                  <Image
                    src={combo.images[0]}
                    alt={combo.name}
                    width={1200}
                    height={800}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-80 items-center justify-center text-gray-500">No image available</div>
                )}
              </div>

              <div className="space-y-4 rounded-lg border border-gray-200 p-6">
                <h1 className="text-3xl font-semibold">{combo.name}</h1>
                {combo.tag && <div className="inline-flex rounded-full bg-green-500 px-3 py-1 text-xs font-semibold uppercase text-white">{combo.tag}</div>}
                {combo.description && <p className="text-gray-700">{combo.description}</p>}

                <div className="space-y-3">
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                    <span>{combo.items.length} products included</span>
                    <span>Discount {combo.discount}%</span>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-bold text-green-700">₹{combo.comboPrice.toFixed(2)}</span>
                      {combo.originalPrice > combo.comboPrice && (
                        <span className="text-sm text-gray-500 line-through">₹{combo.originalPrice.toFixed(2)}</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-600">You save ₹{(combo.originalPrice - combo.comboPrice).toFixed(2)}.</p>
                  </div>
                </div>

                <button className="w-full rounded bg-blue-600 px-4 py-3 text-white transition hover:bg-blue-700 flex items-center justify-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
              </div>
            </section>

            <aside className="space-y-6 rounded-lg border border-gray-200 p-6">
              <div className="space-y-3">
                <h2 className="text-xl font-semibold">Combo contents</h2>
                <div className="space-y-3">
                  {combo.items.map((item) => (
                    <div key={item.id ?? `${item.productId}-${item.variant?.id || 0}`} className="rounded-lg border border-gray-200 bg-white p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 overflow-hidden rounded bg-gray-100">
                          {item.product?.images?.[0] ? (
                            <Image
                              src={item.product.images[0]}
                              alt={item.product.name}
                              width={64}
                              height={64}
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-gray-400">No image</div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{item.product?.name || "Product"}</p>
                          {item.variant && <p className="text-sm text-gray-500">{item.variant.name}</p>}
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
