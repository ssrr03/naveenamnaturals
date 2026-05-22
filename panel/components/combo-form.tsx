"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, AlertCircle } from "tabler-icons-react";
import { Category, fetchCategories } from "@/lib/categories-api";
import { fetchProductVariants } from "@/lib/variants-api";

interface ComboItem {
  id?: number;
  productId: number;
  variantId?: number | null;
  quantity: number;
  sortOrder: number;
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

interface ComboFormProps {
  comboId?: string;
  initialData?: any;
}

export default function ComboForm({ comboId, initialData }: ComboFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [variantsByProduct, setVariantsByProduct] = useState<Record<number, any[]>>({});

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    comboPrice: 0,
    originalPrice: 0,
    discount: 0,
    categoryId: "",
    tag: "",
    images: [] as string[],
    isActive: true,
  });

  const [comboItems, setComboItems] = useState<ComboItem[]>([]);

  // Initialize form with existing data
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        slug: initialData.slug || "",
        description: initialData.description || "",
        comboPrice: initialData.comboPrice || 0,
        originalPrice: initialData.originalPrice || 0,
        discount: initialData.discount || 0,
        categoryId: initialData.categoryId || "",
        tag: initialData.tag || "",
        images: initialData.images || [],
        isActive: initialData.isActive !== false,
      });

      if (initialData.items) {
        setComboItems(
          initialData.items.map((item: ComboItem, index: number) => ({
            ...item,
            sortOrder: index,
          }))
        );
      }
    }
  }, [initialData]);

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products?limit=1000");
        if (res.ok) {
          const data = await res.json();
          setProducts(data.data || []);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };

    fetchProducts();
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetchCategories();
        setCategories(response.data || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    loadCategories();
  }, []);

  const loadVariantsForProduct = async (productId: number) => {
    if (!productId || variantsByProduct[productId]) {
      return;
    }

    try {
      const response = await fetchProductVariants(productId);
      setVariantsByProduct((prev) => ({
        ...prev,
        [productId]: response.data || [],
      }));
    } catch (err) {
      console.error(`Error fetching variants for product ${productId}:`, err);
      setVariantsByProduct((prev) => ({ ...prev, [productId]: [] }));
    }
  };

  useEffect(() => {
    if (initialData?.items?.length) {
      initialData.items.forEach((item: ComboItem) => {
        if (item.productId) {
          loadVariantsForProduct(item.productId);
        }
      });
    }
  }, [initialData]);

  // Auto-generate slug
  useEffect(() => {
    if (formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.name]);

  // Calculate automatic discount
  useEffect(() => {
    if (formData.originalPrice > 0 && formData.comboPrice > 0) {
      const discount = Math.round(
        ((formData.originalPrice - formData.comboPrice) / formData.originalPrice) * 100
      );
      setFormData((prev) => ({ ...prev, discount }));
    }
  }, [formData.originalPrice, formData.comboPrice]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: name.includes("Price") ? parseFloat(value) || 0 : val,
    }));
  };

  const handleAddItem = () => {
    if (products.length === 0) {
      return;
    }

    const newItem: ComboItem = {
      productId: products[0].id,
      variantId: null,
      quantity: 1,
      sortOrder: comboItems.length,
    };
    setComboItems([...comboItems, newItem]);
    loadVariantsForProduct(products[0].id);
  };

  const handleRemoveItem = (index: number) => {
    setComboItems(comboItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...comboItems];
    if (field === "productId") {
      const productId = parseInt(value, 10);
      newItems[index] = {
        ...newItems[index],
        productId,
        variantId: null,
      };
      setComboItems(newItems);
      loadVariantsForProduct(productId);
      return;
    }

    newItems[index] = { ...newItems[index], [field]: value };
    setComboItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        categoryId: formData.categoryId ? parseInt(formData.categoryId as string, 10) : null,
        items: comboItems.map(({ product, variant, ...item }) => item),
      };

      const method = comboId ? "PUT" : "POST";
      const url = comboId ? `/api/admin/combos/${comboId}` : "/api/admin/combos";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save combo");
      }

      router.push("/combos");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error saving combo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{comboId ? "Edit Combo" : "Create Combo"}</h1>
          <p className="text-gray-500 mt-2">
            {comboId ? "Update combo details and items" : "Bundle multiple products as a combo"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium mb-1">Combo Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Summer Care Bundle"
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Slug *</label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="Auto-generated from name"
                className="w-full border rounded px-3 py-2 bg-gray-50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe what's in this combo"
                rows={3}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tag</label>
                <select
                  name="tag"
                  value={formData.tag}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Tag</option>
                  <option value="new">New</option>
                  <option value="sale">Sale</option>
                  <option value="bestseller">Bestseller</option>
                  <option value="trending">Trending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">Pricing</h2>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Original Price *</label>
                <input
                  type="number"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Combo Price *</label>
                <input
                  type="number"
                  name="comboPrice"
                  value={formData.comboPrice}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Discount %</label>
                <input
                  type="number"
                  value={formData.discount}
                  placeholder="Auto-calculated"
                  disabled
                  className="w-full border rounded px-3 py-2 bg-gray-50"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              Savings: ₹{(formData.originalPrice - formData.comboPrice).toFixed(2)} ({formData.discount}%)
            </div>
          </div>

          {/* Combo Items */}
          <div className="border rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Products in Combo</h2>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={products.length === 0}
                className="flex gap-2 items-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>

            {comboItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No products added to combo yet</p>
                <p className="text-sm">Click "Add Product" to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comboItems.map((item, index) => (
                  <div key={index} className="border rounded p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Product</label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(index, "productId", parseInt(e.target.value))}
                          className="w-full border rounded px-3 py-2"
                          required
                        >
                          <option value="">Select Product</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Variant (Optional)</label>
                        <select
                          value={item.variantId || ""}
                          onChange={(e) => handleItemChange(index, "variantId", e.target.value ? parseInt(e.target.value, 10) : null)}
                          className="w-full border rounded px-3 py-2"
                        >
                          <option value="">No Specific Variant</option>
                          {(variantsByProduct[item.productId] || []).map((variant) => (
                            <option key={variant.id} value={variant.id}>
                              {variant.name} {variant.price ? `- ₹${variant.price}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-sm font-medium mb-1">Quantity</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                            min="1"
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>

                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="border rounded-lg p-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="rounded"
              />
              <span className="font-medium">Active</span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : comboId ? "Update Combo" : "Create Combo"}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="border px-6 py-2 rounded font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
