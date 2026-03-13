import { useState, useEffect } from 'react';
import { User, Store, Clock, Image, Phone, Save, RefreshCw, Coffee, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

interface ProfileData {
  storeName: string;
  storeType: string;
  imageUrl: string;
  deliveryTimeMin: string;
  cuisineTags: string;   // comma-separated string in the form
  ownerName: string;
  email: string;
  phone: string;
  businessOpen: string;
  businessClose: string;
  closedDays: string;
  estPrepTimeMin: number;
  isPaused: boolean;
}

const FIELD_DEFAULTS: ProfileData = {
  storeName: '',
  storeType: '',
  imageUrl: '',
  deliveryTimeMin: '',
  cuisineTags: '',
  ownerName: '',
  email: '',
  phone: '',
  businessOpen: '',
  businessClose: '',
  closedDays: '',
  estPrepTimeMin: 15,
  isPaused: false,
};

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileData>(FIELD_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const set = (field: keyof ProfileData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/merchant/profile');
        const s = data.store;
        setForm({
          storeName:       s.name ?? '',
          storeType:       s.store_type ?? s.type ?? '',
          imageUrl:        s.image_url ?? '',
          deliveryTimeMin: s.delivery_time_min != null ? String(s.delivery_time_min) : '',
          cuisineTags:     Array.isArray(s.cuisine_tags)
                             ? s.cuisine_tags.join(', ')
                             : (s.cuisine_tags ?? ''),
          ownerName:       s.owner_name ?? '',
          email:           s.email ?? '',
          phone:           s.phone ?? '',
          businessOpen:    s.business_hours?.open ?? '',
          businessClose:   s.business_hours?.close ?? '',
          closedDays:      Array.isArray(s.business_hours?.closedDays) ? s.business_hours.closedDays.join(', ') : '',
          estPrepTimeMin:  s.est_prep_time_min ?? 15,
          isPaused:        !!s.is_paused,
        });
      } catch {
        toast('error', 'Could not load profile.');
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        storeName:       form.storeName.trim()       || undefined,
        storeType:       form.storeType.trim()       || undefined,
        imageUrl:        form.imageUrl.trim()        || undefined,
        deliveryTimeMin: form.deliveryTimeMin        ? Number(form.deliveryTimeMin) : undefined,
        cuisineTags:     form.cuisineTags.trim()
                           ? form.cuisineTags.split(',').map((t) => t.trim()).filter(Boolean)
                           : undefined,
        ownerName:       form.ownerName.trim()       || undefined,
        phone:           form.phone.trim()           || undefined,
        estPrepTimeMin:  form.estPrepTimeMin,
        isPaused:        form.isPaused,
        businessHours:
          form.businessOpen || form.businessClose || form.closedDays
            ? {
                open: form.businessOpen || undefined,
                close: form.businessClose || undefined,
                closedDays: form.closedDays
                  ? form.closedDays.split(',').map((d) => d.trim()).filter(Boolean)
                  : [],
              }
            : undefined,
      };
      const { data } = await api.patch('/merchant/profile', payload);
      const s = data.store;
      setForm((f) => ({
        ...f,
        storeName:  s.name ?? f.storeName,
        ownerName:  s.owner_name ?? f.ownerName,
        phone:      s.phone ?? f.phone,
        imageUrl:   s.image_url ?? f.imageUrl,
        estPrepTimeMin: s.est_prep_time_min ?? f.estPrepTimeMin,
        isPaused:   !!s.is_paused,
        businessOpen: s.business_hours?.open ?? f.businessOpen,
        businessClose: s.business_hours?.close ?? f.businessClose,
        closedDays: Array.isArray(s.business_hours?.closedDays)
          ? s.business_hours.closedDays.join(', ')
          : f.closedDays,
      }));
      toast('success', 'Profile saved successfully.');
    } catch {
      toast('error', 'Save failed — please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw size={28} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Profile &amp; Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Update your store details and contact information.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        {/* ── Store Fulfillment (NEW) ────────────────────────────────── */}
        <section className={`card space-y-4 border-l-4 transition-colors ${form.isPaused ? 'border-amber-500 bg-amber-500/5' : 'border-emerald-500'}`}>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-widest">
              <Coffee size={14} /> Fulfillment Status
            </h2>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${form.isPaused ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                {form.isPaused ? 'PAUSED' : 'ONLINE'}
              </span>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, isPaused: !f.isPaused }))}
                className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                  form.isPaused 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                {form.isPaused ? 'Resume Orders' : 'Pause Orders'}
              </button>
            </div>
          </div>

          {form.isPaused && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg text-amber-200 text-xs">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <p>While paused, customers will see your store as closed and won't be able to place new orders.</p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-400">Merchant Prep Time (Estimated)</label>
              <span className="text-sm font-bold text-emerald-400">{form.estPrepTimeMin} mins</span>
            </div>
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              className="w-full accent-emerald-500 bg-slate-700 h-1.5 rounded-lg appearance-none cursor-pointer"
              value={form.estPrepTimeMin}
              onChange={(e) => setForm(f => ({ ...f, estPrepTimeMin: parseInt(e.target.value) }))}
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Quick (5m)</span>
              <span>Long (2h)</span>
            </div>
          </div>
        </section>

        {/* ── Store info ─────────────────────────────────────────────── */}
        <section className="card space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-widest">
            <Store size={14} /> Store Info
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Store Name</label>
              <input
                className="input w-full"
                value={form.storeName}
                onChange={set('storeName')}
                placeholder="My Restaurant"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Store Type</label>
              <select
                className="input w-full"
                title="Store type"
                value={form.storeType}
                onChange={set('storeType')}
              >
                <option value="">— select —</option>
                <option value="restaurant">Restaurant</option>
                <option value="grocery">Grocery</option>
                <option value="fashion">Fashion</option>
                <option value="tools">Tools &amp; Hardware</option>
                <option value="household">Household</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Opens At</label>
              <input
                className="input w-full"
                type="time"
                value={form.businessOpen}
                onChange={set('businessOpen')}
                title="Business opening time"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Closes At</label>
              <input
                className="input w-full"
                type="time"
                value={form.businessClose}
                onChange={set('businessClose')}
                title="Business closing time"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Closed Days</label>
              <input
                className="input w-full"
                value={form.closedDays}
                onChange={set('closedDays')}
                placeholder="Sun, Tue"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                <Clock size={12} /> Delivery Time (min)
              </label>
              <input
                className="input w-full"
                type="number"
                min={0}
                value={form.deliveryTimeMin}
                onChange={set('deliveryTimeMin')}
                placeholder="30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Cuisine / Tags <span className="text-slate-600">(comma-separated)</span>
              </label>
              <input
                className="input w-full"
                value={form.cuisineTags}
                onChange={set('cuisineTags')}
                placeholder="Indian, Biryani, Veg"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
              <Image size={12} /> Store Image URL
            </label>
            <input
              className="input w-full"
              value={form.imageUrl}
              onChange={set('imageUrl')}
              placeholder="https://example.com/store.jpg"
            />
            {form.imageUrl && (
              <img
                src={form.imageUrl}
                alt="Store preview"
                className="mt-2 h-20 w-20 rounded-xl object-cover border border-slate-700"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>
        </section>

        {/* ── Owner / contact ────────────────────────────────────────── */}
        <section className="card space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-widest">
            <User size={14} /> Owner &amp; Contact
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Owner Name</label>
            <input
              className="input w-full"
              value={form.ownerName}
              onChange={set('ownerName')}
              placeholder="Your full name"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
              <input
                className="input w-full opacity-60 cursor-not-allowed"
                value={form.email}
                readOnly
                title="Email cannot be changed"
              />
              <p className="text-[11px] text-slate-600 mt-1">Email is read-only.</p>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                <Phone size={12} /> Phone
              </label>
              <input
                className="input w-full"
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
