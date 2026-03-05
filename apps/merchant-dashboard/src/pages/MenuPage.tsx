import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Search, ToggleLeft, ToggleRight, Package, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../services/api';

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

  const toggleAvailability = async (product: Product) => {
    setToggling(product.id);
    try {
      const { data } = await api.patch(`/merchant/products/${product.id}/availability`, {
        is_available: !product.is_available,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, ...data.product } : p))
      );
    } catch {
      // Toast would go here
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

  const fmt = (v: number) => `₹${v.toLocaleString('en-IN')}`;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Menu</h1>
          <p className="text-sm text-slate-400">{products.length} items in your store</p>
        </div>
        <button onClick={fetchMenu} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
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
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={28} className="animate-spin text-emerald-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Package size={48} className="mb-3 opacity-30" />
          <p className="text-lg font-medium">No products found</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items]) => (
            <section key={category}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                <span className="w-4 h-px bg-slate-700" />
                {category}
                <span className="text-slate-600">({items.length})</span>
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
                    <div className="relative w-full h-28 rounded-lg overflow-hidden bg-slate-900">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700">
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
                      <p className="font-medium text-slate-100 text-sm leading-snug">
                        {product.name}
                      </p>
                      {product.brand && (
                        <p className="text-xs text-slate-500 mt-0.5">{product.brand}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-emerald-400 font-semibold text-sm">
                          {fmt(product.price)}
                        </span>
                        {product.original_price && product.original_price > product.price && (
                          <span className="text-slate-600 line-through text-xs">
                            {fmt(product.original_price)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stock warning */}
                    {product.stock < 5 && product.is_available && (
                      <div className="flex items-center gap-1.5 text-xs text-orange-400 bg-orange-500/10 px-2.5 py-1.5 rounded-lg border border-orange-500/20">
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
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
                      )}
                    >
                      <span>{product.is_available ? 'Available' : 'Unavailable'}</span>
                      {product.is_available ? (
                        <ToggleRight size={18} className="text-emerald-500" />
                      ) : (
                        <ToggleLeft size={18} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
