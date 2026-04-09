import React, { useState, useEffect } from 'react';
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
  LayoutGrid,
  List,
  TrendingUp,
  PieChart,
  Plus,
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
  
  // Real Master Data from GAS
  const [masterData, setMasterData] = useState({
    'มะละกอ': ['ยาว', 'แหลม', 'กลม', 'ลาย', 'ตั้งฉ่าย']
  });
  
  const [setupData, setSetupData] = useState({
    date: getTodayThaiFormat(),
    round: 1,
    fruit: 'มะละกอ'
  });

  const [activeCategory, setActiveCategory] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [records, setRecords] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [expandedCats, setExpandedCats] = useState([]);
  const [editingId, setEditingId] = useState(null); 
  const [deleteConfirmId, setDeleteConfirmId] = useState(null); 

  // History State from GAS
  const [historyRecords, setHistoryRecords] = useState([]);
  const [expandedHistory, setExpandedHistory] = useState([]);
  const [viewMode, setViewMode] = useState('card');
  const [searchTerm, setSearchTerm] = useState('');

  // Dashboard / Settings State
  const [dashboardDate, setDashboardDate] = useState(getTodayThaiFormat());
  const [dashboardFruitFilter, setDashboardFruitFilter] = useState('All'); 
  const [settingsActiveFruit, setSettingsActiveFruit] = useState('');
  const [newFruit, setNewFruit] = useState('');
  const [newCat, setNewCat] = useState('');

  // --- Effects ---
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    if (!GAS_URL) return;
    setLoading(true);
    try {
      const [masterRes, historyRes] = await Promise.all([
        fetch(`${GAS_URL}?action=getMasterData`),
        fetch(`${GAS_URL}?action=getHistory`)
      ]);
      const master = await masterRes.json();
      const history = await historyRes.json();
      
      if (!master.error) {
        setMasterData(master);
        const firstFruit = Object.keys(master)[0];
        if (firstFruit) {
          setSetupData(prev => ({ ...prev, fruit: firstFruit }));
          setSettingsActiveFruit(firstFruit);
        }
      }
      if (Array.isArray(history)) setHistoryRecords(history);
    } catch (err) {
      console.error("Load failed", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Helpers ---
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
  
  const handleNumpadClick = (val) => {
    setErrorMsg('');
    if (!activeCategory) { 
      setErrorMsg('กรุณาเลือกประเภทก่อนระบุน้ำหนัก'); 
      setTimeout(() => setErrorMsg(''), 2000); 
      return; 
    }
    if (val === 'BACKSPACE') setInputValue(prev => prev.slice(0, -1));
    else if (val === '.') { if (!inputValue.includes('.')) setInputValue(prev => prev ? prev + '.' : '0.'); } 
    else if (inputValue.length < 6) setInputValue(prev => prev + val);
  };

  const handleEnter = () => {
    if (!activeCategory || !inputValue || parseFloat(inputValue) <= 0) return;
    const newRecord = { 
      id: Date.now().toString() + Math.random(), 
      category: activeCategory, 
      weight: parseFloat(inputValue), 
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) 
    };
    setRecords(prev => [newRecord, ...prev]);
    setInputValue(''); 
  };

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
        loadAllData(); // Refresh history
        setSetupData(prev => ({ ...prev, round: prev.round + 1 }));
      }
    } catch (err) {
      console.error("Save failed", err);
      alert("บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  // --- Dashboard Logic ---
  const statsHistory = dashboardFruitFilter === 'All' 
      ? historyRecords 
      : historyRecords.filter(r => r.fruit === dashboardFruitFilter);

  let totalDashboardWeight = 0;
  let totalRounds = statsHistory.length;
  let catTotals = {};

  statsHistory.forEach(r => {
    totalDashboardWeight += r.totalWeight;
    r.details.forEach(d => {
      catTotals[d.category] = (catTotals[d.category] || 0) + d.total;
    });
  });

  let topCategory = Object.keys(catTotals).length > 0 
    ? Object.entries(catTotals).sort((a,b) => b[1] - a[1])[0][0]
    : 'ไม่มีข้อมูล';

  let conicGradientString = 'conic-gradient(#f1f5f9 0% 100%)';
  if (totalDashboardWeight > 0) {
    let currentPercentage = 0;
    const sortedCats = Object.entries(catTotals).sort((a,b) => b[1] - a[1]);
    const gradientParts = sortedCats.map(([cat, weight]) => {
      const percentage = (weight / totalDashboardWeight) * 100;
      const color = getCategoryHex(cat);
      const part = `${color} ${currentPercentage}% ${currentPercentage + percentage}%`;
      currentPercentage += percentage;
      return part;
    });
    conicGradientString = `conic-gradient(${gradientParts.join(', ')})`;
  }

  // --- Render Screens ---
  const renderSetupScreen = () => (
    <div className="flex-1 flex flex-col p-4 bg-[#FDFBF7] justify-center items-center relative overflow-y-auto pb-24 lg:pb-4">
      <Asterisk className="absolute top-6 left-6 w-10 h-10 text-[#C084FC] opacity-40 animate-spin-slow" />
      <div className="bg-white p-6 lg:p-10 rounded-3xl shadow-xl border border-neutral-100 w-full max-w-sm lg:max-w-md relative z-10">
        <h2 className="text-3xl lg:text-4xl font-black text-neutral-900 mb-6 text-center tracking-tight">
          เริ่มต้น <br/><span className="text-[#4ADE80] font-sans font-bold text-2xl">บันทึกน้ำหนัก</span>
        </h2>
        
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-xs font-semibold text-neutral-500 mb-1.5 ml-2">วันที่</label>
            <div className="w-full bg-neutral-50 text-neutral-800 p-3.5 rounded-full font-medium text-sm border border-neutral-100 flex items-center justify-center gap-2 relative cursor-pointer shadow-sm">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <span>{setupData.date}</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="w-1/3">
              <label className="block text-xs font-semibold text-neutral-500 mb-1.5 ml-2">รอบที่</label>
              <input 
                type="number" value={setupData.round}
                onChange={e => setSetupData(prev => ({ ...prev, round: parseInt(e.target.value) || 1 }))}
                className="w-full bg-[#FDE047] text-neutral-900 p-3.5 rounded-full font-bold text-sm text-center shadow-sm outline-none" 
              />
            </div>
            <div className="w-2/3 relative">
              <label className="block text-xs font-semibold text-neutral-500 mb-1.5 ml-2">ผลไม้</label>
              <select 
                value={setupData.fruit}
                onChange={e => setSetupData(prev => ({...prev, fruit: e.target.value}))}
                className="w-full bg-white border-2 border-neutral-200 p-3.5 pl-4 pr-10 rounded-full font-bold text-sm appearance-none focus:border-neutral-900 shadow-sm cursor-pointer"
              >
                {fruits.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-4 top-[38px] pointer-events-none" />
            </div>
          </div>
        </div>

        <button onClick={handleStartRound} className="w-full bg-neutral-900 text-white font-bold text-lg py-4 rounded-full shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wide">
          เริ่มบันทึก <ChevronDown className="w-4 h-4 -rotate-90" />
        </button>
      </div>
    </div>
  );

  const renderActiveScreen = () => (
    <div className="flex-1 flex flex-col bg-[#FDFBF7] h-full w-full lg:overflow-hidden">
      <div className="p-3 lg:px-6 lg:py-4 flex justify-between items-center z-20 shrink-0 gap-3 w-full border-b bg-[#FDFBF7] border-transparent">
        <div className="flex flex-wrap items-center gap-2 text-neutral-600 font-medium">
          <button onClick={handleEditSetup} className="bg-white border border-neutral-200 px-3 py-1.5 rounded-full text-[11px] lg:text-xs font-bold shadow-sm flex items-center gap-1.5 hover:bg-neutral-50 shrink-0"><Edit2 className="w-3 h-3 text-neutral-400" /> {setupData.date}</button>
          <div className="bg-[#4ADE80] text-neutral-900 px-3 py-1.5 rounded-full text-[11px] lg:text-xs font-bold shadow-sm shrink-0">รอบ {setupData.round}</div>
          <div className="bg-[#C084FC] text-white px-3 py-1.5 rounded-full text-[11px] lg:text-xs font-bold shadow-sm shrink-0">{setupData.fruit}</div>
        </div>
        <button onClick={() => setShowSummaryModal(true)} disabled={records.length === 0} className="flex items-center justify-center px-4 py-2 bg-neutral-900 text-[#FDE047] disabled:bg-neutral-200 disabled:text-neutral-400 font-bold rounded-full transition-all shadow-md text-[11px] lg:text-xs gap-1.5 uppercase tracking-wide">
          <ListChecks className="w-4 h-4" /> สรุปรอบ
        </button>
      </div>

      <div className="px-3 py-1.5 lg:px-6 shrink-0">
        <div className="bg-[#FDE047] rounded-3xl p-4 lg:p-6 flex flex-col md:flex-row md:items-center md:justify-between shadow-sm relative overflow-hidden">
           <Asterisk className="absolute -right-2 -top-2 w-16 h-16 text-black opacity-5" />
           <div>
             <h3 className="font-extrabold tracking-tight text-xl lg:text-2xl text-neutral-800 mb-0.5 uppercase">Total Weight</h3>
             <p className="text-neutral-700 font-medium text-[11px] lg:text-xs">ยอดรวมสุทธิ</p>
           </div>
           <div className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 mt-2 md:mt-0">
              {grandTotal.toLocaleString()} <span className="text-lg lg:text-xl font-bold text-neutral-700 ml-1">กก.</span>
           </div>
        </div>
      </div>

      <div className="py-2 w-full shrink-0 overflow-hidden flex items-center z-10">
        <div className="flex overflow-x-auto hide-scrollbar px-3 lg:px-6 gap-2 w-full">
          {currentCategories.map(cat => {
            const isActive = activeCategory === cat;
            const subtotal = getCategoryTotal(cat);
            const colorClass = isActive ? getCategoryColorClass(cat) : INACTIVE_COLOR;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex flex-col min-w-[100px] items-start py-3 px-4 rounded-3xl border-2 transition-all shrink-0 text-left ${colorClass} ${isActive ? 'shadow-md lg:scale-105' : 'hover:border-neutral-300 hover:bg-neutral-50'}`}>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1 ${isActive ? 'bg-white/30 backdrop-blur-sm' : 'bg-neutral-100 text-neutral-500'}`}>{subtotal > 0 ? subtotal : '0'} กก.</span>
                <span className="text-lg lg:text-xl font-bold">{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row bg-white rounded-t-[2.5rem] shadow-2xl border border-neutral-100 mx-2 lg:mx-4 mt-2 overflow-hidden mb-safe">
        <div className="flex flex-col p-4 lg:p-6 border-b lg:border-r lg:border-b-0 border-neutral-100 h-[240px] lg:h-full lg:flex-1 overflow-y-auto hide-scrollbar">
          <h3 className="text-lg lg:text-xl font-extrabold mb-4 text-neutral-800">รายการล่าสุด</h3>
          <div className="space-y-2">
            {records.map(record => (
              <div key={record.id} className="bg-neutral-50 p-3 rounded-2xl flex justify-between items-center border border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${getCategoryColorClass(record.category).split(' ')[0]} flex items-center justify-center text-white font-bold text-xs`}>{record.category.charAt(0)}</div>
                  <div><div className="font-bold text-neutral-900 text-xs">{record.category}</div><div className="text-[10px] text-neutral-400">{record.timestamp}</div></div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xl font-black">{record.weight}</span>
                  <button onClick={() => setRecords(prev => prev.filter(r => r.id !== record.id))} className="text-red-400 p-2"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            {records.length === 0 && <p className="text-center text-xs text-neutral-300 py-10">ยังไม่มีข้อมูล</p>}
          </div>
        </div>

        <div className="lg:w-[420px] bg-[#FDFBF7] p-4 lg:p-6 flex flex-col gap-4">
          <div className={`bg-white rounded-2xl p-4 shadow-inner border-2 min-h-[70px] flex items-center justify-between transition-colors ${activeCategory ? 'border-neutral-900' : 'border-neutral-200'}`}>
            <span className="text-xs font-bold text-neutral-400">{activeCategory || 'เลือกประเภทก่อน'}</span>
            <span className="text-5xl font-black text-neutral-900">{inputValue || 0}</span>
          </div>
          <div className="grid grid-cols-4 gap-2 h-full">
            <div className="col-span-3 grid grid-cols-3 gap-2">
              {['7', '8', '9', '4', '5', '6', '1', '2', '3', '00', '0', '.'].map(btn => (
                <button key={btn} onClick={() => handleNumpadClick(btn)} className="bg-white rounded-2xl border shadow-sm text-2xl font-bold py-3 hover:bg-neutral-50 active:scale-95 transition-all">{btn}</button>
              ))}
            </div>
            <div className="col-span-1 flex flex-col gap-2">
              <button onClick={() => handleNumpadClick('BACKSPACE')} className="bg-neutral-200 rounded-2xl flex items-center justify-center flex-1 active:scale-95 transition-all"><Delete className="w-6 h-6" /></button>
              <button onClick={handleEnter} disabled={!activeCategory || !inputValue} className="bg-neutral-900 text-white rounded-2xl flex-[2] flex flex-col items-center justify-center active:scale-95 transition-all uppercase font-black text-lg disabled:opacity-20">Enter</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistoryScreen = () => (
    <div className="flex-1 flex flex-col p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 className="text-4xl font-black text-neutral-900">History</h2>
        <div className="bg-white rounded-full px-4 py-2 border shadow-sm flex items-center">
          <Search className="w-4 h-4 text-neutral-400 mr-2" />
          <input type="text" placeholder="ค้นหาวันที่/ผลไม้..." className="bg-transparent text-sm outline-none" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 hide-scrollbar">
        {filteredHistory.map(record => (
          <div key={record.id} className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">{record.date} | {record.timestamp}</div>
                <h3 className="text-2xl font-black text-neutral-900">{record.fruit} <span className="text-sm font-bold text-neutral-400">รอบ {record.round}</span></h3>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-neutral-900">{record.totalWeight} <span className="text-xs font-bold text-neutral-500">กก.</span></div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {record.details.map(d => (
                <div key={d.category} className="bg-neutral-50 px-3 py-1.5 rounded-xl border text-xs font-bold">
                  {d.category}: {d.total} กก.
                </div>
              ))}
            </div>
            <button onClick={() => setDeleteConfirmId(record.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"><Trash2 className="w-4 h-4"/></button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDashboardScreen = () => (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto hide-scrollbar">
      <h2 className="text-4xl font-black text-neutral-900">Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={<BarChart2 />} label="ยอดรวมทั้งหมด" val={totalDashboardWeight} unit="กก." color="#FDE047" />
        <StatCard icon={<ListChecks />} label="จำนวนรอบ" val={totalRounds} unit="รอบ" color="#4ADE80" />
        <StatCard icon={<TrendingUp />} label="ประเภทเยอะสุด" val={topCategory} unit="" color="#C084FC" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm flex flex-col items-center">
            <h3 className="w-full font-black text-neutral-800 mb-6 flex items-center gap-2"><PieChart className="w-5 h-5"/> สัดส่วนตามประเภท</h3>
            <div className="relative w-48 h-48 rounded-full shadow-inner" style={{ background: conicGradientString }}>
                <div className="absolute inset-[15%] bg-white rounded-full flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Total</span>
                    <span className="text-xl font-black">{totalDashboardWeight}</span>
                </div>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {Object.entries(catTotals).map(([cat, weight]) => (
                <div key={cat} className="flex items-center gap-2 bg-neutral-50 px-3 py-1.5 rounded-xl border text-[10px] font-bold">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: getCategoryHex(cat)}}></div>
                    {cat} {Math.round((weight/totalDashboardWeight)*100)}%
                </div>
              ))}
            </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm lg:col-span-2 flex flex-col">
            <h3 className="font-black text-neutral-800 mb-10 flex items-center gap-2"><TrendingUp className="w-5 h-5"/> แนวโน้มน้ำหนัก</h3>
            <div className="flex-1 flex items-end justify-between gap-4 border-b pb-4">
                {[80, 40, 100, 60, 90, 30, 70].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className={`w-full rounded-t-2xl transition-all duration-700 ${i === 6 ? 'bg-neutral-900' : 'bg-neutral-100 hover:bg-neutral-200'}`} style={{height: `${h}%`}}></div>
                        <span className="text-[10px] font-bold text-neutral-400">Day {i+1}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#FDFBF7] flex flex-col lg:flex-row font-sans select-none antialiased">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-neutral-100 p-8 shrink-0">
          <div className="flex items-center gap-3 mb-12">
              <Asterisk className="w-8 h-8 animate-spin-slow" />
              <h1 className="text-3xl font-black tracking-tighter">CountGARDEN</h1>
          </div>
          <div className="space-y-3 flex-1">
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
        
        {activeTab === 'record' ? (isRecording ? renderActiveScreen() : renderSetupScreen()) 
         : activeTab === 'history' ? renderHistoryScreen() 
         : activeTab === 'dashboard' ? renderDashboardScreen() 
         : <div className="p-20 text-center font-black opacity-20 text-5xl">Coming Soon</div>}
      </main>

      {/* Mobile Nav */}
      <nav className="lg:hidden flex justify-around items-center h-20 bg-white border-t border-neutral-100 px-4 shrink-0 z-50">
          <MobileNavBtn icon={<Plus />} active={activeTab === 'record'} onClick={()=>setActiveTab('record')} />
          <MobileNavBtn icon={<History />} active={activeTab === 'history'} onClick={()=>setActiveTab('history')} />
          <MobileNavBtn icon={<BarChart2 />} active={activeTab === 'dashboard'} onClick={()=>setActiveTab('dashboard')} />
          <MobileNavBtn icon={<Settings />} active={activeTab === 'settings'} onClick={()=>setActiveTab('settings')} />
      </nav>

      {/* Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-[300] bg-neutral-900/40 backdrop-blur-md flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 animate-in slide-in-from-bottom-20 duration-500 shadow-2xl">
            <h2 className="text-3xl font-black mb-6">ยืนยันการบันทึก <span className="text-purple-500">รอบ {setupData.round}</span></h2>
            <div className="space-y-4 mb-8">
              {groupedRecords.map(g => (
                <div key={g.category} className="flex justify-between items-center border-b pb-2">
                  <span className="font-bold text-neutral-600">{g.category}</span>
                  <span className="font-black text-xl">{g.total} กก.</span>
                </div>
              ))}
              <div className="bg-yellow-100 p-6 rounded-3xl flex justify-between items-center border-2 border-yellow-200">
                <span className="font-black text-neutral-800">ยอดรวมสุทธิ</span>
                <span className="text-4xl font-black text-neutral-900">{grandTotal} กก.</span>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={()=>setShowSummaryModal(false)} className="flex-1 py-4 font-bold bg-neutral-100 rounded-3xl hover:bg-neutral-200">แก้ไข</button>
              <button onClick={handleConfirmRound} className="flex-[2] py-4 font-bold bg-neutral-900 text-white rounded-3xl shadow-xl active:scale-95 transition-all">บันทึกลง Google Sheets</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-xs text-center shadow-2xl">
             <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
             <h3 className="text-xl font-black mb-2">ลบข้อมูล?</h3>
             <p className="text-sm text-neutral-400 mb-8">คุณต้องการลบข้อมูลรอบนี้อย่างถาวรใช่หรือไม่</p>
             <div className="flex gap-3">
               <button onClick={()=>setDeleteConfirmId(null)} className="flex-1 py-3 bg-neutral-100 rounded-2xl font-bold">ยกเลิก</button>
               <button onClick={async ()=>{
                  // Add GAS delete logic here if needed
                  setHistoryRecords(prev => prev.filter(x => x.id !== deleteConfirmId));
                  setDeleteConfirmId(null);
               }} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold">ลบเลย</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components
const NavBtn = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className={`flex items-center gap-4 w-full p-4 rounded-3xl font-black text-lg transition-all ${active ? 'bg-neutral-900 text-white shadow-xl translate-x-1' : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50'}`}>
        {React.cloneElement(icon, { className: "w-6 h-6" })}
        {label}
    </button>
);

const MobileNavBtn = ({ icon, active, onClick }) => (
    <button onClick={onClick} className={`p-4 transition-all ${active ? 'text-neutral-900 scale-125' : 'text-neutral-300'}`}>
        {React.cloneElement(icon, { className: `w-8 h-8 ${active && icon.type === Plus ? 'bg-yellow-300 rounded-full p-1 shadow-md' : ''}` })}
    </button>
);

const StatCard = ({ icon, label, val, unit, color }) => (
    <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm relative overflow-hidden flex flex-col items-start">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{backgroundColor: `${color}20`}}>
            {React.cloneElement(icon, { className: "w-6 h-6 text-neutral-800"})}
        </div>
        <p className="text-[10px] font-black text-neutral-400 tracking-widest uppercase mb-1">{label}</p>
        <div className="text-4xl font-black text-neutral-900">{typeof val === 'number' ? val.toLocaleString() : val} <span className="text-sm font-bold text-neutral-400">{unit}</span></div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-20" style={{backgroundColor: color}}></div>
    </div>
);
