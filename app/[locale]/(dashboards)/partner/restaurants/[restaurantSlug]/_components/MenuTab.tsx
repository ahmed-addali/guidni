"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { FiPlus, FiTrash2, FiEdit2, FiX, FiCheck } from "react-icons/fi";
import { UtensilsCrossed } from "lucide-react";
import { addMenuItem, deleteMenuItem, updateMenuItem } from "@/lib/actions/partner-restaurants";
import { ImageUploader } from "@/components/upload/ImageUploader";

type MenuItem = {
  id:          string;
  name:        string;
  description: string;
  price:       number;
  category:    string | null;
  visible:     boolean;
  images:      { id: string; url: string }[];
};

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

function AddMenuItemForm({
  restaurantId,
  onAdded,
}: {
  restaurantId: string;
  onAdded: (item: MenuItem) => void;
}) {
  const t = useTranslations("PartnerDashboard.editRestaurant.menu");
  const [open, setOpen]     = useState(false);
  const [pending, start]    = useTransition();
  const [form, setForm]     = useState({ name: "", description: "", price: 0, category: "", visible: true });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await addMenuItem(restaurantId, form);
      if (res.success && res.item) {
        toast.success(t("addSuccess"));
        onAdded(res.item as MenuItem);
        setForm({ name: "", description: "", price: 0, category: "", visible: true });
        setOpen(false);
      } else {
        toast.error((res as any).error ?? t("addFailed"));
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-primary border border-primary/30 bg-primary/5 rounded-xl px-4 py-2.5 hover:bg-primary/10 transition-colors font-medium"
      >
        <FiPlus className="h-4 w-4" />
        {t("addButton")}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-2xl p-5 space-y-4 bg-gray-50">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{t("newItemTitle")}</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700">
          <FiX className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">{t("nameLabel")}</label>
          <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">{t("categoryLabel")}</label>
          <input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder={t("categoryPlaceholder")} className={inputCls} />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs font-medium text-gray-600">{t("descriptionLabel")}</label>
          <textarea required value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} className={`${inputCls} resize-none`} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">{t("priceLabel")}</label>
          <input required type="number" min={0} value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: parseInt(e.target.value) || 0 }))} className={inputCls} />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.visible} onChange={(e) => setForm((p) => ({ ...p, visible: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300" />
            <span className="text-sm text-gray-600">{t("visibleLabel")}</span>
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500 border border-gray-200 rounded-xl px-4 py-2 hover:border-gray-400 transition-colors">
          {t("cancel")}
        </button>
        <button type="submit" disabled={pending} className="flex items-center gap-2 text-sm bg-primary text-white rounded-xl px-5 py-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
          <FiCheck className="h-4 w-4" />
          {pending ? t("adding") : t("addItem")}
        </button>
      </div>
    </form>
  );
}

function EditMenuItemForm({
  item,
  onSaved,
  onCancel,
}: {
  item:     MenuItem;
  onSaved:  () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("PartnerDashboard.editRestaurant.menu");
  const [pending, start] = useTransition();
  const [form, setForm]  = useState({
    name:        item.name,
    description: item.description,
    price:       item.price,
    category:    item.category ?? "",
    visible:     item.visible,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await updateMenuItem(item.id, form);
      if (res.success) {
        toast.success(t("updateSuccess"));
        onSaved();
      } else {
        toast.error((res as any).error ?? t("updateFailed"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-600">{t("nameLabel")}</label>
        <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inputCls} />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-600">{t("categoryLabel")}</label>
        <input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className={inputCls} />
      </div>
      <div className="sm:col-span-2 space-y-1.5">
        <label className="text-xs font-medium text-gray-600">{t("descriptionLabel")}</label>
        <textarea required value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} className={`${inputCls} resize-none`} />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-600">{t("priceEditLabel")}</label>
        <input type="number" min={0} value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: parseInt(e.target.value) || 0 }))} className={inputCls} />
      </div>
      <div className="flex items-end pb-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.visible} onChange={(e) => setForm((p) => ({ ...p, visible: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300" />
          <span className="text-sm text-gray-600">{t("visibleShort")}</span>
        </label>
      </div>
      <div className="sm:col-span-2 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="text-sm text-gray-500 border border-gray-200 rounded-xl px-4 py-2 hover:border-gray-400 transition-colors">
          {t("cancel")}
        </button>
        <button type="submit" disabled={pending} className="flex items-center gap-2 text-sm bg-primary text-white rounded-xl px-5 py-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
          <FiCheck className="h-4 w-4" />
          {pending ? t("savingItem") : t("save")}
        </button>
      </div>
      {/* Image upload */}
      <div className="sm:col-span-2 pt-1">
        <p className="text-xs font-medium text-gray-600 mb-2">{t("imageLabel")}</p>
        <ImageUploader
          entity="menu-item"
          entityId={item.id}
          images={item.images}
          maxImages={1}
        />
      </div>
    </form>
  );
}

export function MenuTab({
  restaurantId,
  menu: initialMenu,
}: {
  restaurantId: string;
  menu: MenuItem[];
}) {
  const t = useTranslations("PartnerDashboard.editRestaurant.menu");
  const [menu, setMenu]       = useState<MenuItem[]>(initialMenu);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDel]    = useState<string | null>(null);
  const [, start]             = useTransition();

  function handleAdded(item: MenuItem) {
    setMenu((p) => [...p, item]);
  }

  function handleDelete(id: string) {
    if (!confirm(t("deleteConfirm"))) return;
    setDel(id);
    start(async () => {
      const res = await deleteMenuItem(id);
      if (res.success) {
        toast.success(t("deleteSuccess"));
        setMenu((p) => p.filter((i) => i.id !== id));
      } else {
        toast.error((res as any).error ?? t("deleteFailed"));
      }
      setDel(null);
    });
  }

  // Group by category
  const grouped = menu.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const key = item.category ?? t("uncategorized");
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const itemCountKey = menu.length === 1 ? "itemCountSingle" : "itemCountPlural";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">{t("heading")}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{t(itemCountKey, { count: menu.length })}</p>
        </div>
      </div>

      {menu.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl py-14 flex flex-col items-center justify-center gap-3 text-gray-400">
          <UtensilsCrossed className="h-8 w-8" />
          <p className="text-sm">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{cat}</p>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        {item.images[0] ? (
                          <Image src={item.images[0].url} alt={item.name} fill className="object-cover" sizes="64px" />
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <UtensilsCrossed className="h-5 w-5 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-gray-800 text-sm">{item.name}</h4>
                          {!item.visible && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                              {t("hidden")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                        <p className="text-sm font-semibold text-gray-800 mt-1">{item.price.toLocaleString()} TND</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {editing !== item.id && (
                          <button
                            type="button"
                            onClick={() => setEditing(item.id)}
                            className="p-2 text-gray-400 hover:text-primary border border-gray-200 rounded-lg hover:border-primary/30 transition-colors"
                          >
                            <FiEdit2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={deleting === item.id}
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 border border-gray-200 rounded-lg hover:border-red-200 transition-colors disabled:opacity-50"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {editing === item.id && (
                      <EditMenuItemForm
                        item={item}
                        onSaved={() => setEditing(null)}
                        onCancel={() => setEditing(null)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddMenuItemForm restaurantId={restaurantId} onAdded={handleAdded} />
    </div>
  );
}
