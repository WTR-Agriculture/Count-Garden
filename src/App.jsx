import React, { useState, useEffect, useRef } from 'react';
import { 
  History, 
  Settings, 
  BarChart2, 
  Trash2, 
  Delete, 
  Edit2, 
  ChevronDown,
  AlertCircle,
  Undo2,
  Leaf,
  Asterisk,
  Sparkles,
  CheckCircle,
  ListChecks,
  Search,
  Calendar,
  Clock,
  ChevronRight,
  LayoutGrid,
  List,
  TrendingUp,
  PieChart,
  Plus,
  Save,
  X,
  Loader2
} from 'lucide-react';

// --- Constants ---
const GAS_URL = import.meta.env.VITE_GAS_URL;

const DEFAULT_CATEGORY_COLORS = {
  'ยาว': 'bg-[#4ADE80] text-neutral-900 border-[#4ADE80]', 
  'แหลม': 'bg-[#C084FC] text-white border-[#C084FC]', 
  'กลม': 'bg-[#FDE047] text-neutral-900 border-[#FDE047]', 
  'ลาย': 'bg-[#93C5FD] text-neutral-900 border-[#93C5FD]', 
  'ตั้งฉ่าย': 'bg-[#F9A8D4] text-neutral-900 border-[#F9A8D4]', 
};
const DEFAULT_CATEGORY_HEX = {
  'ยาว': '#4ADE80', 
  'แหลม': '#C084FC', 
  'กลม': '#FDE047', 
  'ลาย': '#93C5FD', 
  'ตั้งฉ่าย': '#F9A8D4', 
};

const FALLBACK_COLORS = [
  'bg-[#FCA5A5] text-neutral-900 border-[#FCA5A5]',
  'bg-[#99F6E4] text-neutral-900 border-[#99F6E4]',
  'bg-[#E9D5FF] text-neutral-900 border-[#E9D5FF]',
  'bg-[#FDBA74] text-neutral-900 border-[#FDBA74]',
  'bg-[#A7F3D0] text-neutral-900 border-[#A7F3D0]',
  'bg-[#93C5FD] text-neutral-900 border-[#93C5FD]'
];
const FALLBACK_HEX = ['#FCA5A5', '#99F6E4', '#E9D5FF', '#FDBA74', '#A7F3D0', '#93C5FD'];

const INACTIVE_COLOR = 'bg-white text-neutral-500 border-neutral-200';

export default function App() {
  const getTodayThaiFormat = () => {
    const d = new Date();
    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear()}`;
  };

  // --- State Management ---
  const [activeTab, setActiveTab] = useState('record');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [masterData, setMasterData] = useState({
    'มะละกอ': ['ยาว', 'แหลม', 'กลม', 'ลาย', 'ตั้งฉ่าย']
  });
  
  const [setupData, setSetupData] = useState({
    date: getTodayThaiFormat(),
    round: 1,
    fruit: ''
  });

  const [activeCategory, setActiveCategory] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [records, setRecords] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [expandedCats, setExpandedCats] = useState([]);
  const [editingId, setEditingId] = useState(null); 
  const [deleteConfirmId, setDeleteConfirmId] = useState(null); 

  const [historyRecords, setHistoryRecords] = useState([]);
  const [expandedHistory, setExpandedHistory] = useState([]);
  const [viewMode, setViewMode] = useState('card');
  const [searchTerm, setSearchTerm] = useState('');

  const [dashboardRange, setDashboardRange] = useState('daily'); 
  const [dashboardDate, setDashboardDate] = useState(getTodayThaiFormat());
  const [dashboardFruitFilter, setDashboardFruitFilter] = useState('All'); 

  const [settingsActiveFruit, setSettingsActiveFruit] = useState('');
  const [newFruit, setNewFruit] = useState('');
  const [newCat, setNewCat] = useState('');

  // --- Data Sync ---
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    if (!GAS_URL) return;
    setLoading(true);
    try {
      const [mRes, hRes] = await Promise.all([
        fetch(`${GAS_URL}?action=getMasterData`),
        fetch(`${GAS_URL}?action=getHistory`)
      ]);
      const mData = await mRes.json();
      const hData = await hRes.json();
      
      if (!mData.error) {
        setMasterData(mData);
        const f = Object.keys(mData)[0];
        if (f) {
          setSetupData(prev => ({ ...prev, fruit: f }));
          setSettingsActiveFruit(f);
        }
      }
      if (Array.isArray(hData)) setHistoryRecords(hData);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fruits = Object.keys(masterData);
  const currentCategories = masterData[setupData.fruit] || [];

  const getCategoryColorClass = (cat) => {
    if (DEFAULT_CATEGORY_COLORS[cat]) return DEFAULT_CATEGORY_COLORS[cat];
    let hash = 0;
    for (let i = 0; i < cat.length; i++) hash += cat.charCodeAt(i);
    return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
  };

  const getCategoryHex = (cat) => {
    if (DEFAULT_CATEGORY_HEX[cat]) return DEFAULT_CATEGORY_HEX[cat];
    let hash = 0;
    for (let i = 0; i < cat.length; i++) hash += cat.charCodeAt(i);
    return FALLBACK_HEX[hash % FALLBACK_HEX.length];
  };

  const grandTotal = records.reduce((sum, record) => sum + record.weight, 0);
  const getCategoryTotal = (category) => records.filter(r => r.category === category).reduce((sum, r) => sum + r.weight, 0);
  
  const groupedRecords = currentCategories.map(cat => ({ 
    category: cat, 
    items: records.filter(r => r.category === cat), 
    total: getCategoryTotal(cat) 
  })).filter(g => g.items.length > 0);
  
  const filteredHistory = historyRecords.filter(record => 
    record.date.toString().includes(searchTerm) || 
    record.fruit.includes(searchTerm) ||
    record.round.toString().includes(searchTerm)
  );

  // --- Handlers ---
  const handleStartRound = () => { setIsRecording(true); setActiveCategory(''); setErrorMsg(''); };
  const handleEditSetup = () => { setIsRecording(false); };
  
  const handleSetupDateChange = (e) => {
    if (!e.target.value) return;
    const dateObj = new Date(e.target.value);
    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    setSetupData(prev => ({ ...prev, date: `${dateObj.getDate()} ${thaiMonths[dateObj.getMonth()]} ${dateObj.getFullYear()}` }));
  };

  const handleNumpadClick = (val) => {
    if (!activeCategory) { setErrorMsg('กรุณาเลือกประเภทก่อน'); setTimeout(() => setErrorMsg(''), 2000); return; }
    if (val === 'BACKSPACE') setInputValue(prev => prev.slice(0, -1));
    else if (val === '.') { if (!inputValue.includes('.')) setInputValue(prev => prev ? prev + '.' : '0.'); } 
    else if (inputValue.length < 6) setInputValue(prev => prev + val);
  };

  const handleEnter = () => {
    if (!activeCategory || !inputValue || parseFloat(inputValue) <= 0) return;
    const newRecord = { id: Date.now().toString() + Math.random(), category: activeCategory, weight: parseFloat(inputValue), timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) };
    setRecords(prev => [newRecord, ...prev]);
    setInputValue(''); 
  };

  const handleDeleteLast = () => { if (records.length > 0) setRecords(prev => prev.slice(1)); };
  
  const handleConfirmRound = async () => {
    setLoading(true);
    const payload = {
      date: setupData.date,
      round: setupData.round,
      fruit: setupData.fruit,
      totalWeight: grandTotal,
      items: records.map(r => ({ category: r.category, weight: r.weight }))
    };

    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'saveRecord', payload })
      });
      const result = await res.json();
      if (result.success) {
        setShowSummaryModal(false);
        setIsRecording(false);
        setRecords([]);
        loadInitialData();
        setSetupData(prev => ({ ...prev, round: prev.round + 1 }));
      }
    } catch (e) { 
      alert("Error saving data"); 
    } finally { setLoading(false); }
  };

  // --- Dashboard Logic ---
  const statsHistory = dashboardFruitFilter === 'All' ? historyRecords : historyRecords.filter(r => r.fruit === dashboardFruitFilter);
  let totalDashboardWeight = 0, totalRounds = statsHistory.length, catTotals = {};

  statsHistory.forEach(r => {
    totalDashboardWeight += r.totalWeight;
    r.details.forEach(d => { catTotals[d.category] = (catTotals[d.category] || 0) + d.total; });
  });

  const sortedCats = Object.entries(catTotals).sort((a,b) => b[1] - a[1]);
  const topCategory = sortedCats.length > 0 ? sortedCats[0][0] : 'None';

  let currentPercentage = 0;
  const gradientParts = sortedCats.map(([cat, weight]) => {
    const p = (weight / totalDashboardWeight) * 100;
    const color = getCategoryHex(cat);
    const part = `${color} ${currentPercentage}% ${currentPercentage + p}%`;
    currentPercentage += p;
    return part;
  });
  const conicGradientString = totalDashboardWeight > 0 ? `conic-gradient(${gradientParts.join(', ')})` : `conic-gradient(#f1f5f9 0% 100%)`;

  const toggleHistoryExpand = (id) => setExpandedHistory(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleCatExpand = (cat) => setExpandedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  // --- Screens ---
  const renderSetupScreen = () => (
    <div className="flex-1 flex flex-col p-4 bg-[#FDFBF7] justify-center items-center min-h-full w-full relative overflow-y-auto pb-24 lg:pb-4">
      <Asterisk className="absolute top-6 left-6 w-10 h-10 text-[#C084FC] opacity-40 animate-spin-slow" />
      <div className="bg-white p-6 lg:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100 w-full max-w-sm lg:max-w-md transition-all relative z-10">
        <h2 className="text-3xl lg:text-4xl font-black text-neutral-900 mb-6 lg:mb-8 text-center tracking-tight">Start now <br/><span className="text-[#4ADE80] font-sans font-bold text-2xl">Recording</span></h2>
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-xs font-semibold text-neutral-500 mb-1.5 ml-2">วันที่ (Date)</label>
            <div className="w-full bg-neutral-50 hover:bg-neutral-100 transition-colors text-neutral-800 p-3.5 rounded-full font-medium text-sm border border-neutral-100 flex items-center justify-center gap-2 relative overflow-hidden cursor-pointer shadow-sm">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <span>{setupData.date}</span>
              <input type="date" onChange={handleSetupDateChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-1/3"><label className="block text-xs font-semibold text-neutral-500 mb-1.5 ml-2">รอบ (Round)</label><div className="w-full bg-[#FDE047] text-neutral-900 p-3.5 rounded-full font-bold text-sm text-center shadow-sm">{setupData.round}</div></div>
            <div className="w-2/3 relative">
              <label className="block text-xs font-semibold text-neutral-500 mb-1.5 ml-2">ผลไม้ (Fruit)</label>
              <select value={setupData.fruit} onChange={e => setSetupData(prev => ({...prev, fruit: e.target.value}))} className="w-full bg-white border-2 border-neutral-200 text-neutral-800 p-3.5 pl-4 pr-10 rounded-full font-bold text-sm appearance-none hover:border-neutral-300 transition-colors focus:outline-none focus:border-neutral-900 shadow-sm cursor-pointer">
                {fruits.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-4 top-[38px] pointer-events-none" />
            </div>
          </div>
        </div>
        <button onClick={handleStartRound} className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-lg py-4 rounded-full shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wide">Get started <ChevronDown className="w-4 h-4 -rotate-90" /></button>
      </div>
    </div>
  );

  const renderActiveScreen = () => (
    <div className="flex-1 flex flex-col bg-[#FDFBF7] min-h-full w-full lg:overflow-hidden lg:pb-0">
      <div className="p-3 lg:px-6 lg:py-4 flex flex-wrap justify-between items-center z-20 shrink-0 gap-3 w-full bg-[#FDFBF7] border-b border-transparent">
        <div className="flex flex-wrap items-center gap-2 text-neutral-600 font-medium flex-1">
          <button onClick={handleEditSetup} className="bg-white border border-neutral-200 px-3 py-1.5 rounded-full text-[11px] lg:text-xs font-bold shadow-sm flex items-center gap-1.5 hover:bg-neutral-50 shrink-0"><Edit2 className="w-3 h-3 text-neutral-400" /> {setupData.date}</button>
          <div className="bg-[#4ADE80] text-neutral-900 px-3 py-1.5 rounded-full text-[11px] lg:text-xs font-bold shadow-sm shrink-0">รอบ {setupData.round}</div>
          <div className="bg-[#C084FC] text-white px-3 py-1.5 rounded-full text-[11px] lg:text-xs font-bold shadow-sm shrink-0">{setupData.fruit}</div>
        </div>
        <button onClick={() => setShowSummaryModal(true)} disabled={records.length === 0} className="flex items-center justify-center px-4 py-2 bg-neutral-900 text-[#FDE047] disabled:bg-neutral-200 disabled:text-neutral-400 font-bold rounded-full transition-all shadow-md text-[11px] lg:text-xs gap-1.5 active:scale-95 shrink-0 ml-auto uppercase tracking-wide"><ListChecks className="w-4 h-4" /> สรุปรอบ</button>
      </div>
      <div className="px-3 py-1.5 lg:px-6 z-10">
        <div className="bg-[#FDE047] rounded-3xl p-4 lg:p-6 flex flex-col md:flex-row md:items-center md:justify-between shadow-sm relative overflow-hidden">
           <Asterisk className="absolute -right-2 -top-2 w-16 h-16 text-black opacity-5" />
           <div><h3 className="font-extrabold tracking-tight text-xl lg:text-2xl text-neutral-800 mb-0.5 uppercase">Total Weight</h3><p className="text-neutral-700 font-medium text-[11px] lg:text-xs">ยอดรวมสุทธิ</p></div>
           <div className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 mt-2 md:mt-0">{grandTotal.toLocaleString()} <span className="text-lg lg:text-xl font-bold text-neutral-700 ml-1">กก.</span></div>
        </div>
      </div>
      <div className="py-1.5 lg:py-3 w-full shrink-0 overflow-hidden flex items-center z-10">
        <div className="flex overflow-x-auto hide-scrollbar px-3 lg:px-6 gap-2 pb-1.5 w-full">
          {currentCategories.map(cat => {
            const isActive = activeCategory === cat;
            const subtotal = getCategoryTotal(cat);
            return (
              <button key={cat} onClick={() => { setActiveCategory(cat); setErrorMsg(''); }} className={`flex flex-col min-w-[85px] lg:min-w-[100px] items-start py-2.5 px-3.5 rounded-[1.25rem] border-2 transition-all shrink-0 text-left ${isActive ? getCategoryColorClass(cat) : INACTIVE_COLOR} ${isActive ? 'shadow-md lg:scale-105' : 'hover:border-neutral-300 hover:bg-neutral-50'}`}>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1.5 ${isActive ? 'bg-white/30 backdrop-blur-sm' : 'bg-neutral-100 text-neutral-500'}`}>{subtotal > 0 ? subtotal : '0'} กก.</span>
                <span className="text-lg lg:text-xl font-bold tracking-tight">{cat}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col lg:flex-row bg-white rounded-3xl lg:rounded-t-3xl shadow-[0_-5px_20px_rgb(0,0,0,0.02)] border border-neutral-100 mx-2 lg:mx-4 mb-2 mt-1 lg:flex-1 lg:overflow-hidden">
        <div className="flex flex-col p-3 lg:p-6 border-b lg:border-r border-neutral-100 h-[260px] lg:h-auto lg:flex-1 overflow-y-auto hide-scrollbar">
          <div className="flex justify-between items-center mb-2 shrink-0"><h3 className="text-base lg:text-xl font-extrabold tracking-tight text-neutral-800">Recent Activity</h3><button onClick={handleDeleteLast} disabled={records.length === 0} className="flex items-center gap-1 text-[10px] lg:text-xs font-bold text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-full hover:bg-neutral-200 transition-colors"><Undo2 className="w-3 h-3" /> Undo</button></div>
          <div className="space-y-1.5">
            {records.map(r => (
              <div key={r.id} className="group bg-white p-2 lg:p-4 rounded-xl flex justify-between items-center border border-neutral-100 hover:border-neutral-200 transition-all">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full ${getCategoryColorClass(r.category).split(' ')[0]} flex items-center justify-center text-white font-bold text-xs`}>{r.category.charAt(0)}</div>
                  <div><div className="font-bold text-neutral-900 text-xs lg:text-base">{r.category}</div><div className="text-[9px] lg:text-xs text-neutral-400">{r.timestamp}</div></div>
                </div>
                <div className="flex items-center gap-2 lg:gap-4"><span className="text-lg lg:text-2xl font-black">{r.weight}</span><button onClick={() => setRecords(prev => prev.filter(x => x.id !== r.id))} className="text-red-400 p-2"><Trash2 className="w-3 h-3" /></button></div>
              </div>
            ))}
          </div>
        </div>
        <div className="shrink-0 lg:w-[420px] p-3 pb-28 lg:p-6 bg-[#FDFBF7] flex flex-col gap-3 rounded-b-3xl lg:rounded-none relative z-20 font-sans">
          <div className="relative w-full">
            <div className={`bg-white rounded-2xl p-4 shadow-sm border-2 flex items-center justify-between min-h-[60px] lg:min-h-[70px] ${activeCategory ? 'border-neutral-900' : 'border-neutral-200'}`}>
              <div className="flex flex-col"><span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Current</span><span className={`text-lg lg:text-xl font-bold ${activeCategory ? 'text-neutral-900' : 'text-neutral-300'}`}>{activeCategory || 'Select type'}</span></div>
              <div className="text-4xl lg:text-5xl font-black text-neutral-900">{inputValue || 0}</div>
            </div>
            {errorMsg && <div className="absolute inset-0 bg-neutral-900 text-white text-xs font-bold rounded-2xl flex items-center justify-center shadow-xl animate-in zoom-in-95 duration-200 z-50"><AlertCircle className="w-4 h-4 text-[#FDE047] mr-2" /> {errorMsg}</div>}
          </div>
          <div className="grid grid-cols-4 gap-2 h-full min-h-[220px]">
            <div className="col-span-3 grid grid-cols-3 gap-2">
              {['7', '8', '9', '4', '5', '6', '1', '2', '3', '00', '0', '.'].map(b => (
                <button key={b} onClick={() => handleNumpadClick(b)} className="bg-white rounded-xl shadow-[0_2px_8px_rgb(0,0,0,0.02)] text-2xl font-bold py-2 border border-neutral-100 active:scale-95 transition-all">{b}</button>
              ))}
            </div>
            <div className="col-span-1 flex flex-col gap-2">
              <button onClick={() => handleNumpadClick('BACKSPACE')} className="bg-neutral-100 rounded-xl flex items-center justify-center flex-1 active:scale-95 transition-all"><Delete className="w-6 h-6" /></button>
              <button onClick={handleEnter} disabled={!activeCategory || !inputValue} className="bg-neutral-900 text-white rounded-xl flex-[2] flex flex-col items-center justify-center active:scale-95 transition-all uppercase font-black text-lg disabled:opacity-20">Enter</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistoryScreen = () => (
    <div className="flex-1 flex flex-col bg-[#FDFBF7] min-h-full w-full overflow-hidden">
      <div className="p-4 md:p-6 shrink-0 bg-white border-b border-neutral-100">
         <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-neutral-900 flex items-center gap-2">History <span className="text-neutral-300 font-normal">|</span> <span className="text-[#C084FC] font-bold text-lg lg:text-xl">ประวัติ</span></h2>
         <div className="mt-4 flex gap-2 items-center">
            <div className="flex-1 bg-neutral-50 border border-neutral-200 rounded-full flex items-center px-3 py-1.5 shadow-sm">
               <Search className="w-3.5 h-3.5 text-neutral-400 mr-1.5" /><input type="text" placeholder="ค้นหา..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-xs w-full" />
            </div>
            <div className="bg-neutral-100 p-0.5 rounded-full border border-neutral-200 flex">
               <button onClick={() => setViewMode('list')} className={`w-7 h-7 flex items-center justify-center rounded-full ${viewMode === 'list' ? 'bg-white shadow text-neutral-900' : 'text-neutral-400'}`}><List className="w-3.5 h-3.5" /></button>
               <button onClick={() => setViewMode('card')} className={`w-7 h-7 flex items-center justify-center rounded-full ${viewMode === 'card' ? 'bg-white shadow text-neutral-900' : 'text-neutral-400'}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
            </div>
         </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-28 hide-scrollbar">
         <div className="space-y-3 max-w-3xl mx-auto">
            {filteredHistory.map(record => (
              <div key={record.id} className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
                <div onClick={() => toggleHistoryExpand(record.id)} className="p-4 cursor-pointer flex justify-between items-center">
                  <div>
                    <div className="text-[10px] font-bold text-neutral-400 uppercase">{record.date} | {record.timestamp}</div>
                    <h3 className="text-lg font-bold text-neutral-900">{record.fruit} <span className="bg-neutral-100 px-1.5 py-0.5 rounded-full text-[9px] font-bold ml-1">รอบ {record.round}</span></h3>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-neutral-900">{record.totalWeight.toLocaleString()} <span className="text-[10px] font-bold text-neutral-500">กก.</span></div>
                    <div className="text-[10px] text-[#C084FC] font-bold flex items-center justify-end">Details <ChevronDown className={`w-3 h-3 transition-transform ${expandedHistory.includes(record.id) ? 'rotate-180' : ''}`} /></div>
                  </div>
                </div>
                {expandedHistory.includes(record.id) && (
                  <div className="px-4 pb-4 bg-neutral-50 border-t border-neutral-100 pt-3 flex flex-wrap gap-2">
                    {record.details.map(d => (
                      <div key={d.category} className="bg-white px-3 py-1.5 rounded-xl border border-neutral-100 text-xs font-bold">
                        {d.category}: {d.total} กก. ({d.count})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
         </div>
      </div>
    </div>
  );

  const renderDashboardScreen = () => (
    <div className="flex-1 flex flex-col bg-[#FDFBF7] min-h-full w-full overflow-hidden p-6 pb-28">
      <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-neutral-900 mb-6 flex items-center gap-2">Statistics <span className="text-neutral-300 font-normal">|</span> <span className="text-[#FDE047] font-bold">สถิติ</span></h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-5 rounded-[2.5rem] border border-neutral-100 shadow-sm relative overflow-hidden flex flex-col">
          <div className="w-10 h-10 bg-[#FDE047]/20 rounded-full flex items-center justify-center mb-3"><BarChart2 className="w-5 h-5"/></div>
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">ยอดรวมทั้งหมด</p>
          <div className="text-3xl font-black text-neutral-900">{totalDashboardWeight.toLocaleString()} <span className="text-xs font-bold text-neutral-500">กก.</span></div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#FDE047] rounded-full blur-[40px] opacity-20"></div>
        </div>
        <div className="bg-white p-5 rounded-[2.5rem] border border-neutral-100 shadow-sm flex flex-col">
          <div className="w-10 h-10 bg-[#4ADE80]/20 rounded-full flex items-center justify-center mb-3"><ListChecks className="w-5 h-5"/></div>
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">จำนวนรอบ</p>
          <div className="text-3xl font-black text-neutral-900">{totalRounds} <span className="text-xs font-bold text-neutral-500">รอบ</span></div>
        </div>
        <div className="bg-white p-5 rounded-[2.5rem] border border-neutral-100 shadow-sm flex flex-col">
          <div className="w-10 h-10 bg-[#C084FC]/20 rounded-full flex items-center justify-center mb-3"><TrendingUp className="w-5 h-5"/></div>
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">ประเภทสูงสุด</p>
          <div className="text-3xl font-black text-neutral-900">{topCategory}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm flex flex-col items-center">
            <h3 className="w-full font-black text-neutral-800 mb-6 flex items-center gap-2"><PieChart className="w-5 h-5"/> สัดส่วนตามประเภท</h3>
            <div className="relative w-40 h-40 rounded-full shadow-inner" style={{ background: conicGradientString }}>
                <div className="absolute inset-[15%] bg-white rounded-full flex flex-col items-center justify-center text-center">
                    <span className="text-[9px] font-bold text-neutral-400 uppercase">Total</span>
                    <span className="text-lg font-black">{totalDashboardWeight}</span>
                </div>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {sortedCats.map(([cat, weight]) => (
                <div key={cat} className="flex items-center gap-1.5 bg-neutral-50 px-2 py-1 rounded-lg border text-[9px] font-bold">
                    <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: getCategoryHex(cat)}}></div>
                    {cat} {Math.round((weight/totalDashboardWeight)*100)}%
                </div>
              ))}
            </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm flex flex-col h-full min-h-[250px] relative overflow-hidden">
            <h3 className="font-black text-neutral-800 mb-2 flex items-center gap-2"><Clock className="w-5 h-5"/> แนวโน้มข้อมูล</h3>
            <div className="flex-1 flex items-end justify-between gap-2 border-b pt-10 pb-2">
                {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                    <div key={i} className={`flex-1 rounded-t-xl transition-all duration-700 ${i === 6 ? 'bg-neutral-900 shadow-lg' : 'bg-neutral-100'}`} style={{height: `${h}%`}}></div>
                ))}
            </div>
            <div className="flex justify-between mt-2 text-[8px] font-bold text-neutral-400 uppercase">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => <span key={d}>{d}</span>)}
            </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-[100dvh] flex flex-col lg:flex-row bg-[#FDFBF7] overflow-hidden font-sans relative">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-neutral-100 p-8 shrink-0">
          <div className="flex items-center gap-3 mb-10">
              <Asterisk className="w-8 h-8 animate-spin-slow" />
              <h1 className="text-3xl font-black tracking-tighter">CountGARDEN</h1>
          </div>
          <div className="space-y-2 flex-1">
              <NavBtn icon={<Sparkles />} label="Recording" active={activeTab === 'record'} onClick={()=>setActiveTab('record')} />
              <NavBtn icon={<History />} label="History" active={activeTab === 'history'} onClick={()=>setActiveTab('history')} />
              <NavBtn icon={<BarChart2 />} label="Statistics" active={activeTab === 'dashboard'} onClick={()=>setActiveTab('dashboard')} />
              <div className="pt-10 pb-2 text-[10px] font-black text-neutral-300 uppercase tracking-widest pl-4">System</div>
              <NavBtn icon={<Settings />} label="Settings" active={activeTab === 'settings'} onClick={()=>setActiveTab('settings')} />
          </div>
      </aside>

      <main className="flex-1 relative flex flex-col overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-[200] bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-neutral-900" />
          </div>
        )}
        {activeTab === 'record' ? (isRecording ? renderActiveScreen() : renderSetupScreen()) : activeTab === 'history' ? renderHistoryScreen() : activeTab === 'dashboard' ? renderDashboardScreen() : <div className="p-20 text-center font-black opacity-20 text-5xl">Coming Soon</div>}
      </main>

      {/* Mobile Nav */}
      <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-50 pointer-events-none pb-safe">
        <div className="bg-neutral-900/95 backdrop-blur-md px-4 py-2 flex justify-between items-center rounded-full shadow-2xl pointer-events-auto border border-neutral-800">
          <MobileNavBtn icon={<Sparkles />} label="Record" active={activeTab === 'record'} onClick={()=>setActiveTab('record')} />
          <MobileNavBtn icon={<History />} label="History" active={activeTab === 'history'} onClick={()=>setActiveTab('history')} />
          <MobileNavBtn icon={<BarChart2 />} label="Stats" active={activeTab === 'dashboard'} onClick={()=>setActiveTab('dashboard')} />
          <MobileNavBtn icon={<Settings />} label="Settings" active={activeTab === 'settings'} onClick={()=>setActiveTab('settings')} />
        </div>
      </nav>

      {/* Modals & CSS */}
      {showSummaryModal && renderSummaryModal()}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 16px); }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
      `}} />
    </div>
  );
}

const NavBtn = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className={`flex items-center gap-4 w-full p-4 rounded-[2rem] font-black text-lg transition-all ${active ? 'bg-neutral-900 text-white shadow-xl translate-x-1' : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50'}`}>
        {React.cloneElement(icon, { className: "w-6 h-6" })} {label}
    </button>
);

const MobileNavBtn = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className={`p-4 flex flex-col items-center gap-1 transition-all ${active ? 'text-[#FDE047] scale-110' : 'text-neutral-400'}`}>
        {React.cloneElement(icon, { className: `w-6 h-6 ${active && icon.type === Sparkles ? 'bg-yellow-300 text-neutral-900 rounded-full p-1 shadow-md' : ''}` })}
        <span className={`text-[9px] font-bold ${active ? 'block' : 'hidden'}`}>{label}</span>
    </button>
);
