"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FiCheck, FiX, FiArrowRight } from "react-icons/fi";
import { createProduct } from "@/lib/actions/partner-shops";
import { PRODUCT_CATEGORIES } from "@/lib/utils/shop-categories";
import { ImageUploader } from "@/components/upload/ImageUploader";

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

export function CreateProductForm({
  shopId,
  shopSlug,
  locale,
}: {
  shopId:   string;
  shopSlug: string;
  locale:   string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [tagInput, setTagInput] = useState("");

  // After creation we store the new product ID and switch to the image upload phase
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name:              "",
    arabicName:        "",
    description:       "",
    arabicDescription: "",
    price:             "",
    comparePrice:      "",
    category:          PRODUCT_CATEGORIES[0].id,
    material:          "",
    origin:            "",
    weight:            "",
    stock:             "0",
    isHandmade:        false,
    isLocalOnly:       false,
    featured:          false,
    tags:              [] as string[],
  });

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (!form.tags.includes(tag)) {
        setForm((p) => ({ ...p, tags: [...p.tags, tag] }));
      }
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setForm((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await createProduct(shopId, {
        ...form,
        arabicName:        form.arabicName        || undefined,
        arabicDescription: form.arabicDescription || undefined,
        material:          form.material          || undefined,
        origin:            form.origin            || undefined,
        price:             Number(form.price),
        comparePrice:      form.comparePrice ? Number(form.comparePrice) : null,
        weight:            form.weight       ? Number(form.weight)       : null,
        stock:             Number(form.stock),
      });
      if (res.success && res.data) {
        toast.success("Product created! Now add some photos.");
        // Switch to image upload phase — need the product ID
        // createProduct returns { slug }, fetch the ID via a findUnique won't work here;
        // we need to get the ID back. Let's update createProduct to return id too.
        setCreatedProductId(res.data.id);
      } else {
        toast.error(res.error ?? "Failed to create product");
      }
    });
  }

  function handleDone() {
    router.push(`/${locale}/partner/shops/${shopSlug}?tab=products`);
  }

  // ── Phase 2: Image upload ────────────────────────────────────────────────────
  if (createdProductId) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <FiCheck className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">Product created successfully</p>
            <p className="text-xs text-green-600 mt-0.5">Now add photos to make it stand out.</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Product photos</h3>
          <p className="text-xs text-gray-400 mb-4">Upload up to 6 photos. The first image will be used as the cover.</p>
          <ImageUploader
            entity="product"
            entityId={createdProductId}
            images={[]}
            maxImages={6}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleDone}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            Done <FiArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Phase 1: Product details form ────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Name *</label>
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Arabic name</label>
          <input value={form.arabicName} onChange={(e) => setForm((p) => ({ ...p, arabicName: e.target.value }))} dir="rtl" className={inputCls} />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Description *</label>
          <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required rows={4} className={`${inputCls} resize-none`} />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Arabic description</label>
          <textarea value={form.arabicDescription} onChange={(e) => setForm((p) => ({ ...p, arabicDescription: e.target.value }))} rows={3} dir="rtl" className={`${inputCls} resize-none`} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Category *</label>
          <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className={`${inputCls} bg-white`}>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label.en}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Price (TND) *</label>
          <input type="number" min={1} value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} required className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Compare price (TND)</label>
          <input type="number" min={1} value={form.comparePrice} onChange={(e) => setForm((p) => ({ ...p, comparePrice: e.target.value }))} placeholder="Original price (strikethrough)" className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Stock *</label>
          <input type="number" min={0} value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} required className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Material</label>
          <input value={form.material} onChange={(e) => setForm((p) => ({ ...p, material: e.target.value }))} placeholder="e.g. Olive wood" className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Origin</label>
          <input value={form.origin} onChange={(e) => setForm((p) => ({ ...p, origin: e.target.value }))} placeholder="e.g. Djerba, Tunisia" className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Weight (grams)</label>
          <input type="number" min={1} value={form.weight} onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))} placeholder="e.g. 350" className={inputCls} />
        </div>

        {/* Tags */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Tags</label>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={addTag}
            placeholder="Type a tag and press Enter"
            className={inputCls}
          />
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="text-gray-400 hover:text-gray-700">
                    <FiX className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Toggles */}
        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { key: "isHandmade",  label: "Handmade",         desc: "This product is handcrafted" },
            { key: "isLocalOnly", label: "Local pickup only", desc: "Cannot be shipped" },
            { key: "featured",    label: "Featured",          desc: "Highlight in listings" },
          ].map(({ key, label, desc }) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer p-3 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
              <input
                type="checkbox"
                checked={form[key as keyof typeof form] as boolean}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))}
                className="h-4 w-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary/30"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={() => router.back()}
          className="text-sm text-gray-500 border border-gray-200 rounded-xl px-4 py-2.5 hover:border-gray-400 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={pending}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
          {pending ? "Creating…" : <>Create product <FiArrowRight className="h-4 w-4" /></>}
        </button>
      </div>
    </form>
  );
}
