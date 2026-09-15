import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';
import AmountInput from '../components/AmountInput';
import { formatUZS } from '../utils/formatters';

export default function TasksBuilderPage() {
  const { showToast } = useAdminAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Form modal (Create / Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [saving, setSaving] = useState(false);

  const initialFormState = {
    title: '',
    description: '',
    category: 'telegram',
    reward_amount: 500,
    task_type: 'telegram_join',
    verification_type: 'auto_api',
    url: '',
    telegram_target: '',
    timer_seconds: 15,
    icon_name: 'send',
    is_active: true,
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks/admin/tasks/');
      setTasks(res.data);
    } catch (e) {
      console.error(e);
      showToast('Vazifalarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      category: task.category || 'telegram',
      reward_amount: task.reward_amount || 500,
      task_type: task.task_type || 'telegram_join',
      verification_type: task.verification_type || 'auto_api',
      url: task.url || '',
      telegram_target: task.telegram_target || '',
      timer_seconds: task.timer_seconds || 15,
      icon_name: task.icon_name || 'send',
      is_active: task.is_active ?? true,
    });
    setShowModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingTask) {
        await api.put(`/tasks/admin/tasks/${editingTask.id}/`, formData);
        showToast('Vazifa muvaffaqiyatli tahrirlandi!');
      } else {
        await api.post('/tasks/admin/tasks/', formData);
        showToast('Yangi vazifa muvaffaqiyatli yaratildi!');
      }
      setShowModal(false);
      setEditingTask(null);
      setFormData(initialFormState);
      fetchTasks();
    } catch (err) {
      const msg = err.response?.data?.error || 'Vazifani saqlashda xato yuz berdi';
      showToast(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (task) => {
    try {
      await api.put(`/tasks/admin/tasks/${task.id}/`, {
        is_active: !task.is_active,
      });
      showToast(`Vazifa ${!task.is_active ? 'faollashtirildi' : 'to\'xtatildi'}`);
      fetchTasks();
    } catch (e) {
      showToast('Xato yuz berdi');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Haqiqatan ham bu vazifani o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/tasks/admin/tasks/${taskId}/`);
      showToast("Vazifa o'chirildi");
      fetchTasks();
    } catch (e) {
      showToast("O'chirishda xatolik yuz berdi");
    }
  };

  const categories = [
    { id: 'all', label: 'Barchasi' },
    { id: 'telegram', label: 'Telegram' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'youtube', label: 'YouTube' },
    { id: 'broker', label: 'Broker & Prop' },
    { id: 'deposit', label: 'Depozit' },
  ];

  const filteredTasks = tasks.filter((t) => {
    const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchQuery =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.url && t.url.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchQuery;
  });

  return (
    <div className="p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">playlist_add_check</span>
            <h2 className="font-headline font-bold text-white text-xl uppercase tracking-tight">
              Vazifalar Konstruktori (Tasks Builder)
            </h2>
          </div>
          <span className="text-xs text-on-surface-variant mt-0.5">
            Platformadagi barcha vazifalarni yaratish, to'liq tahrirlash, yoqish/o'chirish va mukofotlarni belgilash
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchTasks}
            className="p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-white/10 text-white flex items-center justify-center transition-all"
            title="Yangilash"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-primary-container text-white font-bold text-xs uppercase shadow-neon-red flex items-center gap-2 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Yangi Vazifa Qo'shish</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-surface-container-lowest border border-white/5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === c.id
                  ? 'bg-primary-container text-white shadow-neon-red'
                  : 'text-on-surface-variant hover:text-white hover:bg-surface-container'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Vazifa nomi bo'yicha qidiruv..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-container border border-white/10 text-white text-xs outline-none focus:border-primary-container"
          />
        </div>
      </div>

      {/* Tasks Grid */}
      {loading ? (
        <div className="py-16 flex justify-center text-on-surface-variant">
          <span className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-xs text-on-surface-variant">
          {searchQuery ? "Qidiruv bo'yicha vazifa topilmadi." : "Hozircha vazifalar mavjud emas. Yuqoridagi tugma orqali yangi vazifa qo'shing."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`glass-card admin-card-hover rounded-xl p-4 flex flex-col justify-between gap-3 border shadow-lg transition-all ${
                task.is_active ? 'border-white/10' : 'border-white/5 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary-fixed-dim font-mono uppercase font-semibold">
                    {task.category}
                  </span>
                  <span className="font-mono font-bold text-secondary text-xs">
                    +{formatUZS(task.reward_amount)} UZS
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[20px]">
                      {task.icon_name || 'task'}
                    </span>
                  </div>
                  <h4 className="font-headline font-semibold text-white text-sm truncate">
                    {task.title}
                  </h4>
                </div>

                {task.description && (
                  <p className="text-xs text-on-surface-variant line-clamp-2">
                    {task.description}
                  </p>
                )}

                <div className="p-2 rounded-lg bg-surface-container-lowest/80 border border-white/5 flex flex-col gap-1 text-[10px] text-on-surface-variant font-mono">
                  <div className="flex items-center justify-between">
                    <span>
                      Tekshiruv:{' '}
                      <b className="text-white">
                        {task.verification_type === 'auto_api' && 'auto_api (Bot)'}
                        {task.verification_type === 'timer' && `timer (${task.timer_seconds}s)`}
                        {task.verification_type === 'manual_screenshot' && 'manual_screenshot'}
                        {task.verification_type === 'manual_id' && 'manual_id'}
                        {task.verification_type === 'manual_username' && 'manual_username (@)'}
                        {!['auto_api', 'timer', 'manual_screenshot', 'manual_id', 'manual_username'].includes(task.verification_type) && task.verification_type}
                      </b>
                    </span>
                    {task.timer_seconds > 0 && task.verification_type !== 'timer' && (
                      <span>Taymer: {task.timer_seconds}s</span>
                    )}
                  </div>
                  {task.url && (
                    <a
                      href={task.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-secondary hover:underline truncate"
                    >
                      {task.url}
                    </a>
                  )}
                </div>
              </div>

              {/* Action Buttons: Toggle, Edit, Delete */}
              <div className="pt-2.5 border-t border-white/5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(task)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-all ${
                    task.is_active
                      ? 'bg-secondary-container/15 text-secondary border-secondary/30'
                      : 'bg-surface-container text-on-surface-variant border-white/10'
                  }`}
                  title={task.is_active ? "Nofaol qilish" : "Faollashtirish"}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {task.is_active ? 'check_circle' : 'pause_circle'}
                  </span>
                  <span>{task.is_active ? 'Faol' : 'Nofaol'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(task)}
                    className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-white/10 text-white text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    <span className="material-symbols-outlined text-[14px] text-primary">edit</span>
                    <span>Tahrirlash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    className="px-2 py-1 rounded-lg text-error hover:bg-error/10 text-xs font-semibold flex items-center gap-0.5 transition-all"
                    title="O'chirish"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create or Edit Task */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="glass-card rounded-2xl p-6 border border-white/10 w-full max-w-lg flex flex-col gap-4 shadow-2xl my-8 animate-modal-pop">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">
                  {editingTask ? 'edit_note' : 'add_task'}
                </span>
                <h3 className="font-headline font-bold text-white text-base uppercase">
                  {editingTask ? "Vazifani Tahrirlash" : "Yangi Vazifa Yaratish"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingTask(null);
                }}
                className="text-on-surface-variant hover:text-white"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant font-mono">Vazifa Sarlavhasi:</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Masalan: Rasmiy Telegram kanalga a'zo bo'lish"
                  className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-primary-container"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant font-mono">Ta'rif / Ko'rsatma:</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Foydalanuvchiga vazifa shartlari haqida qisqacha ma'lumot..."
                  className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-primary-container resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-on-surface-variant font-mono">Kategoriya:</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-primary-container"
                  >
                    <option value="telegram">Telegram</option>
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                    <option value="broker">Broker & Prop</option>
                    <option value="deposit">Depozit</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-on-surface-variant font-mono">Mukofot Summasi (UZS):</label>
                  <AmountInput
                    value={formData.reward_amount}
                    onChange={(val) => setFormData({ ...formData, reward_amount: val })}
                    placeholder="Masalan: 500"
                    required
                    className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-primary-container font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-on-surface-variant font-mono">Tekshirish Turi:</label>
                  <select
                    value={formData.verification_type}
                    onChange={(e) => setFormData({ ...formData, verification_type: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-primary-container"
                  >
                    <option value="auto_api">Avtomat (Telegram Bot API)</option>
                    <option value="timer">Yarim-avtomat (Taymer)</option>
                    <option value="manual_screenshot">Qo'lda (Skrinshot tekshirish)</option>
                    <option value="manual_id">Qo'lda (Broker/Prop ID)</option>
                    <option value="manual_username">Qo'lda (Username tekshirish)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-on-surface-variant font-mono">Taymer (sekund):</label>
                  <input
                    type="number"
                    value={formData.timer_seconds}
                    onChange={(e) => setFormData({ ...formData, timer_seconds: parseInt(e.target.value, 10) || 0 })}
                    className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-primary-container font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant font-mono">Target Havola (URL):</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://t.me/kanal yoki https://instagram.com/..."
                  className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-primary-container"
                />
              </div>

              {formData.verification_type === 'auto_api' && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-on-surface-variant font-mono">Kanal @username yoki Telegram ID:</label>
                  <input
                    type="text"
                    value={formData.telegram_target}
                    onChange={(e) => setFormData({ ...formData, telegram_target: e.target.value })}
                    placeholder="@kanal_nomi yoki -100123456789"
                    className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-primary-container font-mono"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-lowest border border-white/5">
                <input
                  type="checkbox"
                  id="task_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <label htmlFor="task_is_active" className="text-xs text-white cursor-pointer select-none">
                  Ushbu vazifani faol holatga keltirish (Foydalanuvchilarga ko'rinsin)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTask(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-xs font-semibold transition-all"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-primary-container text-white font-bold text-xs uppercase tracking-wider shadow-neon-red flex items-center gap-2 hover:bg-primary-container/90 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <span className="material-symbols-outlined text-base">check</span>
                  )}
                  <span>{editingTask ? "Saqlash" : "Yaratish"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
