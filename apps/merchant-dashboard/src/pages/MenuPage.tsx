import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Search, ToggleLeft, ToggleRight, Package, RefreshCw, AlertCircle, Plus, Pencil, Trash2, X } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { DashboardSkeleton } from '../components/Skeletons';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  category: string;
  brand: string;
  image_url: string;
  stock: number;
  is_available: boolean;
  is_veg: boolean;
  unit: string;
}

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', original_price: '',
    category: '', brand: '', image_url: '', stock: '', unit: '', is_veg: false,
  });

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/merchant/menu');
      setProducts(data.products ?? []);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMenu(); }, []);

  const openAdd = () => {
    setEditProduct(null);
    setFormData({ name: '', description: '', price: '', original_price: '', category: '', brand: '', image_url: '', stock: '', unit: '', is_veg: false });
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setFormData({
      name: p.name, description: p.description ?? '',
      price: String(p.price / 100), original_price: p.original_price ? String(p.original_price / 100) : '',
      category: p.category ?? '', brand: p.brand ?? '',
      image_url: p.image_url ?? '', stock: String(p.stock),
      unit: p.unit ?? '', is_veg: p.is_veg,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price) return;
    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: Math.round(Number(formData.price) * 100),
        original_price: formData.original_price ? Math.round(Number(formData.original_price) * 100) : undefined,
        category: formData.category.trim() || undefined,
        brand: formData.brand.trim() || undefined,
        image_url: formData.image_url.trim() || undefined,
        stock: formData.stock ? Number(formData.stock) : 0,
        unit: formData.unit.trim() || undefined,
        is_veg: formData.is_veg,
      };
      if (editProduct) {
        const { data } = await api.put(`/merchant/products/${editProduct.id}`, payload);
        setProducts((prev) => prev.map((p) => p.id === editProduct.id ? { ...p, ...data.product } : p));
        toast('success', 'Product updated.');
      } else {
        const { data } = await api.post('/merchant/products', payload);
        setProducts((prev) => [...prev, data.product]);
        toast('success', 'Product added.');
      }
      setShowForm(false);
    } catch {
      toast('error', 'Failed to save product — please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Delete this product permanently?')) return;
    setDeleting(productId);
    try {
      await api.delete(`/merchant/products/${productId}`);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast('success', 'Product deleted.');
    } catch {
      toast('error', 'Could not delete product.');
    } finally {
      setDeleting(null);
    }
  };

  const toggleAvailability = async (product: Product) => {
    setToggling(product.id);
    try {
      const { data } = await api.patch(`/merchant/products/${product.id}/availability`, {
        is_available: !product.is_available,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, ...data.product } : p))
      );
      toast('success', data.product?.is_available ? 'Product enabled.' : 'Product hidden.');
    } catch {
      toast('error', 'Could not toggle availability.');
    } finally {
      setToggling(null);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const grouped = filtered.reduce<Record<string, Product[]>>((acc, p) => {
    const cat = p.category || 'Uncategorised';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const fmt = (v: number) => `₹${(v / 100).toLocaleString('en-IN')}`;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Menu</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{products.length} items in your store</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchMenu} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} />
            Add Product
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products or categories…"
          className="input pl-9"
        />
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
          <Package size={48} className="mb-3 opacity-30" />
          <p className="text-lg font-medium">No products found</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items]) => (
            <section key={category}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-3 flex items-center gap-2">
                <span className="w-4 h-px bg-slate-200 dark:bg-slate-700" />
                {category}
                <span className="text-slate-400 dark:text-slate-600">({items.length})</span>
              </h2>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((product) => (
                  <div
                    key={product.id}
                    className={clsx(
                      'card flex flex-col gap-3 transition-all',
                      !product.is_available && 'opacity-60'
                    )}
                  >
                    {/* Image */}
                    <div className="relative w-full h-28 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                          <Package size={32} />
                        </div>
                      )}
                      {/* Veg/Non-veg dot */}
                      <span
                        className={clsx(
                          'absolute top-2 left-2 w-3.5 h-3.5 rounded-full border-2',
                          product.is_veg
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-red-500 bg-red-500'
                        )}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 dark:text-slate-100 text-sm leading-snug">
                        {product.name}
                      </p>
                      {product.brand && (
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{product.brand}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                          {fmt(product.price)}
                        </span>
                        {product.original_price && product.original_price > product.price && (
                          <span className="text-slate-400 dark:text-slate-600 line-through text-xs">
                            {fmt(product.original_price)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stock warning */}
                    {product.stock < 5 && product.is_available && (
                      <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-300 bg-red-500/10 px-2.5 py-1.5 rounded-lg border border-red-500/25">
                        <AlertCircle size={12} />
                        Only {product.stock} left
                      </div>
                    )}

                    {/* Toggle */}
                    <button
                      onClick={() => toggleAvailability(product)}
                      disabled={toggling === product.id}
                      className={clsx(
                        'flex items-center justify-between px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                        product.is_available
                          ? 'bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-500/10 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                      )}
                    >
                      <span>{product.is_available ? 'Available' : 'Unavailable'}</span>
                      {product.is_available ? (
                        <ToggleRight size={18} className="text-emerald-500" />
                      ) : (
                        <ToggleLeft size={18} />
                      )}
                    </button>

                    {/* Edit / Delete */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-medium transition-all"
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={deleting === product.id}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-500/10 text-xs font-medium transition-all disabled:opacity-40"
                      >
                        {deleting === product.id
                          ? <RefreshCw size={13} className="animate-spin" />
                          : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ── Add / Edit Product Modal ─────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {editProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setShowForm(false)} aria-label="Close" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Product Name *</label>
                <input className="input w-full" placeholder="e.g. Alphonso Mango" value={formData.name} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Description</label>
                <textarea className="input w-full h-20 resize-none" placeholder="Short description…" value={formData.description} onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Price (₹) *</label>
                  <input type="number" min="0" className="input w-full" placeholder="0" value={formData.price} onChange={(e) => setFormData(f => ({ ...f, price: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Original Price (₹)</label>
                  <input type="number" min="0" className="input w-full" placeholder="0" value={formData.original_price} onChange={(e) => setFormData(f => ({ ...f, original_price: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Category</label>
                  <input className="input w-full" placeholder="e.g. Fresh, Snacks" value={formData.category} onChange={(e) => setFormData(f => ({ ...f, category: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Brand</label>
                  <input className="input w-full" placeholder="e.g. Fresho" value={formData.brand} onChange={(e) => setFormData(f => ({ ...f, brand: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Stock Qty</label>
                  <input type="number" min="0" className="input w-full" placeholder="0" value={formData.stock} onChange={(e) => setFormData(f => ({ ...f, stock: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Unit</label>
                  <input className="input w-full" placeholder="e.g. kg, pcs, L" value={formData.unit} onChange={(e) => setFormData(f => ({ ...f, unit: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Image URL</label>
                <input className="input w-full" placeholder="https://…" value={formData.image_url} onChange={(e) => setFormData(f => ({ ...f, image_url: e.target.value }))} />
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" className="w-4 h-4 accent-emerald-500" checked={formData.is_veg} onChange={(e) => setFormData(f => ({ ...f, is_veg: e.target.checked }))} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Vegetarian / Vegan product</span>
              </label>
            </div>

            <div className="flex gap-3 p-5 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleSave}
                disabled={!formData.name.trim() || !formData.price || saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <RefreshCw size={15} className="animate-spin" /> : (editProduct ? 'Save Changes' : 'Add Product')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
