import { useState, useEffect } from 'react';
import { User, Store, Clock, Image, Phone, Save, RefreshCw } from 'lucide-react';
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
      };
      const { data } = await api.patch('/merchant/profile', payload);
      const s = data.store;
      setForm((f) => ({
        ...f,
        storeName:  s.name ?? f.storeName,
        ownerName:  s.owner_name ?? f.ownerName,
        phone:      s.phone ?? f.phone,
        imageUrl:   s.image_url ?? f.imageUrl,
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
                <option value="bakery">Bakery</option>
                <option value="cafe">Café</option>
                <option value="pharmacy">Pharmacy</option>
              </select>
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
