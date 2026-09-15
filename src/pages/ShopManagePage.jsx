import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';
import { formatUZS } from '../utils/formatters';
import { getImageUrl } from '../utils/imageUrl';

export default function ShopManagePage() {
  const { showToast } = useAdminAuth();

  // Internal sidebar tab: 'orders' | 'products' | 'settings' | 'stats'
  const [internalTab, setInternalTab] = useState('orders');

  // ===================== ORDERS STATE =====================
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null); // modal view
  const [actionModal, setActionModal] = useState(null); // 'approve' | 'reject' | 'deliver' | null
  const [deliveryDataInput, setDeliveryDataInput] = useState('');
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [previewReceiptZoom, setPreviewReceiptZoom] = useState(false);

  // ===================== PRODUCTS STATE =====================
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productModal, setProductModal] = useState(null); // null | 'create' | product object for edit
  const [productForm, setProductForm] = useState({
    title: '',
    category: 'Trading Materiallari',
    product_type: 'digital',
    available_sizes: '',
    available_colors: '',
    short_description: '',
    description: '',
    price: '',
    original_price: '',
    stock: 100,
    is_active: true
  });
  const [productSaving, setProductSaving] = useState(false);

  // Gallery Manager Modal
  const [galleryProduct, setGalleryProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // ===================== SETTINGS STATE =====================
  const [settingsForm, setSettingsForm] = useState({
    card_number: '',
    card_holder: '',
    bank_name: '',
    instructions: '',
    is_active: true
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // ===================== STATS STATE =====================
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // ===================== FETCH FUNCTIONS =====================
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const q = new URLSearchParams();
      if (orderStatusFilter && orderStatusFilter !== 'all') {
        q.append('status', orderStatusFilter);
      }
      if (orderSearch) {
        q.append('search', orderSearch);
      }
      const res = await api.get(`/shop/admin/orders/?${q.toString()}`);
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
      showToast?.("Buyurtmalarni yuklashda xatolik", "error");
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get('/shop/admin/products/');
      setProducts(res.data || []);
    } catch (err) {
      console.error(err);
      showToast?.("Mahsulotlarni yuklashda xatolik", "error");
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await api.get('/shop/admin/settings/');
      setSettingsForm(res.data || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/shop/admin/stats/');
      setStats(res.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Initial load for KPI metrics
  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchStats();
  }, []);

  useEffect(() => {
    if (internalTab === 'orders') fetchOrders();
    else if (internalTab === 'products') fetchProducts();
    else if (internalTab === 'settings') fetchSettings();
    else if (internalTab === 'stats') fetchStats();
  }, [internalTab, orderStatusFilter]);

  // Handle Order Status Update (Approve / Deliver / Reject)
  const handleOrderStatusSubmit = async () => {
    if (!selectedOrder || !actionModal) return;
    setActionLoading(true);

    try {
      await api.post(`/shop/admin/orders/${selectedOrder.id}/status/`, {
        action: actionModal,
        delivery_data: deliveryDataInput,
        admin_note: adminNoteInput
      });

      showToast?.(
        actionModal === 'approve'
          ? "Buyurtma tasdiqlandi va Telegram orqali xabar yuborildi! ✅"
          : actionModal === 'deliver'
          ? "Buyurtma yetkazildi holatiga o'tkazildi! 🚚"
          : "Buyurtma rad etildi va mijozga sababi yuborildi. ❌",
        actionModal === 'reject' ? "info" : "success"
      );

      setActionModal(null);
      setSelectedOrder(null);
      setDeliveryDataInput('');
      setAdminNoteInput('');
      fetchOrders();
    } catch (err) {
      console.error(err);
      showToast?.(err.response?.data?.error || "Xatolik yuz berdi", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Product Save
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setProductSaving(true);
    try {
      if (productModal === 'create') {
        await api.post('/shop/admin/products/', productForm);
        showToast?.("Yangi mahsulot muvaffaqiyatli qo'shildi! 📦", "success");
      } else {
        await api.put(`/shop/admin/products/${productModal.id}/`, productForm);
        showToast?.("Mahsulot ma'lumotlari yangilandi! ✏️", "success");
      }
      setProductModal(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      showToast?.("Mahsulotni saqlashda xatolik yuz berdi", "error");
    } finally {
      setProductSaving(false);
    }
  };

  // Handle Product Delete
  const handleDeleteProduct = async (prodId) => {
    if (!window.confirm("Haqiqatan ham ushbu mahsulotni o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/shop/admin/products/${prodId}/`);
      showToast?.("Mahsulot o'chirildi", "info");
      fetchProducts();
    } catch (err) {
      console.error(err);
      showToast?.("O'chirishda xatolik", "error");
    }
  };

  // Upload image to product gallery
  const handleUploadGalleryImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !galleryProduct) return;
    setUploadingImage(true);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('is_primary', 'false');

    try {
      await api.post(`/shop/admin/products/${galleryProduct.id}/images/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast?.("Rasm galereyaga muvaffaqiyatli yuklandi! 🖼️", "success");
      // Refresh gallery product
      const res = await api.get(`/shop/admin/products/${galleryProduct.id}/`);
      setGalleryProduct(res.data);
      fetchProducts();
    } catch (err) {
      console.error(err);
      showToast?.("Rasm yuklashda xatolik", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  // Delete image from gallery
  const handleDeleteGalleryImage = async (imgId) => {
    if (!window.confirm("Ushbu rasmni o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/shop/admin/images/${imgId}/`);
      showToast?.("Rasm o'chirildi", "info");
      const res = await api.get(`/shop/admin/products/${galleryProduct.id}/`);
      setGalleryProduct(res.data);
      fetchProducts();
    } catch (err) {
      console.error(err);
      showToast?.("Xatolik", "error");
    }
  };

  // Set primary image
  const handleSetPrimaryImage = async (imgId) => {
    try {
      await api.post(`/shop/admin/images/${imgId}/`);
      showToast?.("Asosiy rasm qilib belgilandi! ⭐", "success");
      const res = await api.get(`/shop/admin/products/${galleryProduct.id}/`);
      setGalleryProduct(res.data);
      fetchProducts();
    } catch (err) {
      console.error(err);
      showToast?.("Xatolik", "error");
    }
  };

  // Save payment settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.post('/shop/admin/settings/', settingsForm);
      showToast?.("To'lov rekvizitlari muvaffaqiyatli saqlandi! 💳", "success");
    } catch (err) {
      console.error(err);
      showToast?.("Sozlamalarni saqlashda xatolik", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  // Count pending orders for badge
  const handleOpenCreateProduct = () => {
    setProductForm({
      title: '',
      category: 'Trading Materiallari',
      product_type: 'digital',
      available_sizes: '',
      available_colors: '',
      short_description: '',
      description: '',
      price: '',
      original_price: '',
      stock: 100,
      is_active: true
    });
    setProductModal('create');
  };

  // Count pending orders for badge
  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="p-8 flex flex-col gap-6 max-w-7xl mx-auto animate-fade-in w-full min-h-screen">
      {/* ==================================================================== */}
      {/* PAGE HEADER */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-container to-[#be0034] flex items-center justify-center text-white shadow-neon-red">
            <span className="material-symbols-outlined text-[26px]">storefront</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="font-headline font-bold text-xl text-white">
                Do'kon &amp; Buyurtmalar Boshqaruvi
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-primary-container/20 border border-primary-container/30 text-primary-fixed-dim font-mono text-[10px] font-bold uppercase">
                Shop v2.4
              </span>
            </div>
            <span className="text-xs text-on-surface-variant">
              Mijozlar to'lov cheklarini tekshirish, mahsulotlar katalogi, to'lov rekvizitlari va sotuvlar tahlili
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCreateProduct}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-container to-[#be0034] hover:brightness-110 text-white font-headline font-bold text-xs uppercase tracking-wider shadow-neon-red transition-all flex items-center gap-2 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Yangi Mahsulot</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* KPI STATS STRIP */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Jami Buyurtmalar */}
        <div className="glass-card rounded-2xl p-4 flex flex-col gap-1 border border-white/5 bg-surface-container-low shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-on-surface-variant font-semibold">Jami Buyurtmalar</span>
            <div className="w-8 h-8 rounded-lg bg-white/5 text-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            </div>
          </div>
          <span className="font-headline font-extrabold text-2xl text-white">{orders.length} ta</span>
          <span className="text-[10px] text-on-surface-variant font-mono">Barcha vaqt bo'yicha</span>
        </div>

        {/* Kutilayotgan Cheklar */}
        <div className={`glass-card rounded-2xl p-4 flex flex-col gap-1 border shadow-md transition-all ${
          pendingCount > 0
            ? 'border-amber-500/40 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
            : 'border-white/5 bg-surface-container-low'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-amber-400 font-semibold flex items-center gap-1.5">
              {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>}
              Kutilayotgan Cheklar
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">pending_actions</span>
            </div>
          </div>
          <span className="font-headline font-extrabold text-2xl text-amber-300">{pendingCount} ta</span>
          <span className="text-[10px] text-amber-400/80 font-mono">Admin tasdig'i kutmoqda</span>
        </div>

        {/* Savdo Tushumi */}
        <div className="glass-card rounded-2xl p-4 flex flex-col gap-1 border border-emerald-500/30 bg-emerald-500/5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-emerald-400 font-semibold">Savdo Tushumi</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </div>
          </div>
          <span className="font-headline font-extrabold text-2xl text-emerald-300 font-mono">
            {formatUZS(stats?.financial?.total_revenue || 0)} UZS
          </span>
          <span className="text-[10px] text-emerald-400/80 font-mono">Tasdiqlangan to'lovlar</span>
        </div>

        {/* Katalogdagi Mahsulotlar */}
        <div className="glass-card rounded-2xl p-4 flex flex-col gap-1 border border-white/5 bg-surface-container-low shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-on-surface-variant font-semibold">Katalogdagi Mahsulotlar</span>
            <div className="w-8 h-8 rounded-lg bg-white/5 text-cyan-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            </div>
          </div>
          <span className="font-headline font-extrabold text-2xl text-cyan-300">{products.length} ta</span>
          <span className="text-[10px] text-on-surface-variant font-mono">Sotuvda faol</span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* NAVIGATION TABS BAR */}
      {/* ==================================================================== */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setInternalTab('orders')}
          className={`px-4 py-2.5 rounded-xl font-headline text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
            internalTab === 'orders'
              ? 'bg-primary-container text-white shadow-neon-red'
              : 'text-on-surface-variant hover:text-white bg-surface-container-low border border-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          <span>Buyurtmalar ({orders.length})</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-white text-primary-container font-mono text-[10px] font-extrabold">
              {pendingCount} yangi
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setInternalTab('products')}
          className={`px-4 py-2.5 rounded-xl font-headline text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
            internalTab === 'products'
              ? 'bg-primary-container text-white shadow-neon-red'
              : 'text-on-surface-variant hover:text-white bg-surface-container-low border border-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">inventory_2</span>
          <span>Mahsulotlar Katalogi ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setInternalTab('settings')}
          className={`px-4 py-2.5 rounded-xl font-headline text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
            internalTab === 'settings'
              ? 'bg-primary-container text-white shadow-neon-red'
              : 'text-on-surface-variant hover:text-white bg-surface-container-low border border-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">credit_card</span>
          <span>To'lov Rekvizitlari</span>
        </button>

        <button
          type="button"
          onClick={() => setInternalTab('stats')}
          className={`px-4 py-2.5 rounded-xl font-headline text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
            internalTab === 'stats'
              ? 'bg-primary-container text-white shadow-neon-red'
              : 'text-on-surface-variant hover:text-white bg-surface-container-low border border-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">bar_chart</span>
          <span>Savdo Statistikasi</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ==================================================================== */}
      <div className="flex flex-col gap-6 w-full">
        {/* ========================================== */}
        {/* TAB 1: BUYURTMALAR (ORDERS) */}
        {/* ========================================== */}
        {internalTab === 'orders' && (
          <div className="flex flex-col gap-5">
            {/* Header & Filter Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-headline font-bold text-base text-white flex items-center gap-2">
                  <span>Buyurtmalar Ro'yxati</span>
                  <span className="text-xs font-mono font-normal text-on-surface-variant">({orders.length} ta)</span>
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Xaridorlarning to'lov cheklarini tekshirish, tasdiqlash va materiallarni yetkazish
                </p>
              </div>

              {/* Search input */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
                    placeholder="Qidiruv: Kod, mijoz, mahsulot..."
                    className="pl-9 pr-3 py-2 rounded-xl bg-surface-container-high border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-container w-64"
                  />
                </div>

                <button
                  type="button"
                  onClick={fetchOrders}
                  className="p-2 rounded-xl bg-surface-container-high border border-white/10 hover:bg-surface-container text-white transition-colors"
                  title="Yangilash"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                </button>
              </div>
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'Barchasi' },
                { id: 'pending', label: 'Kutilmoqda (Yangi)', color: 'text-amber-400' },
                { id: 'approved', label: 'Tasdiqlangan', color: 'text-emerald-400' },
                { id: 'delivered', label: 'Yetkazilgan', color: 'text-cyan-400' },
                { id: 'rejected', label: 'Rad etilgan', color: 'text-rose-400' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setOrderStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    orderStatusFilter === st.id
                      ? 'bg-primary-container text-white shadow-neon-red font-bold'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-white'
                  }`}
                >
                  <span className={st.color || ''}>{st.label}</span>
                </button>
              ))}
            </div>

            {/* Orders Table */}
            {loadingOrders ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-on-surface-variant font-mono">Buyurtmalar yuklanmoqda...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-surface-container-lowest border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[40px] text-slate-600">receipt_long</span>
                <span className="text-sm font-semibold text-white">Buyurtmalar topilmadi</span>
                <span className="text-xs text-on-surface-variant">Ushbu holatda hech qanday buyurtma mavjud emas.</span>
              </div>
            ) : (
              <div className="bg-surface-container-lowest border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-surface-container-low text-[11px] font-mono uppercase text-on-surface-variant border-b border-white/5">
                    <tr>
                      <th className="px-4 py-3">Buyurtma</th>
                      <th className="px-4 py-3">Mijoz</th>
                      <th className="px-4 py-3">Mahsulot</th>
                      <th className="px-4 py-3">To'lov &amp; Chek</th>
                      <th className="px-4 py-3">Sana</th>
                      <th className="px-4 py-3">Holati</th>
                      <th className="px-4 py-3 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-white/[0.02] transition-colors">
                        {/* Order Number */}
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-white">
                            #{ord.order_number}
                          </span>
                        </td>

                        {/* Customer Info */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">
                              {ord.user_details?.full_name || 'Noma\'lum'}
                            </span>
                            <span className="font-mono text-[10px] text-on-surface-variant">
                              {ord.contact_info || (ord.user_details?.username ? `@${ord.user_details.username}` : `ID: ${ord.user}`)}
                            </span>
                          </div>
                        </td>

                        {/* Product */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col max-w-[200px]">
                            <span className="font-semibold text-white truncate">
                              {ord.product_title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {ord.quantity} dona {ord.selected_size ? `| O'lcham: ${ord.selected_size}` : ''}
                            </span>
                          </div>
                        </td>

                        {/* Total Amount & Receipt thumbnail */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {ord.receipt_url ? (
                              <img
                                src={getImageUrl(ord.receipt_url || ord.payment_receipt)}
                                alt="Chek"
                                onClick={() => {
                                  setSelectedOrder(ord);
                                  setPreviewReceiptZoom(true);
                                }}
                                className="w-9 h-9 rounded-lg object-cover border border-white/15 cursor-pointer hover:scale-110 transition-transform shadow"
                                title="Chekni kattalashtirish"
                              />
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">Chek yo'q</span>
                            )}
                            <div className="flex flex-col">
                              <span className="font-headline font-bold text-primary-fixed-dim">
                                {formatUZS(ord.total_amount)} UZS
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {formatUZS(ord.unit_price)} × {ord.quantity}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 font-mono text-[11px] text-on-surface-variant">
                          {new Date(ord.created_at).toLocaleDateString()}
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-3">
                          {ord.status === 'approved' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Tasdiqlangan
                            </span>
                          ) : ord.status === 'delivered' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                              Yetkazilgan
                            </span>
                          ) : ord.status === 'rejected' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              Rad etilgan
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Kutilmoqda
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrder(ord);
                              setDeliveryDataInput(ord.delivery_data || '');
                              setAdminNoteInput(ord.admin_note || '');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-primary-container text-white text-xs font-semibold transition-all shadow"
                          >
                            Ko'rish &amp; Tekshirish
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: MAHSULOTLAR (PRODUCTS) */}
        {/* ========================================== */}
        {internalTab === 'products' && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline font-bold text-lg text-white">
                  Mahsulotlar Katalogi
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Trading materiallari, video kurslar, indikatorlar va rasmiy kiyimlarni boshqarish
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setProductForm({
                    title: '',
                    category: 'Trading Materiallari',
                    product_type: 'digital',
                    available_sizes: '',
                    available_colors: '',
                    short_description: '',
                    description: '',
                    price: '',
                    original_price: '',
                    stock: 100,
                    is_active: true
                  });
                  setProductModal('create');
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-container to-[#be0034] text-white text-xs font-bold uppercase tracking-wider shadow-neon-red transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Yangi Mahsulot Qo'shish</span>
              </button>
            </div>

            {loadingProducts ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-on-surface-variant font-mono">Mahsulotlar yuklanmoqda...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-surface-container-lowest border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
                <span className="material-symbols-outlined text-[40px] text-slate-600">inventory_2</span>
                <span className="text-sm font-semibold text-white">Mahsulotlar mavjud emas</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => {
                  const firstImg = p.images?.[0]?.image || '';
                  const isPhysical = p.product_type === 'physical';

                  return (
                    <div
                      key={p.id}
                      className="bg-surface-container-lowest border border-white/5 hover:border-white/15 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-lg"
                    >
                      <div className="flex items-start gap-3">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-xl bg-surface-container-high overflow-hidden shrink-0 border border-white/10 flex items-center justify-center">
                          {firstImg ? (
                            <img src={getImageUrl(firstImg)} alt={p.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-[24px] text-slate-600">image</span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-white/5 text-slate-300">
                              {p.category}
                            </span>
                            {isPhysical ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-950 text-cyan-400">
                                Kiyim
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-950 text-purple-400">
                                Raqamli
                              </span>
                            )}
                          </div>
                          <h4 className="font-headline font-bold text-sm text-white line-clamp-1 mt-1">
                            {p.title}
                          </h4>
                          <span className="font-headline font-extrabold text-sm text-primary-fixed-dim">
                            {formatUZS(p.price)} UZS
                          </span>
                        </div>
                      </div>

                      {/* Stock & Active status */}
                      <div className="flex items-center justify-between text-[11px] font-mono border-t border-white/5 pt-2">
                        <span className="text-slate-400">
                          Zaxira: <strong className="text-white">{p.stock === -1 ? 'Cheksiz' : `${p.stock} ta`}</strong>
                        </span>
                        <span className={`font-bold ${p.is_active ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {p.is_active ? '● Faol' : '○ Nofaol'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setGalleryProduct(p);
                          }}
                          className="py-1.5 px-2 rounded-lg bg-surface-container-high hover:bg-white/10 text-[11px] font-semibold text-slate-300 flex items-center justify-center gap-1"
                          title="Rasmlar galereyasi"
                        >
                          <span className="material-symbols-outlined text-[15px]">photo_library</span>
                          <span>Rasmlar ({p.images?.length || 0})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProductForm({
                              title: p.title,
                              category: p.category,
                              product_type: p.product_type,
                              available_sizes: p.available_sizes || '',
                              available_colors: p.available_colors || '',
                              short_description: p.short_description || '',
                              description: p.description || '',
                              price: p.price,
                              original_price: p.original_price || '',
                              stock: p.stock,
                              is_active: p.is_active
                            });
                            setProductModal(p);
                          }}
                          className="py-1.5 px-2 rounded-lg bg-surface-container-high hover:bg-primary-container text-[11px] font-semibold text-white flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[15px]">edit</span>
                          <span>Tahrir</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          className="py-1.5 px-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-[11px] font-semibold flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                          <span>O'chirish</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 3: TO'LOV REKVIZITLARI (SETTINGS) */}
        {/* ========================================== */}
        {internalTab === 'settings' && (
          <div className="max-w-xl flex flex-col gap-5">
            <div>
              <h2 className="font-headline font-bold text-lg text-white">
                To'lov Rekvizitlari Sozlamasi
              </h2>
              <p className="text-xs text-on-surface-variant">
                Mijozlar buyurtma berganda to'lov o'tkazishi kerak bo'lgan rasmiy karta raqami va ko'rsatmalar
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="bg-surface-container-lowest border border-white/5 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Karta Raqami <span className="text-primary-container">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.card_number}
                  onChange={(e) => setSettingsForm({ ...settingsForm, card_number: e.target.value })}
                  placeholder="8600 0000 0000 0000"
                  className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-primary-container"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Karta Egasi (F.I.O) <span className="text-primary-container">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.card_holder}
                  onChange={(e) => setSettingsForm({ ...settingsForm, card_holder: e.target.value })}
                  placeholder="AZIZBEK EGAMOV"
                  className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-primary-container"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Bank Nomi <span className="text-primary-container">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.bank_name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bank_name: e.target.value })}
                  placeholder="Kapitalbank / TBC / Uzcard & Humo"
                  className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-container"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  To'lov Yo'riqnomasi (Mijozga ko'rinadigan matn)
                </label>
                <textarea
                  rows={3}
                  value={settingsForm.instructions}
                  onChange={(e) => setSettingsForm({ ...settingsForm, instructions: e.target.value })}
                  placeholder="Ko'rsatilgan karta raqamiga to'lov qiling va to'lov kvitansiyasini yuklang..."
                  className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-container resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="py-3 rounded-xl bg-gradient-to-r from-primary-container to-[#be0034] text-white font-bold text-xs uppercase tracking-wider shadow-neon-red disabled:opacity-50 active:scale-98 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {savingSettings ? 'Saqlanmoqda...' : 'Rekvizitlarni Saqlash'}
              </button>
            </form>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 4: STATISTIKA (STATS) */}
        {/* ========================================== */}
        {internalTab === 'stats' && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="font-headline font-bold text-lg text-white">
                Do'kon Statistikasi &amp; Tushum
              </h2>
              <p className="text-xs text-on-surface-variant">
                Do'kon savdo hajmi, tasdiqlangan va kutilayotgan buyurtmalar holati
              </p>
            </div>

            {loadingStats ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-on-surface-variant font-mono">Statistika hisoblanmoqda...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Sales */}
                <div className="bg-surface-container-lowest border border-white/5 rounded-2xl p-5 flex flex-col gap-2 shadow-lg">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-mono uppercase">Jami Tushum</span>
                    <span className="material-symbols-outlined text-emerald-400">payments</span>
                  </div>
                  <span className="font-headline font-extrabold text-2xl text-emerald-400">
                    {formatUZS(stats?.total_sales || 0)} UZS
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Tasdiqlangan buyurtmalar</span>
                </div>

                {/* Total Orders */}
                <div className="bg-surface-container-lowest border border-white/5 rounded-2xl p-5 flex flex-col gap-2 shadow-lg">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-mono uppercase">Jami Buyurtmalar</span>
                    <span className="material-symbols-outlined text-cyan-400">receipt_long</span>
                  </div>
                  <span className="font-headline font-extrabold text-2xl text-white">
                    {stats?.orders_count || 0} ta
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Barcha vaqtlar bo'yicha</span>
                </div>

                {/* Pending Orders */}
                <div className="bg-surface-container-lowest border border-white/5 rounded-2xl p-5 flex flex-col gap-2 shadow-lg">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-mono uppercase">Kutilayotganlar</span>
                    <span className="material-symbols-outlined text-amber-400">schedule</span>
                  </div>
                  <span className="font-headline font-extrabold text-2xl text-amber-400">
                    {stats?.pending_count || 0} ta
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Tekshirilishi kerak</span>
                </div>

                {/* Active Products */}
                <div className="bg-surface-container-lowest border border-white/5 rounded-2xl p-5 flex flex-col gap-2 shadow-lg">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-mono uppercase">Faol Mahsulotlar</span>
                    <span className="material-symbols-outlined text-primary-container">inventory_2</span>
                  </div>
                  <span className="font-headline font-extrabold text-2xl text-primary-fixed-dim">
                    {stats?.products_count || 0} ta
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Sotuvda mavjud</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* ORDER INSPECTOR MODAL */}
      {/* ==================================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141f] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-5 p-6 shadow-2xl animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-lg text-white">
                  Buyurtma #{selectedOrder.order_number}
                </span>
                <span className="text-xs text-on-surface-variant font-mono">
                  ({new Date(selectedOrder.created_at).toLocaleString()})
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedOrder(null);
                  setActionModal(null);
                }}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content 2-Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left column: Details */}
              <div className="flex flex-col gap-3">
                <div className="bg-black/30 border border-white/5 rounded-2xl p-3.5 flex flex-col gap-2 text-xs">
                  <span className="font-mono uppercase text-slate-400 font-bold">Xaridor:</span>
                  <span className="font-semibold text-white text-sm">
                    {selectedOrder.user_details?.full_name || 'Noma\'lum'}
                  </span>
                  <span className="font-mono text-slate-300">
                    Aloqa: <strong className="text-primary-fixed-dim">{selectedOrder.contact_info}</strong>
                  </span>
                  {selectedOrder.user_details?.telegram_id && (
                    <span className="font-mono text-slate-400 text-[11px]">
                      Telegram ID: {selectedOrder.user_details.telegram_id}
                    </span>
                  )}
                </div>

                <div className="bg-black/30 border border-white/5 rounded-2xl p-3.5 flex flex-col gap-2 text-xs">
                  <span className="font-mono uppercase text-slate-400 font-bold">Mahsulot:</span>
                  <span className="font-semibold text-white text-sm">
                    {selectedOrder.product_title}
                  </span>
                  <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-300">
                    <span>Soni: <strong className="text-white">{selectedOrder.quantity} ta</strong></span>
                    {selectedOrder.selected_size && <span>O'lcham: <strong>{selectedOrder.selected_size}</strong></span>}
                    {selectedOrder.selected_color && <span>Rang: <strong>{selectedOrder.selected_color}</strong></span>}
                  </div>
                  <div className="border-t border-white/5 pt-2 flex justify-between items-center text-sm font-headline">
                    <span className="text-slate-400">Jami To'lov:</span>
                    <span className="font-extrabold text-primary-container">
                      {formatUZS(selectedOrder.total_amount)} UZS
                    </span>
                  </div>
                </div>

                {/* Delivery address if physical */}
                {selectedOrder.delivery_address && (
                  <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-2xl p-3.5 text-xs text-cyan-200">
                    <span className="font-bold text-cyan-400 block mb-1">🚚 Yetkazib berish manzili:</span>
                    <span>{selectedOrder.delivery_address}</span>
                  </div>
                )}

                {/* User Note */}
                {selectedOrder.user_note && (
                  <div className="bg-white/5 rounded-2xl p-3 text-xs text-slate-300 italic">
                    <span className="font-semibold not-italic text-slate-400">Mijoz izohi: </span>
                    "{selectedOrder.user_note}"
                  </div>
                )}
              </div>

              {/* Right column: PAYMENT RECEIPT IMAGE (CHEK) */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center justify-between">
                  <span>To'lov Cheki Skrinshoti:</span>
                  {selectedOrder.receipt_url && (
                    <a
                      href={getImageUrl(selectedOrder.receipt_url || selectedOrder.payment_receipt)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-fixed-dim hover:underline text-[11px] font-semibold"
                    >
                      Kattalashtirish ↗
                    </a>
                  )}
                </span>

                <div className="w-full aspect-[4/5] rounded-2xl bg-black/60 border border-white/10 overflow-hidden relative flex items-center justify-center">
                  {selectedOrder.receipt_url ? (
                    <img
                      src={getImageUrl(selectedOrder.receipt_url || selectedOrder.payment_receipt)}
                      alt="To'lov cheki"
                      className="w-full h-full object-contain cursor-pointer"
                      onClick={() => setPreviewReceiptZoom(true)}
                    />
                  ) : (
                    <span className="text-xs text-slate-500 font-mono">Chek rasmi topilmadi</span>
                  )}
                </div>
              </div>
            </div>

            {/* ACTION SECTION */}
            {actionModal ? (
              <div className="bg-black/50 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                <h4 className="font-headline font-bold text-xs uppercase tracking-wider text-white">
                  {actionModal === 'approve'
                    ? "Buyurtmani Tasdiqlash & Material/Havola Yuborish"
                    : actionModal === 'deliver'
                    ? "Yetkazildi holatiga o'tkazish"
                    : "Buyurtmani Rad Etish"}
                </h4>

                {actionModal !== 'reject' ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Material Havolasi yoki Trek-kod (Google Drive / Telegram VIP / Pochta kodi)
                    </label>
                    <input
                      type="text"
                      value={deliveryDataInput}
                      onChange={(e) => setDeliveryDataInput(e.target.value)}
                      placeholder="https://t.me/... yoki https://drive.google.com/..."
                      className="w-full bg-[#161826] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-primary-container"
                    />
                  </div>
                ) : null}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    {actionModal === 'reject' ? "Rad etish sababi (Mijozga Telegram orqali yuboriladi)" : "Admin izohi / Ko'rsatma"}
                  </label>
                  <textarea
                    rows={2}
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    placeholder={actionModal === 'reject' ? "Chek soxta yoki mablag' hisobga kelib tushmadi..." : "Xaridingiz uchun rahmat! Savollaringiz bo'lsa adminga yozing..."}
                    className="w-full bg-[#161826] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-container resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActionModal(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleOrderStatusSubmit}
                    className={`px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wide transition-all shadow-lg active:scale-95 ${
                      actionModal === 'reject'
                        ? 'bg-rose-500 hover:bg-rose-400 text-white'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                    }`}
                  >
                    {actionLoading ? 'Yuborilmoqda...' : 'Tasdiqlash & Telegramdan Xabar Yuborish'}
                  </button>
                </div>
              </div>
            ) : (
              /* Action Buttons */
              <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-3">
                <button
                  type="button"
                  onClick={() => setActionModal('reject')}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 text-xs font-bold transition-all"
                >
                  Rad etish
                </button>

                {selectedOrder.product_type === 'physical' && selectedOrder.status === 'approved' && (
                  <button
                    type="button"
                    onClick={() => setActionModal('deliver')}
                    className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all"
                  >
                    Yetkazildi qilib belgilash
                  </button>
                )}

                {selectedOrder.status !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => setActionModal('approve')}
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95"
                  >
                    Tasdiqlash &amp; Material berish
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* RECEIPT ZOOM LIGHTBOX MODAL */}
      {/* ==================================================================== */}
      {previewReceiptZoom && selectedOrder?.receipt_url && (
        <div
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewReceiptZoom(false)}
        >
          <img
            src={getImageUrl(selectedOrder.receipt_url || selectedOrder.payment_receipt)}
            alt="Chek kattalashtirilgan"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/20"
          />
        </div>
      )}

      {/* ==================================================================== */}
      {/* PRODUCT CREATE / EDIT MODAL */}
      {/* ==================================================================== */}
      {productModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141f] border border-white/10 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-headline font-bold text-base text-white">
                {productModal === 'create' ? "Yangi Mahsulot Qo'shish" : "Mahsulotni Tahrirlash"}
              </h3>
              <button
                type="button"
                onClick={() => setProductModal(null)}
                className="w-8 h-8 rounded-full bg-white/5 text-slate-300 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-300">Nomi *</label>
                <input
                  type="text"
                  required
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  placeholder="Masalan: ISHDAMAN Cyber Hoodie yoki SMC Trading Kursi"
                  className="w-full bg-[#161826] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary-container"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-300">Toifa (Kategoriya) *</label>
                  <input
                    type="text"
                    required
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    placeholder="Kiyim & Merch, Kurslar, Indikatorlar..."
                    className="w-full bg-[#161826] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary-container"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-300">Mahsulot Turi *</label>
                  <select
                    value={productForm.product_type}
                    onChange={(e) => setProductForm({ ...productForm, product_type: e.target.value })}
                    className="w-full bg-[#161826] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary-container"
                  >
                    <option value="digital">Raqamli (Material / Link)</option>
                    <option value="physical">Jismoniy (Kiyim / Merch)</option>
                  </select>
                </div>
              </div>

              {/* Physical Options */}
              {productForm.product_type === 'physical' && (
                <div className="grid grid-cols-2 gap-3 bg-black/30 p-3 rounded-2xl border border-white/5">
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-cyan-300">Mavjud o'lchamlar</label>
                    <input
                      type="text"
                      value={productForm.available_sizes}
                      onChange={(e) => setProductForm({ ...productForm, available_sizes: e.target.value })}
                      placeholder="S, M, L, XL, XXL"
                      className="w-full bg-[#161826] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-cyan-300">Mavjud ranglar</label>
                    <input
                      type="text"
                      value={productForm.available_colors}
                      onChange={(e) => setProductForm({ ...productForm, available_colors: e.target.value })}
                      placeholder="Qora, Oq, Qizil"
                      className="w-full bg-[#161826] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-300">Narxi (UZS) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="250000"
                    className="w-full bg-[#161826] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-300">Asl narxi (chegirma)</label>
                  <input
                    type="number"
                    value={productForm.original_price}
                    onChange={(e) => setProductForm({ ...productForm, original_price: e.target.value })}
                    placeholder="300000"
                    className="w-full bg-[#161826] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-300">Zaxira (-1: cheksiz)</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-[#161826] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-300">Qisqa tavsif</label>
                <input
                  type="text"
                  value={productForm.short_description}
                  onChange={(e) => setProductForm({ ...productForm, short_description: e.target.value })}
                  placeholder="Katalogda ko'rinadigan qisqa 1 qatorlik ma'lumot..."
                  className="w-full bg-[#161826] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-300">To'liq tasnif (Tavsif)</label>
                <textarea
                  rows={4}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Mahsulot afzalliklari, nimalar berilishi, xususiyatlari..."
                  className="w-full bg-[#161826] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_active_toggle"
                  checked={productForm.is_active}
                  onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-primary-container"
                />
                <label htmlFor="is_active_toggle" className="text-xs font-semibold text-white cursor-pointer">
                  Mahsulot faol (Do'konda ko'rinsin)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setProductModal(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={productSaving}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-primary-container to-[#be0034] text-white font-bold text-xs uppercase tracking-wider shadow-neon-red active:scale-95 transition-all"
                >
                  {productSaving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* GALLERY IMAGES MANAGER MODAL */}
      {/* ==================================================================== */}
      {galleryProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141f] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="font-headline font-bold text-base text-white">
                  Rasmlar Galereyasi
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {galleryProduct.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setGalleryProduct(null)}
                className="w-8 h-8 rounded-full bg-white/5 text-slate-300 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Current Images */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {galleryProduct.images?.map((img) => (
                <div
                  key={img.id}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 bg-black/40 group ${
                    img.is_primary ? 'border-primary-container shadow-neon-red' : 'border-white/10'
                  }`}
                >
                  <img src={getImageUrl(img.image)} alt="Gallery" className="w-full h-full object-cover" />

                  {img.is_primary && (
                    <span className="absolute top-2 left-2 bg-primary-container text-white text-[9px] font-bold px-2 py-0.5 rounded shadow">
                      ASOSIY
                    </span>
                  )}

                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity p-2">
                    {!img.is_primary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(img.id)}
                        className="px-2 py-1 rounded bg-white text-black text-[10px] font-bold"
                        title="Asosiy rasm qilish"
                      >
                        Asosiy
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteGalleryImage(img.id)}
                      className="p-1.5 rounded bg-rose-500 text-white"
                      title="O'chirish"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* Upload Box */}
              <label className="aspect-square rounded-2xl border-2 border-dashed border-white/20 hover:border-primary-container bg-surface-container flex flex-col items-center justify-center gap-1 cursor-pointer transition-all">
                <span className="material-symbols-outlined text-[28px] text-slate-400">add_photo_alternate</span>
                <span className="text-[11px] font-semibold text-slate-300">
                  {uploadingImage ? 'Yuklanmoqda...' : 'Rasm Qo\'shish'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadGalleryImage}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
