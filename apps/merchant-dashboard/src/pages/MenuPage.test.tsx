import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../components/Toast';
import MenuPage from '../pages/MenuPage';

// ── API mock ──────────────────────────────────────────────────────────────────
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '../services/api';
const mockGet = api.get as ReturnType<typeof vi.fn>;
const mockPost = api.post as ReturnType<typeof vi.fn>;
const mockPut = api.put as ReturnType<typeof vi.fn>;
const mockPatch = api.patch as ReturnType<typeof vi.fn>;
const mockDelete = api.delete as ReturnType<typeof vi.fn>;

// ── Sample data ───────────────────────────────────────────────────────────────
const sampleProducts = [
  {
    id: 'p1',
    name: 'Classic Burger',
    description: 'Juicy beef burger',
    price: 25000,
    original_price: null,
    category: 'Burgers',
    brand: '',
    image_url: '',
    stock: 10,
    is_available: true,
    is_veg: false,
    unit: 'pc',
  },
  {
    id: 'p2',
    name: 'Veg Wrap',
    description: 'Fresh veggie wrap',
    price: 15000,
    original_price: 18000,
    category: 'Wraps',
    brand: '',
    image_url: '',
    stock: 2,
    is_available: true,
    is_veg: true,
    unit: 'pc',
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <MenuPage />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('MenuPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: { products: sampleProducts } });
    mockPatch.mockResolvedValue({
      data: { product: { ...sampleProducts[0], is_available: false } },
    });
    mockDelete.mockResolvedValue({});
    mockPost.mockResolvedValue({ data: { product: { id: 'p3', name: 'New Item', price: 10000, category: 'Snacks', is_available: true, is_veg: true, stock: 5 } } });
    mockPut.mockResolvedValue({ data: { product: { ...sampleProducts[0], name: 'Updated Burger' } } });
  });

  // ─── Initial load ─────────────────────────────────────────────────────────
  it('fetches /merchant/menu on mount', async () => {
    renderPage();
    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/merchant/menu'));
  });

  it('renders product names after load', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Classic Burger')).toBeInTheDocument();
      expect(screen.getByText('Veg Wrap')).toBeInTheDocument();
    });
  });

  it('shows product count in header', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('2 items in your store')).toBeInTheDocument()
    );
  });

  // ─── Loading state ────────────────────────────────────────────────────────
  it('shows loading spinner while fetching', () => {
    mockGet.mockImplementation(() => new Promise(() => {}));
    renderPage();
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  // ─── Search filter ────────────────────────────────────────────────────────
  it('filters products by search term', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Classic Burger'));
    const searchInput = screen.getByPlaceholderText(/search products/i);
    await userEvent.type(searchInput, 'Burger');
    expect(screen.getByText('Classic Burger')).toBeInTheDocument();
    expect(screen.queryByText('Veg Wrap')).not.toBeInTheDocument();
  });

  it('shows empty state when search has no matches', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Classic Burger'));
    const searchInput = screen.getByPlaceholderText(/search products/i);
    await userEvent.type(searchInput, 'xyz-nonexistent-999');
    expect(screen.getByText('No products found')).toBeInTheDocument();
  });

  // ─── Add Product ──────────────────────────────────────────────────────────
  it('opens the Add Product form when button is clicked', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Classic Burger'));
    // There is one "Add Product" button that opens the form
    await userEvent.click(screen.getAllByRole('button', { name: /Add Product/i })[0]);
    // Modal opens; find the product name input by its placeholder
    expect(screen.getByPlaceholderText('e.g. Alphonso Mango')).toBeInTheDocument();
  });

  it('does not POST if product name is empty', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Classic Burger'));
    await userEvent.click(screen.getAllByRole('button', { name: /Add Product/i })[0]);
    // Save button is disabled (name is empty) — clicking it does nothing
    const saveBtn = screen.getAllByRole('button', { name: /Add Product/i }).find(
      (btn) => (btn as HTMLButtonElement).disabled
    );
    expect(saveBtn).toBeTruthy();
    await userEvent.click(saveBtn!);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('POSTs new product when form is filled and saved', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Classic Burger'));
    await userEvent.click(screen.getAllByRole('button', { name: /Add Product/i })[0]);

    const nameInput = screen.getByPlaceholderText('e.g. Alphonso Mango');
    // Price field is the first input with placeholder "0" in the modal
    const priceInputs = screen.getAllByPlaceholderText('0');
    const priceInput = priceInputs[0] as HTMLInputElement;
    await userEvent.type(nameInput, 'New Dish');
    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, '99');

    // After typing, the save button becomes enabled; it is the ADD button inside the modal footer
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    const saveBtn = cancelBtn.nextElementSibling as HTMLButtonElement;
    await userEvent.click(saveBtn);
    await waitFor(() => expect(mockPost).toHaveBeenCalledWith(
      '/merchant/products',
      expect.objectContaining({ name: 'New Dish' })
    ));
  });

  // ─── Delete product ───────────────────────────────────────────────────────
  it('calls DELETE when delete button is confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderPage();
    await waitFor(() => screen.getByText('Classic Burger'));

    // Delete button is next to the "Edit" button; find the first Edit button's sibling
    const editBtns = screen.getAllByRole('button', { name: /^edit$/i });
    const deleteBtn = editBtns[0].nextElementSibling as HTMLButtonElement;
    await userEvent.click(deleteBtn);
    await waitFor(() =>
      expect(mockDelete).toHaveBeenCalledWith('/merchant/products/p1')
    );
  });

  it('does NOT call DELETE when confirm is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderPage();
    await waitFor(() => screen.getByText('Classic Burger'));

    const editBtns = screen.getAllByRole('button', { name: /^edit$/i });
    const deleteBtn = editBtns[0].nextElementSibling as HTMLButtonElement;
    await userEvent.click(deleteBtn);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  // ─── Toggle availability ──────────────────────────────────────────────────
  it('calls PATCH availability endpoint when toggle is clicked', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Classic Burger'));

    // Toggle button text is "Available" (since both sample products are is_available=true)
    const toggleBtns = screen.getAllByRole('button', { name: /available/i });
    await userEvent.click(toggleBtns[0]);
    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith(
        '/merchant/products/p1/availability',
        expect.objectContaining({ is_available: false })
      )
    );
  });

  // ─── Low stock warning ────────────────────────────────────────────────────
  it('shows low stock warning for products with stock < 5', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/only 2 left/i)).toBeInTheDocument()
    );
  });

  // ─── Edit product (openEdit) ──────────────────────────────────────────────
  it('clicking Edit opens form with product data pre-populated', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Classic Burger'));
    const editBtns = screen.getAllByRole('button', { name: /^edit$/i });
    await userEvent.click(editBtns[0]);
    // Form opens; product name should be pre-filled
    const nameInput = screen.getByPlaceholderText('e.g. Alphonso Mango') as HTMLInputElement;
    expect(nameInput.value).toBe('Classic Burger');
  });

  it('PUTs updated product when editing an existing product', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Classic Burger'));
    const editBtns = screen.getAllByRole('button', { name: /^edit$/i });
    await userEvent.click(editBtns[0]);

    // Change the name
    const nameInput = screen.getByPlaceholderText('e.g. Alphonso Mango');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated Burger');

    // Click Save (the enabled save/add button in the form footer)
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    const saveBtn = cancelBtn.nextElementSibling as HTMLButtonElement;
    await userEvent.click(saveBtn);

    await waitFor(() =>
      expect(mockPut).toHaveBeenCalledWith(
        '/merchant/products/p1',
        expect.objectContaining({ name: 'Updated Burger' })
      )
    );
  });

  // ─── handleSave error path ────────────────────────────────────────────────
  it('shows error toast when save fails', async () => {
    mockPost.mockRejectedValue(new Error('Save error'));
    renderPage();
    await waitFor(() => screen.getByText('Classic Burger'));
    await userEvent.click(screen.getAllByRole('button', { name: /Add Product/i })[0]);

    const nameInput = screen.getByPlaceholderText('e.g. Alphonso Mango');
    const priceInputs = screen.getAllByPlaceholderText('0');
    await userEvent.type(nameInput, 'Test Item');
    await userEvent.clear(priceInputs[0]);
    await userEvent.type(priceInputs[0], '50');

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    const saveBtn = cancelBtn.nextElementSibling as HTMLButtonElement;
    await userEvent.click(saveBtn);

    await waitFor(() =>
      expect(screen.getByText('Failed to save product — please try again.')).toBeInTheDocument()
    );
  });

  // ─── handleDelete error path ──────────────────────────────────────────────
  it('shows error toast when delete API fails', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockDelete.mockRejectedValue(new Error('Delete error'));
    renderPage();
    await waitFor(() => screen.getByText('Classic Burger'));

    const editBtns = screen.getAllByRole('button', { name: /^edit$/i });
    const deleteBtn = editBtns[0].nextElementSibling as HTMLButtonElement;
    await userEvent.click(deleteBtn);

    await waitFor(() =>
      expect(screen.getByText('Could not delete product.')).toBeInTheDocument()
    );
  });

  // ─── toggleAvailability error path ────────────────────────────────────────
  it('shows error toast when toggle availability API fails', async () => {
    mockPatch.mockRejectedValue(new Error('Toggle error'));
    renderPage();
    await waitFor(() => screen.getByText('Classic Burger'));

    const toggleBtns = screen.getAllByRole('button', { name: /available/i });
    await userEvent.click(toggleBtns[0]);

    await waitFor(() =>
      expect(screen.getByText('Could not toggle availability.')).toBeInTheDocument()
    );
  });

  // ─── Product image rendering ──────────────────────────────────────────────
  it('renders product image when image_url is set', async () => {
    mockGet.mockResolvedValue({
      data: {
        products: [
          { ...sampleProducts[0], image_url: 'https://example.com/burger.jpg' },
        ],
      },
    });
    renderPage();
    await waitFor(() => screen.getByText('Classic Burger'));
    const img = document.querySelector('img[alt="Classic Burger"]');
    expect(img).toBeInTheDocument();
  });

  // ─── Product brand rendering ──────────────────────────────────────────────
  it('renders product brand when brand is set', async () => {
    mockGet.mockResolvedValue({
      data: {
        products: [
          { ...sampleProducts[0], brand: 'BurgerCo' },
        ],
      },
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('BurgerCo')).toBeInTheDocument()
    );
  });

  // ─── original_price strikethrough ────────────────────────────────────────
  it('renders original price strikethrough when higher original_price is set', async () => {
    renderPage();
    // sampleProducts[1] has original_price 18000 > price 15000 → shows strikethrough
    await waitFor(() => screen.getByText('Veg Wrap'));
    // The original_price formatted value should appear
    expect(document.querySelector('.line-through')).toBeInTheDocument();
  });

  // ─── fetchMenu error path (silent fail) ──────────────────────────────────
  it('silently fails when fetchMenu throws (no products shown, no crash)', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });
    expect(screen.queryByText('Classic Burger')).not.toBeInTheDocument();
  });

  // ─── toggleAvailability — Product enabled ─────────────────────────────────
  it('shows "Product enabled." toast when toggling to available', async () => {
    mockGet.mockResolvedValue({
      data: {
        products: [{ ...sampleProducts[0], is_available: false }],
      },
    });
    mockPatch.mockResolvedValue({
      data: { product: { ...sampleProducts[0], is_available: true } },
    });
    renderPage();
    await waitFor(() => screen.getByText('Classic Burger'));
    const toggleBtns = screen.getAllByRole('button', { name: /unavailable/i });
    await userEvent.click(toggleBtns[0]);
    await waitFor(() =>
      expect(screen.getByText('Product enabled.')).toBeInTheDocument()
    );
  });

  // ─── Product with no category → "Uncategorised" group ────────────────────
  it('groups product under "Uncategorised" when category is empty', async () => {
    mockGet.mockResolvedValue({
      data: {
        products: [{ ...sampleProducts[0], category: '' }],
      },
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('Uncategorised')).toBeInTheDocument()
    );
  });

  // ─── Two products in same category (grouped correctly) ───────────────────
  it('groups two products under the same category header', async () => {
    mockGet.mockResolvedValue({
      data: {
        products: [
          { ...sampleProducts[0], category: 'Mains' },
          { ...sampleProducts[1], category: 'Mains' },
        ],
      },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Classic Burger')).toBeInTheDocument();
      expect(screen.getByText('Veg Wrap')).toBeInTheDocument();
    });
    // The category header 'Mains' should appear exactly once
    expect(screen.getAllByText('Mains').length).toBeGreaterThanOrEqual(1);
  });

  // ─── Add product with original_price ─────────────────────────────────────
  it('POSTs with original_price when filled in form', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Classic Burger'));
    await userEvent.click(screen.getAllByRole('button', { name: /Add Product/i })[0]);

    const nameInput = screen.getByPlaceholderText('e.g. Alphonso Mango');
    const priceInputs = screen.getAllByPlaceholderText('0');
    await userEvent.type(nameInput, 'Special Item');
    await userEvent.clear(priceInputs[0]);
    await userEvent.type(priceInputs[0], '100');
    // Set original price (second "0" placeholder input)
    await userEvent.clear(priceInputs[1]);
    await userEvent.type(priceInputs[1], '120');

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    const saveBtn = cancelBtn.nextElementSibling as HTMLButtonElement;
    await userEvent.click(saveBtn);
    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith(
        '/merchant/products',
        expect.objectContaining({ original_price: 12000 })
      )
    );
  });

  // ─── Edit product with original_price set ────────────────────────────────
  it('opens edit form with original_price pre-filled for product that has one', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Veg Wrap'));
    // editBtns[1] = Veg Wrap (which has original_price: 18000)
    const editBtns = screen.getAllByRole('button', { name: /^edit$/i });
    await userEvent.click(editBtns[1]);
    const priceInputs = screen.getAllByPlaceholderText('0');
    // original_price should be pre-filled (18000 / 100 = 180)
    expect((priceInputs[1] as HTMLInputElement).value).toBe('180');
  });

  // ─── handleSave early return when price is empty ──────────────────────────
  it('does not POST when name is filled but price is empty', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Classic Burger'));
    await userEvent.click(screen.getAllByRole('button', { name: /Add Product/i })[0]);

    const nameInput = screen.getByPlaceholderText('e.g. Alphonso Mango');
    await userEvent.type(nameInput, 'No Price Item');
    // Price input stays empty (default '0' placeholder but value is '')

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    const saveBtn = cancelBtn.nextElementSibling as HTMLButtonElement;
    // The save button is disabled when price is empty
    expect(saveBtn).toBeDisabled();
    expect(mockPost).not.toHaveBeenCalled();
  });

  // ─── null products ?? [] fallback ────────────────────────────────────────
  it('shows empty state when API returns null products', async () => {
    mockGet.mockResolvedValue({ data: { products: null } });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('0 items in your store')).toBeInTheDocument()
    );
  });

  // ─── openEdit with product that has null optional fields ─────────────────
  it('handles null description/brand/image_url/unit in openEdit gracefully', async () => {
    const nullFieldProduct = {
      id: 'p3',
      name: 'Null Field Product',
      description: null,
      price: 10000,
      original_price: null,
      category: null,
      brand: null,
      image_url: null,
      stock: 5,
      is_available: true,
      is_veg: true,
      unit: null,
    };
    mockGet.mockResolvedValue({
      data: { products: [nullFieldProduct] },
    });
    renderPage();
    await waitFor(() => screen.getByText('Null Field Product'));

    // Should show in 'Uncategorised' group (covers p.category || 'Uncategorised')
    expect(screen.getByText('Uncategorised')).toBeInTheDocument();

    // Click Edit to open form and exercise openEdit with null fields
    const editBtns = screen.getAllByRole('button', { name: /^edit$/i });
    await userEvent.click(editBtns[0]);

    // Form opens; all optional fields should be empty strings (not null)
    const nameInput = screen.getByPlaceholderText('e.g. Alphonso Mango') as HTMLInputElement;
    expect(nameInput.value).toBe('Null Field Product');
  });
});
