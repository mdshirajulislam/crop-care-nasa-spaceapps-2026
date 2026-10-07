import React, { useState, useEffect } from 'react';
import { 
  fetchActivities, addActivity, updateActivity, deleteActivity,
  fetchExpenses, addExpense, updateExpense, deleteExpense,
  fetchHarvests, addHarvest, updateHarvest, deleteHarvest,
  fetchFinancialSummary 
} from '../utils/api';
import { 
  BookOpen, PlusCircle, DollarSign, TrendingUp, TrendingDown, Users, 
  Calendar, PieChart as PieIcon, Edit3, Trash2, X, Sprout, Check, Loader2 
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { toBanglaDigits, formatBDT } from '../utils/banglaNumbers';
import { useLanguage } from '../contexts/LanguageContext';

export const FarmDiaryPage = () => {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('activities'); // 'activities', 'expenses', 'harvests'
  const [activities, setActivities] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [financials, setFinancials] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [editingHarvest, setEditingHarvest] = useState(null);

  // Form states
  const [activityForm, setActivityForm] = useState({
    activity_type: 'সার প্রয়োগ',
    date: '2026-10-06',
    details: '',
    cost: 0,
    worker_count: 1
  });

  const [expenseForm, setExpenseForm] = useState({
    category: 'সার',
    amount: 0,
    date: '2026-10-06',
    description: ''
  });

  const [harvestForm, setHarvestForm] = useState({
    crop_yield_kg: 1800,
    total_sale_amount: 45000,
    date: '2026-10-06',
    note: 'স্থানীয় আড়তে বিক্রি'
  });

  const loadAll = async () => {
    try {
      const [act, exp, harv, fin] = await Promise.all([
        fetchActivities(),
        fetchExpenses(),
        fetchHarvests(),
        fetchFinancialSummary()
      ]);
      setActivities(act || []);
      setExpenses(exp || []);
      setHarvests(harv || []);
      setFinancials(fin);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // --- Activities Handlers ---
  const handleOpenAddActivity = () => {
    setEditingActivity(null);
    setActivityForm({ activity_type: 'সার প্রয়োগ', date: '2026-10-06', details: '', cost: 0, worker_count: 1 });
    setShowActivityModal(true);
  };

  const handleOpenEditActivity = (act) => {
    setEditingActivity(act);
    setActivityForm({
      activity_type: act.activity_type,
      date: act.date,
      details: act.details,
      cost: act.cost,
      worker_count: act.worker_count
    });
    setShowActivityModal(true);
  };

  const handleSaveActivity = async (e) => {
    e.preventDefault();
    try {
      if (editingActivity) {
        await updateActivity(editingActivity.id, {
          ...activityForm,
          cost: parseFloat(activityForm.cost) || 0,
          worker_count: parseInt(activityForm.worker_count) || 0
        });
      } else {
        await addActivity({
          ...activityForm,
          cost: parseFloat(activityForm.cost) || 0,
          worker_count: parseInt(activityForm.worker_count) || 0
        });
      }
      setShowActivityModal(false);
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteActivity = async (id) => {
    if (window.confirm(lang === 'bn' ? "আপনি কি এই কার্যক্রমের এন্ট্রি মুছে ফেলতে চান?" : "Are you sure you want to delete this activity entry?")) {
      try {
        await deleteActivity(id);
        loadAll();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // --- Expense Handlers ---
  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setExpenseForm({ category: 'সার', amount: 1500, date: '2026-10-06', description: '' });
    setShowExpenseModal(true);
  };

  const handleOpenEditExpense = (exp) => {
    setEditingExpense(exp);
    setExpenseForm({
      category: exp.category,
      amount: exp.amount,
      date: exp.date,
      description: exp.description
    });
    setShowExpenseModal(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, {
          ...expenseForm,
          amount: parseFloat(expenseForm.amount) || 0
        });
      } else {
        await addExpense({
          ...expenseForm,
          amount: parseFloat(expenseForm.amount) || 0
        });
      }
      setShowExpenseModal(false);
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm(lang === 'bn' ? "আপনি কি এই খরচের হিসাবটি মুছে ফেলতে চান?" : "Are you sure you want to delete this expense record?")) {
      try {
        await deleteExpense(id);
        loadAll();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // --- Harvest Handlers ---
  const handleOpenAddHarvest = () => {
    setEditingHarvest(null);
    setHarvestForm({ crop_yield_kg: 2000, total_sale_amount: 50000, date: '2026-10-06', note: '' });
    setShowHarvestModal(true);
  };

  const handleOpenEditHarvest = (h) => {
    setEditingHarvest(h);
    setHarvestForm({
      crop_yield_kg: h.crop_yield_kg,
      total_sale_amount: h.total_sale_amount,
      date: h.date,
      note: h.note || ''
    });
    setShowHarvestModal(true);
  };

  const handleSaveHarvest = async (e) => {
    e.preventDefault();
    try {
      if (editingHarvest) {
        await updateHarvest(editingHarvest.id, {
          ...harvestForm,
          crop_yield_kg: parseFloat(harvestForm.crop_yield_kg) || 0,
          total_sale_amount: parseFloat(harvestForm.total_sale_amount) || 0
        });
      } else {
        await addHarvest({
          ...harvestForm,
          crop_yield_kg: parseFloat(harvestForm.crop_yield_kg) || 0,
          total_sale_amount: parseFloat(harvestForm.total_sale_amount) || 0
        });
      }
      setShowHarvestModal(false);
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteHarvest = async (id) => {
    if (window.confirm(lang === 'bn' ? "আপনি কি ফসল বিক্রির এই হিসাব মুছে ফেলতে চান?" : "Are you sure you want to delete this harvest record?")) {
      try {
        await deleteHarvest(id);
        loadAll();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#94a3b8'];
  const pieData = financials?.category_breakdown
    ? Object.keys(financials.category_breakdown).map((key) => ({
        name: key,
        value: financials.category_breakdown[key]
      }))
    : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {t.diary.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {t.diary.subtitle}
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={handleOpenAddActivity}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.diary.addActivity}</span>
          </button>
          <button
            onClick={handleOpenAddExpense}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all"
          >
            <DollarSign className="w-4 h-4" />
            <span>{t.diary.addExpense}</span>
          </button>
          <button
            onClick={handleOpenAddHarvest}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all"
          >
            <Sprout className="w-4 h-4" />
            <span>{t.diary.addHarvest}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Financial Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Total Expense */}
            <div className="glass-card rounded-2xl p-4 border border-slate-200 bg-white space-y-1 shadow-sm">
              <span className="text-[11px] text-slate-500 font-medium">{t.diary.totalExpense}</span>
              <p className="text-lg sm:text-xl font-extrabold text-amber-700">
                {formatBDT(financials?.total_expense_bdt || 0, lang)}
              </p>
              <span className="text-[11px] text-slate-400 block">
                {lang === 'bn' ? 'বিঘাপ্রতি: ' : 'Per Bigha: '}{formatBDT(financials?.cost_per_bigha_bdt || 0, lang)}
              </span>
            </div>

            {/* Total Income */}
            <div className="glass-card rounded-2xl p-4 border border-slate-200 bg-white space-y-1 shadow-sm">
              <span className="text-[11px] text-slate-500 font-medium">{t.diary.totalIncome}</span>
              <p className="text-lg sm:text-xl font-extrabold text-emerald-700">
                {formatBDT(financials?.total_income_bdt || 0, lang)}
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold block">
                {lang === 'bn' ? 'মোট ফলন: ' : 'Total Yield: '}{toBanglaDigits(financials?.total_yield_kg || 0, lang)} {lang === 'bn' ? 'কেজি' : 'kg'}
              </span>
            </div>

            {/* Net Profit / Loss */}
            <div className="glass-card rounded-2xl p-4 border border-slate-200 bg-white space-y-1 shadow-sm">
              <span className="text-[11px] text-slate-500 font-medium">{t.diary.netProfit}</span>
              <p className={`text-lg sm:text-xl font-extrabold ${financials?.is_profitable ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatBDT(financials?.net_profit_loss_bdt || 0, lang)}
              </p>
              <span className="text-[11px] text-slate-500 block font-medium">
                {financials?.is_profitable 
                  ? (lang === 'bn' ? 'লাভজনক অবস্থান' : 'Profitable') 
                  : (lang === 'bn' ? 'খরচ রিকভারি বাকি' : 'Pending Recovery')}
              </span>
            </div>

            {/* Break-even Price Target */}
            <div className="glass-card rounded-2xl p-4 border border-slate-200 bg-white space-y-1 shadow-sm">
              <span className="text-[11px] text-slate-500 font-medium">{t.diary.breakEven}</span>
              <p className="text-lg sm:text-xl font-extrabold text-sky-700">
                {formatBDT(financials?.break_even_per_maund || 850, lang)}
              </p>
              <span className="text-[11px] text-sky-600 block font-medium">
                {lang === 'bn' ? '১ মণ = ৪০ কেজি' : '1 Maund = 40 kg'}
              </span>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'activities'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t.diary.activities} ({toBanglaDigits(activities.length, lang)})
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'expenses'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t.diary.expenses} ({toBanglaDigits(expenses.length, lang)})
            </button>
            <button
              onClick={() => setActiveTab('harvests')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'harvests'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t.diary.harvests} ({toBanglaDigits(harvests.length, lang)})
            </button>
          </div>

          {/* Section: Activities */}
          {activeTab === 'activities' && (
            <div className="space-y-3">
              {activities.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center text-slate-500 text-xs">
                  {lang === 'bn' ? 'কোনো কার্যক্রম এখনও রেকর্ড করা হয়নি।' : 'No farm activities recorded yet.'}
                </div>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="glass-card rounded-2xl p-4 border border-slate-200/90 bg-white shadow-sm flex items-start justify-between gap-3 hover:border-emerald-300 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {act.activity_type}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          {act.date}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed pt-1">
                        {act.details}
                      </p>
                      {act.worker_count > 0 && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {lang === 'bn' ? 'শ্রমিক: ' : 'Workers: '}{toBanglaDigits(act.worker_count, lang)} {lang === 'bn' ? 'জন' : ''}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                      {act.cost > 0 && (
                        <span className="text-sm font-bold text-amber-700">{formatBDT(act.cost, lang)}</span>
                      )}
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleOpenEditActivity(act)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                          title={lang === 'bn' ? "সম্পাদনা করুন" : "Edit"}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteActivity(act.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200"
                          title={lang === 'bn' ? "মুছে ফেলুন" : "Delete"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Section: Expenses */}
          {activeTab === 'expenses' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="glass-card rounded-2xl p-5 border border-slate-200/90 bg-white shadow-sm space-y-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <PieIcon className="w-5 h-5 text-emerald-600" />
                  {lang === 'bn' ? 'খাতভিত্তিক ব্যয়ের অনুপাত' : 'Expense Breakdown by Category'}
                </h3>
                <div className="h-56 w-full">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val) => formatBDT(val, lang)} contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-slate-400">
                      {lang === 'bn' ? 'খরচের তথ্য নেই' : 'No expense data'}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-3">
                {expenses.map((exp) => (
                  <div key={exp.id} className="glass-card rounded-2xl p-4 border border-slate-200/90 bg-white shadow-sm flex items-start justify-between gap-3 hover:border-amber-300 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          {exp.category}
                        </span>
                        <span className="text-xs text-slate-500">{exp.date}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800">{exp.description}</p>
                    </div>

                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <span className="text-sm sm:text-base font-bold text-amber-700">{formatBDT(exp.amount, lang)}</span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleOpenEditExpense(exp)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Harvests */}
          {activeTab === 'harvests' && (
            <div className="space-y-3">
              {harvests.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center text-slate-500 text-xs">
                  {lang === 'bn' 
                    ? "কোনো ফসল বিক্রির হিসাব এখনও যুক্ত করা হয়নি। উপরে 'বিক্রি/ফলন লিখুন' বাটনে চাপ দিন।" 
                    : "No harvest records yet. Click 'Add Harvest Record' above."}
                </div>
              ) : (
                harvests.map((h) => (
                  <div key={h.id} className="glass-card rounded-2xl p-4 border border-emerald-200 bg-white shadow-sm flex items-start justify-between gap-3 hover:border-emerald-400 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {lang === 'bn' ? 'ফসল কর্তন ও বিক্রি' : 'Harvest & Sale'}
                        </span>
                        <span className="text-xs text-slate-500">{h.date}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800">
                        {lang === 'bn' ? 'মোট ফলন: ' : 'Total Yield: '}
                        <strong className="text-slate-900">{toBanglaDigits(h.crop_yield_kg, lang)} {lang === 'bn' ? 'কেজি' : 'kg'}</strong> 
                        ({toBanglaDigits(Math.round(h.crop_yield_kg / 40), lang)} {lang === 'bn' ? 'মণ' : 'Maunds'}) • {h.note}
                      </p>
                      <p className="text-xs text-emerald-700 font-medium">
                        {lang === 'bn' ? 'গড় বিক্রয়মূল্য: ' : 'Avg Sale Price: '}
                        {formatBDT(h.sale_price_per_kg || (h.total_sale_amount / h.crop_yield_kg), lang)}/{lang === 'bn' ? 'কেজি' : 'kg'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <span className="text-base sm:text-lg font-bold text-emerald-700">{formatBDT(h.total_sale_amount, lang)}</span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleOpenEditHarvest(h)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteHarvest(h.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Modal: Activity */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 font-bengali">
                {editingActivity ? 'কার্যক্রম সম্পাদনা করুন' : 'নতুন খামার কার্যক্রম লিখুন'}
              </h3>
              <button onClick={() => setShowActivityModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-700 font-medium mb-1">কাজের ধরন:</label>
                <select
                  value={activityForm.activity_type}
                  onChange={(e) => setActivityForm({ ...activityForm, activity_type: e.target.value })}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="জমি তৈরি ও চাষ">জমি তৈরি ও চাষ</option>
                  <option value="চারা রোপণ">চারা রোপণ / বীজ বপন</option>
                  <option value="সার প্রয়োগ">সার প্রয়োগ</option>
                  <option value="কীটনাশক / ছত্রাকনাশক স্প্রে">কীটনাশক / ছত্রাকনাশক স্প্রে</option>
                  <option value="নিড়ানি ও আগাছা দমন">নিড়ানি ও আগাছা দমন</option>
                  <option value="সেচ প্রদান">সেচ প্রদান</option>
                  <option value="ফসল কর্তন ও মাড়াই">ফসল কর্তন ও মাড়াই</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">তারিখ:</label>
                <input
                  type="date"
                  value={activityForm.date}
                  onChange={(e) => setActivityForm({ ...activityForm, date: e.target.value })}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">বিবরণ (ওষুধ/সারের নাম, পরিমাণ ইত্যাদি):</label>
                <textarea
                  rows="2"
                  value={activityForm.details}
                  onChange={(e) => setActivityForm({ ...activityForm, details: e.target.value })}
                  placeholder="যেমন: ইউরিয়া ২০ কেজি প্রয়োগ করা হয়েছে..."
                  required
                  className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">খরচ (টাকা):</label>
                  <input
                    type="number"
                    value={activityForm.cost}
                    onChange={(e) => setActivityForm({ ...activityForm, cost: e.target.value })}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">শ্রমিক সংখ্যা:</label>
                  <input
                    type="number"
                    value={activityForm.worker_count}
                    onChange={(e) => setActivityForm({ ...activityForm, worker_count: e.target.value })}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md transition-colors"
                >
                  {editingActivity ? 'হালনাগাদ করুন' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 font-bengali">
                {editingExpense ? 'খরচ সম্পাদনা করুন' : 'নতুন খরচ যোগ করুন'}
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-700 font-medium mb-1">খরচের খাত:</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="সার">সার</option>
                  <option value="বীজ">বীজ</option>
                  <option value="কীটনাশক / ওষুধ">কীটনাশক / ওষুধ</option>
                  <option value="শ্রমিক মজুরি">শ্রমিক মজুরি</option>
                  <option value="সেচ চার্জ">সেচ চার্জ</option>
                  <option value="যন্ত্র ও চাষ">যন্ত্র ও চাষ</option>
                  <option value="অন্যান্য">অন্যান্য</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">টাকার পরিমাণ (BDT):</label>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  required
                  className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">তারিখ:</label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">বিবরণ:</label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="যেমন: ৩ বস্তা ইউরিয়া ক্রয়..."
                  className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 shadow-md transition-colors"
                >
                  {editingExpense ? 'হালনাগাদ করুন' : 'যোগ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Harvest */}
      {showHarvestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 font-bengali">
                {editingHarvest ? 'ফসল বিক্রির হিসাব সম্পাদনা' : 'ফসল বিক্রি ও ফলনের হিসাব'}
              </h3>
              <button onClick={() => setShowHarvestModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHarvest} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-700 font-medium mb-1">ফলনের পরিমাণ (কেজি):</label>
                <input
                  type="number"
                  value={harvestForm.crop_yield_kg}
                  onChange={(e) => setHarvestForm({ ...harvestForm, crop_yield_kg: e.target.value })}
                  required
                  className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-500">
                  {toBanglaDigits(Math.round(harvestForm.crop_yield_kg / 40))} মণ
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">মোট বিক্রয়মূল্য (টাকা):</label>
                <input
                  type="number"
                  value={harvestForm.total_sale_amount}
                  onChange={(e) => setHarvestForm({ ...harvestForm, total_sale_amount: e.target.value })}
                  required
                  className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">তারিখ:</label>
                <input
                  type="date"
                  value={harvestForm.date}
                  onChange={(e) => setHarvestForm({ ...harvestForm, date: e.target.value })}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">ক্রেতা / বিবরণ:</label>
                <input
                  type="text"
                  value={harvestForm.note}
                  onChange={(e) => setHarvestForm({ ...harvestForm, note: e.target.value })}
                  placeholder="যেমন: ময়মনসিংহ মিলগেটে বিক্রি..."
                  className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowHarvestModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md transition-colors"
                >
                  {editingHarvest ? 'হালনাগাদ করুন' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
