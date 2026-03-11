import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../components/Toast';
import ProfilePage from '../pages/ProfilePage';

// ── API mock ──────────────────────────────────────────────────────────────────
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from '../services/api';
const mockGet = api.get as ReturnType<typeof vi.fn>;
const mockPatch = api.patch as ReturnType<typeof vi.fn>;

// ── Sample profile ────────────────────────────────────────────────────────────
const sampleStore = {
  name: 'Green Kitchen',
  store_type: 'restaurant',
  image_url: '',
  delivery_time_min: 30,
  cuisine_tags: ['Indian', 'Chinese'],
  owner_name: 'Ravi Kumar',
  email: 'ravi@greenkitchen.com',
  phone: '9876543210',
};

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <ProfilePage />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: { store: sampleStore } });
    mockPatch.mockResolvedValue({
      data: {
        store: {
          ...sampleStore,
          name: 'Updated Kitchen',
          owner_name: 'Ravi Kumar',
          phone: '9876543210',
          image_url: '',
        },
      },
    });
  });

  // ─── Loading state ────────────────────────────────────────────────────────
  it('shows loading spinner on initial render', () => {
    mockGet.mockImplementation(() => new Promise(() => {}));
    renderPage();
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  // ─── Profile load ─────────────────────────────────────────────────────────
  it('fetches /merchant/profile on mount', async () => {
    renderPage();
    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/merchant/profile'));
  });

  it('populates Store Name field from profile data', async () => {
    renderPage();
    await waitFor(() => {
      const input = screen.getByPlaceholderText('My Restaurant') as HTMLInputElement;
      expect(input.value).toBe('Green Kitchen');
    });
  });

  it('populates delivery time field', async () => {
    renderPage();
    await waitFor(() => {
      const input = screen.getByPlaceholderText('30') as HTMLInputElement;
      expect(input.value).toBe('30');
    });
  });

  it('populates owner name field', async () => {
    renderPage();
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Your full name') as HTMLInputElement;
      expect(input.value).toBe('Ravi Kumar');
    });
  });

  it('populates phone field', async () => {
    renderPage();
    await waitFor(() => {
      const input = screen.getByPlaceholderText('+91 98765 43210') as HTMLInputElement;
      expect(input.value).toBe('9876543210');
    });
  });

  // ─── Error handling ───────────────────────────────────────────────────────
  it('shows error toast when profile load fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('Could not load profile.')).toBeInTheDocument()
    );
  });

  // ─── Save profile ─────────────────────────────────────────────────────────
  it('calls PATCH /merchant/profile on form submit', async () => {
    renderPage();
    await waitFor(() => screen.getByPlaceholderText('My Restaurant'));
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith(
        '/merchant/profile',
        expect.any(Object)
      )
    );
  });

  it('shows success toast after save', async () => {
    renderPage();
    await waitFor(() => screen.getByPlaceholderText('My Restaurant'));
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() =>
      expect(screen.getByText('Profile saved successfully.')).toBeInTheDocument()
    );
  });

  it('shows error toast when save fails', async () => {
    mockPatch.mockRejectedValue(new Error('Save failed'));
    renderPage();
    await waitFor(() => screen.getByPlaceholderText('My Restaurant'));
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() =>
      expect(screen.getByText('Save failed — please try again.')).toBeInTheDocument()
    );
  });

  // ─── Page structure ───────────────────────────────────────────────────────
  it('renders page heading', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('Profile & Settings')).toBeInTheDocument()
    );
  });

  it('renders Store Info section heading', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/store info/i)).toBeInTheDocument()
    );
  });

  // ─── cuisineTags as plain string (not array) ──────────────────────────────
  it('handles cuisine_tags as a plain string (not array)', async () => {
    mockGet.mockResolvedValue({
      data: {
        store: { ...sampleStore, cuisine_tags: 'Indian, Veg' },
      },
    });
    renderPage();
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Indian, Biryani, Veg') as HTMLInputElement;
      expect(input.value).toBe('Indian, Veg');
    });
  });

  it('handles null cuisine_tags gracefully', async () => {
    mockGet.mockResolvedValue({
      data: {
        store: { ...sampleStore, cuisine_tags: null },
      },
    });
    renderPage();
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Indian, Biryani, Veg') as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  // ─── imageUrl preview branch ──────────────────────────────────────────────
  it('shows image preview when imageUrl is non-empty', async () => {
    mockGet.mockResolvedValue({
      data: {
        store: {
          ...sampleStore,
          image_url: 'https://example.com/store.jpg',
        },
      },
    });
    renderPage();
    await waitFor(() => {
      const img = document.querySelector('img[alt="Store preview"]') as HTMLImageElement;
      expect(img).toBeInTheDocument();
      expect(img.src).toContain('example.com/store.jpg');
    });
  });

  // ─── cuisineTags empty on save (undefined path) ───────────────────────────
  it('sends undefined cuisineTags when field is blank on save', async () => {
    mockGet.mockResolvedValue({
      data: {
        store: { ...sampleStore, cuisine_tags: [], image_url: '' },
      },
    });
    renderPage();
    await waitFor(() => screen.getByPlaceholderText('My Restaurant'));

    // Type into the store name input to trigger the set() HOF inner handler
    const storeNameInput = screen.getByPlaceholderText('My Restaurant');
    await userEvent.clear(storeNameInput);
    await userEvent.type(storeNameInput, 'New Name');

    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith(
        '/merchant/profile',
        expect.objectContaining({ cuisineTags: undefined })
      )
    );
  });

  // ─── delivery_time_min null fallback ──────────────────────────────────────
  it('shows empty delivery time when delivery_time_min is null', async () => {
    mockGet.mockResolvedValue({
      data: {
        store: { ...sampleStore, delivery_time_min: null },
      },
    });
    renderPage();
    await waitFor(() => {
      const input = screen.getByPlaceholderText('30') as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  // ─── store_type null → fallback to s.type ────────────────────────────────
  it('falls back to s.type when store_type is null', async () => {
    mockGet.mockResolvedValue({
      data: {
        store: { ...sampleStore, store_type: null, type: 'cafe' },
      },
    });
    renderPage();
    await waitFor(() => {
      const select = screen.getByTitle('Store type') as HTMLSelectElement;
      expect(select.value).toBe('cafe');
    });
  });

  // ─── Save with empty deliveryTimeMin → undefined ──────────────────────────
  it('sends undefined deliveryTimeMin when field is empty on save', async () => {
    mockGet.mockResolvedValue({
      data: {
        store: { ...sampleStore, delivery_time_min: null },
      },
    });
    renderPage();
    await waitFor(() => screen.getByPlaceholderText('My Restaurant'));
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith(
        '/merchant/profile',
        expect.objectContaining({ deliveryTimeMin: undefined })
      )
    );
  });

  // ─── Save with empty ownerName/phone → undefined ──────────────────────────
  it('sends undefined ownerName and phone when fields are empty on save', async () => {
    mockGet.mockResolvedValue({
      data: {
        store: { ...sampleStore, owner_name: '', phone: '' },
      },
    });
    renderPage();
    await waitFor(() => screen.getByPlaceholderText('My Restaurant'));
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith(
        '/merchant/profile',
        expect.objectContaining({ ownerName: undefined, phone: undefined })
      )
    );
  });

  // ─── PATCH returns null fields → falls back to existing form values ────────
  it('keeps existing form values when PATCH returns null fields', async () => {
    mockPatch.mockResolvedValue({
      data: {
        store: { name: null, owner_name: null, phone: null, image_url: null },
      },
    });
    renderPage();
    await waitFor(() => screen.getByPlaceholderText('My Restaurant'));
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() =>
      expect(screen.getByText('Profile saved successfully.')).toBeInTheDocument()
    );
    // Form should retain the original values (not set to null)
    const storeNameInput = screen.getByPlaceholderText('My Restaurant') as HTMLInputElement;
    expect(storeNameInput.value).toBe('Green Kitchen');
  });

  // ─── Null/undefined fields on initial load → empty string fallbacks ────────
  it('handles all null/undefined fields gracefully on load', async () => {
    mockGet.mockResolvedValue({
      data: {
        store: {
          name: null,
          store_type: null,
          type: null,
          image_url: null,
          delivery_time_min: null,
          cuisine_tags: null,
          owner_name: null,
          email: null,
          phone: null,
        },
      },
    });
    renderPage();
    await waitFor(() => {
      const storeNameInput = screen.getByPlaceholderText('My Restaurant') as HTMLInputElement;
      expect(storeNameInput.value).toBe('');
      const ownerInput = screen.getByPlaceholderText('Your full name') as HTMLInputElement;
      expect(ownerInput.value).toBe('');
    });
  });

  // ─── Save with empty storeName/storeType → undefined branches ─────────────
  it('sends undefined storeName and storeType when fields are empty', async () => {
    mockGet.mockResolvedValue({
      data: {
        store: {
          ...sampleStore,
          name: '',
          store_type: '',
        },
      },
    });
    renderPage();
    await waitFor(() => screen.getByPlaceholderText('My Restaurant'));
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith(
        '/merchant/profile',
        expect.objectContaining({ storeName: undefined, storeType: undefined })
      )
    );
  });
});
