"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, ShoppingCart } from "tabler-icons-react";

interface ComboProduct {
  id: number;
  productId: number;
  quantity: number;
  product?: {
    id: number;
    name: string;
    images: string[];
  };
}

interface Combo {
  id: number;
  name: string;
  slug: string;
  description: string;
  comboPrice: number;
  originalPrice: number;
  discount: number;
  images: string[];
  tag?: string;
  items: ComboProduct[];
}

interface CombosDisplayProps {
  limit?: number;
}

export default function CombosDisplay({ limit = 6 }: CombosDisplayProps) {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCombos = async () => {
      try {
        const res = await fetch(`/api/combos?limit=${limit}`);
        if (res.ok) {
          const data = await res.json();
          setCombos(data.data || []);
        } else {
          throw new Error("Failed to fetch combos");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCombos();
  }, [limit]);

  if (loading) {
    return <div className="text-center py-8">Loading combos...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (combos.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Special Combos</h2>
        <p className="text-gray-600">Get more value with our bundled products</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {combos.map((combo) => (
          <Link key={combo.id} href={`/combo/${combo.slug}`}>
            <div className="border rounded-lg hover:shadow-lg transition-shadow overflow-hidden h-full flex flex-col">
              {/* Image */}
              <div className="relative bg-gray-100 aspect-square overflow-hidden">
                {combo.images && combo.images.length > 0 ? (
                  <Image
                    src={combo.images[0]}
                    alt={combo.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}

                {/* Discount Badge */}
                {combo.discount > 0 && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {combo.discount}% OFF
                  </div>
                )}

                {/* Tag Badge */}
                {combo.tag && (
                  <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold uppercase">
                    {combo.tag}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{combo.name}</h3>

                {combo.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{combo.description}</p>
                )}

                {/* Items Count */}
                <div className="text-xs text-gray-500 mb-3">
                  {combo.items?.length || 0} products included
                </div>

                {/* Pricing */}
                <div className="mt-auto">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-2xl font-bold text-green-600">
                      ₹{combo.comboPrice.toFixed(2)}
                    </span>
                    {combo.originalPrice > combo.comboPrice && (
                      <span className="text-sm text-gray-500 line-through">
                        ₹{combo.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors">
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
