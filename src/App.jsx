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
  Share2,
  Image as ImageIcon,
  MessageSquare,
  Download,
  Copy,
  Monitor,
  RotateCcw
} from 'lucide-react';


// --- Static Default Data ---
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

// Fallback palette for dynamically added categories
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

const GAS_URL = import.meta.env.VITE_GAS_URL;

// --- Utility Functions (Declared globally to avoid initialization errors) ---
const getTodayThaiFormat = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) { }
  return String(dateStr).split('T')[0];
};

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

export default function App() {
  const [showNav, setShowNav] = useState(true);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef(null);

  // Handle Scroll for Auto-Hide Navbar
  const handleScroll = (e) => {
    const currentScrollY = e.target.scrollTop;
    const isScrollingDown = currentScrollY > lastScrollY.current;

    // Threshold to prevent flickering (hide only if scrolled significantly)
    if (Math.abs(currentScrollY - lastScrollY.current) < 10) return;

    if (isScrollingDown && currentScrollY > 100) {
      setShowNav(false);
    } else {
      setShowNav(true);
    }

    lastScrollY.current = currentScrollY;
  };


  // --- Dynamic Master Data (Linked Fruits and Categories) ---
  const [masterData, setMasterData] = useState(() => {
    const local = localStorage.getItem('cg_masterData');
    return local ? JSON.parse(local) : {
      'มะละกอ': ['ยาว', 'แหลม', 'กลม', 'ลาย', 'ตั้งฉ่าย'],
      'มะม่วง': ['น้ำดอกไม้', 'เขียวเสวย', 'ฟ้าลั่น', 'แก้วขมิ้น'],
      'กล้วย': ['หอมทอง', 'น้ำว้า', 'ไข่']
    };
  });

  const fruits = Object.keys(masterData);


  // --- State Management ---
  const [activeTab, setActiveTab] = useState('record');
  const [isRecording, setIsRecording] = useState(false);

  // Farm List
  const [farmList, setFarmList] = useState(() => {
    const local = localStorage.getItem('cg_farmList');
    return local ? JSON.parse(local) : ['สวนคุณวิรัช'];
  });

  const [setupData, setSetupData] = useState({
    date: getTodayThaiFormat(),
    round: 1,
    fruit: fruits[0] || '',
    farmName: (() => { const local = localStorage.getItem('cg_farmList'); const list = local ? JSON.parse(local) : ['สวนคุณวิรัช']; return list[0] || 'สวนของฉัน'; })()
  });

  // Categories specific to the currently selected fruit
  const currentCategories = masterData[setupData.fruit] || [];

  const [activeCategory, setActiveCategory] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [records, setRecords] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [expandedCats, setExpandedCats] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [historyRecords, setHistoryRecords] = useState(() => {
    const local = localStorage.getItem('cg_historyRecords');
    return local ? JSON.parse(local) : [];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list');
  
  // Master Billing Selection States
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRounds, setSelectedRounds] = useState([]);
  const [isGeneratingMasterBill, setIsGeneratingMasterBill] = useState(false);
  const [showMasterBillModal, setShowMasterBillModal] = useState(false);
  const [masterBillSuccess, setMasterBillSuccess] = useState(false); // Show success+share view
  const [filterDate, setFilterDate] = useState(''); // Added missing filterDate state
  const [expandedHistory, setExpandedHistory] = useState([]);

  // GAS Loading State
  const [gasLoading, setGasLoading] = useState(false);

  // Sync Queue State
  const [syncQueue, setSyncQueue] = useState(() => {
    const local = localStorage.getItem('cg_syncQueue');
    return local ? JSON.parse(local) : [];
  });

  const roundScrollRef = useRef(null);

  // Dashboard State
  const [dashboardRange, setDashboardRange] = useState('daily');
  const [dashboardDate, setDashboardDate] = useState(getTodayThaiFormat());
  const [dashboardFruitFilter, setDashboardFruitFilter] = useState('All');

  // Settings State 
  const [settingsActiveFruit, setSettingsActiveFruit] = useState(fruits[0] || '');
  const [newFruit, setNewFruit] = useState('');
  const [newCat, setNewCat] = useState('');

  // Sharing State
  const [shareModalRecord, setShareModalRecord] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = sessionStorage.getItem('cg_install_dismissed');
      if (!dismissed) setShowInstallBanner(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // iOS support: Show banner regardless since beforeinstallprompt isn't supported
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const dismissed = sessionStorage.getItem('cg_install_dismissed');
    if (isIOS && !dismissed) {
      setShowInstallBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Logic for iOS (Manual instruction)
      alert('📌 สำหรับ iPhone: ให้กดปุ่ม "แชร์" (Share) แล้วเลือก "เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen) นะค๊าา 😊');
      setShowInstallBanner(false);
      sessionStorage.setItem('cg_install_dismissed', 'true');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };


  // Show Toast
  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };

  // Safeguard: Ensure settingsActiveFruit is always valid
  useEffect(() => {
    if (fruits.length > 0 && !fruits.includes(settingsActiveFruit)) {
      setSettingsActiveFruit(fruits[0]);
    }
  }, [fruits, settingsActiveFruit]);
  // Safeguard: Ensure setupData.farmName is always valid relative to farmList
  useEffect(() => {
    if (farmList.length > 0) {
      if (!farmList.includes(setupData.farmName)) {
        setSetupData(prev => ({ ...prev, farmName: farmList[0] }));
      }
    }
  }, [farmList]);

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem('cg_masterData', JSON.stringify(masterData));
  }, [masterData]);

  useEffect(() => {
    localStorage.setItem('cg_historyRecords', JSON.stringify(historyRecords));
  }, [historyRecords]);

  useEffect(() => {
    localStorage.setItem('cg_syncQueue', JSON.stringify(syncQueue));
  }, [syncQueue]);

  useEffect(() => {
    localStorage.setItem('cg_farmList', JSON.stringify(farmList));
  }, [farmList]);

  // Sync Queue Processor
  const processSyncQueue = async () => {
    if (syncQueue.length === 0 || !navigator.onLine || !GAS_URL) return;

    const queue = [...syncQueue];
    setSyncQueue([]); // Optimistically clear

    for (const item of queue) {
      try {
        await fetch(GAS_URL, {
          method: 'POST',
          body: JSON.stringify(item)
        });
      } catch (e) {
        console.error('Failed to sync item, putting back in queue', e);
        setSyncQueue(prev => [...prev, item]);
      }
    }
    loadGASData();
  };

  useEffect(() => {
    if (syncQueue.length > 0 && navigator.onLine) {
      processSyncQueue();
    }
    window.addEventListener('online', processSyncQueue);
    return () => window.removeEventListener('online', processSyncQueue);
  }, [syncQueue]);

  // GAS Data Fetching
  useEffect(() => { loadGASData(); }, []);

  // Sync when window gains focus (Focus Sync)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadGASData();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', loadGASData);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', loadGASData);
    };
  }, []);

  // Auto-scroll Round Picker into view
  useEffect(() => {
    if (roundScrollRef.current && activeTab === 'record' && !isRecording) {
      const selectedBtn = roundScrollRef.current.querySelector('[data-selected="true"]');
      if (selectedBtn) {
        selectedBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [setupData.round, activeTab, isRecording]);

  const loadGASData = async () => {
    if (!GAS_URL) return;
    setGasLoading(true);
    try {
      const [mRes, hRes] = await Promise.all([
        fetch(`${GAS_URL}?action=getMasterData`),
        fetch(`${GAS_URL}?action=getHistory`)
      ]);
      const mData = await mRes.json();
      const hData = await hRes.json();
      if (!mData.error) {
        // If backend returns new format { masterData, farms }
        const actualMaster = mData.masterData || mData;
        const actualFarms = mData.farms || [];

        setMasterData(actualMaster);
        
        if (actualFarms.length > 0) {
          // Sync with cloud: Overwrite local list with cloud data
          setFarmList(actualFarms);
          localStorage.setItem('cg_farmList', JSON.stringify(actualFarms));
          
          // Force select the first cloud farm if current one is invalid
          if (!actualFarms.includes(setupData.farmName)) {
            setSetupData(prev => ({ ...prev, farmName: actualFarms[0] }));
          }
        }

        const firstFruit = Object.keys(actualMaster)[0];
        if (firstFruit) {
          setSetupData(prev => ({ ...prev, fruit: firstFruit }));
          setSettingsActiveFruit(firstFruit);
        }
      }
      if (Array.isArray(hData)) setHistoryRecords(hData);
    } catch (e) { console.error('GAS fetch failed', e); }
    finally { setGasLoading(false); }
  };

  // --- Derived State ---
  const grandTotal = records.reduce((sum, record) => sum + record.weight, 0);
  const getCategoryTotal = (category) => records.filter(r => r.category === category).reduce((sum, r) => sum + r.weight, 0);

  const groupedRecords = currentCategories.map(cat => ({
    category: cat,
    items: records.filter(r => r.category === cat),
    total: getCategoryTotal(cat)
  })).filter(g => g.items.length > 0);

  const filteredHistory = historyRecords.filter(record => {
    // 1. Check Date Filter (Calendar)
    const matchesDate = !filterDate || record.date.startsWith(filterDate);

    // 2. Check Search Term (Text)
    const displayDate = formatDisplayDate(record.date);
    const matchesSearch = !searchTerm || (
      displayDate.includes(searchTerm) ||
      record.round.toString().includes(searchTerm) ||
      record.fruit.includes(searchTerm) ||
      (record.farmName || '').includes(searchTerm)
    );

    return matchesDate && matchesSearch;
  });

  // --- Handlers ---
  const handleStartRound = () => { setIsRecording(true); setActiveCategory(''); setErrorMsg(''); };
  const handleEditSetup = () => { setIsRecording(false); };

  const handleSetupDateChange = (e) => {
    if (!e.target.value) return;
    const dateObj = new Date(e.target.value);
    if (!isNaN(dateObj)) {
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      setSetupData(prev => ({ ...prev, date: `${day}/${month}/${year}` }));
    }
  };

  const handleNumpadClick = (val) => {
    setErrorMsg('');
    if (!activeCategory) { setErrorMsg('กรุณาเลือกประเภทก่อนระบุน้ำหนัก'); setTimeout(() => setErrorMsg(''), 2000); return; }
    if (val === 'BACKSPACE') setInputValue(prev => prev.slice(0, -1));
    else if (val === '.') { if (!inputValue.includes('.')) setInputValue(prev => prev ? prev + '.' : '0.'); }
    else if (inputValue.length < 6) setInputValue(prev => prev + val);
  };

  const handleEnter = () => {
    if (!activeCategory || !inputValue || parseFloat(inputValue) <= 0) return;
    const newRecord = { id: Date.now().toString() + Math.random(), category: activeCategory, weight: parseFloat(inputValue), timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) };
    setRecords(prev => [newRecord, ...prev]);
    setInputValue('');
  };

  const handleDeleteLast = () => { if (records.length > 0) setRecords(prev => prev.slice(1)); };
  const handleDeleteRecord = (id) => setRecords(prev => prev.filter(r => r.id !== id));

  const handleEditHistory = (recordToEdit) => {
    let flatRecords = [];
    recordToEdit.details.forEach(detail => { 
      detail.items.forEach((itemWeight, idx) => { 
        flatRecords.push({ 
          id: `edit-${Date.now()}-${idx}-${Math.random()}`, 
          category: detail.category, 
          weight: itemWeight, 
          timestamp: recordToEdit.timestamp 
        }); 
      }); 
    });
    setSetupData({ date: recordToEdit.date, round: recordToEdit.round, fruit: recordToEdit.fruit, farmName: recordToEdit.farmName || '' });
    setRecords(flatRecords.reverse()); // Reverse back to Latest -> First for Recording UI
    setEditingId(recordToEdit.id); setActiveTab('record'); setIsRecording(true); setExpandedHistory([]);
  };

  const handleCancelEdit = () => {
    setEditingId(null); setIsRecording(false); setRecords([]); setActiveTab('history');
    const maxRound = Math.max(...historyRecords.map(r => typeof r.round === 'number' ? r.round : 0), 0);
    setSetupData(prev => ({ ...prev, round: maxRound + 1, date: getTodayThaiFormat() }));
  };

  const handleOpenSummary = () => { setExpandedCats(groupedRecords.map(g => g.category)); setShowSummaryModal(true); };

  const handleConfirmRound = async () => {
    const historyEntry = {
      id: editingId || Date.now().toString(), date: setupData.date, round: setupData.round, fruit: setupData.fruit, farmName: setupData.farmName, totalWeight: grandTotal,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      details: groupedRecords.map(g => ({ 
        category: g.category, 
        total: g.total, 
        count: g.items.length, 
        items: g.items.map(item => item.weight).reverse() // Store as First -> Last
      }))
    };

    if (editingId) { setHistoryRecords(prev => prev.map(r => r.id === editingId ? historyEntry : r)); setEditingId(null); }
    else { setHistoryRecords(prev => [historyEntry, ...prev]); }

    setShowSummaryModal(false); setIsRecording(false); setRecords([]); setActiveCategory(''); setInputValue('');
    const nextRound = editingId ? Math.max(...historyRecords.map(r => typeof r.round === 'number' ? r.round : 0), 0) + 1 : setupData.round + 1;
    setSetupData(prev => ({ ...prev, round: nextRound, date: getTodayThaiFormat() }));

    setShareModalRecord(historyEntry);

    // Save to GAS
    if (GAS_URL && !editingId) {
      const payload = {
        action: 'saveRecord',
        payload: {
          date: historyEntry.date, round: historyEntry.round, fruit: historyEntry.fruit,
          totalWeight: historyEntry.totalWeight,
          items: groupedRecords.flatMap(g => g.items.map(item => ({ category: g.category, weight: item.weight })))
        }
      };

      try {
        const response = await fetch(GAS_URL, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Fetch failed');
        loadGASData();
      } catch (e) {
        console.error('GAS save failed, adding to sync queue', e);
        setSyncQueue(prev => [...prev, payload]);
      }
    }
  };


  // --- Sharing Handlers ---
  const handleShareText = (record) => {
    const data = record || {
      date: setupData.date,
      round: setupData.round,
      fruit: setupData.fruit,
      farmName: setupData.farmName,
      totalWeight: grandTotal,
      details: groupedRecords.map(g => ({ 
        category: g.category, 
        total: g.total, 
        items: g.items.map(item => item.weight).reverse() // Sequence as First -> Last
      }))
    };

    let text = `🧾 สลิปชั่งน้ำหนัก: ${data.fruit}\n`;
    text += `สวน: ${data.farmName || setupData.farmName}\n`;
    text += `📅 วันที่: ${formatDisplayDate(data.date)} (รอบที่ ${data.round})\n\n`;
    text += `-------------------------\n`;

    data.details.forEach(d => {
      text += `✅ ${d.category}: ${d.total.toLocaleString()} กก.\n`;
      text += `(${d.items.join(', ')})\n\n`;
    });

    text += `-------------------------\n`;
    text += `💰 ยอดรวมสุทธิ: ${data.totalWeight.toLocaleString()} กก.\n`;


    if (navigator.share) {
      navigator.share({ text: text }).catch(e => console.error('Share failed', e));
    } else {
      navigator.clipboard.writeText(text).then(() => showToast('คัดลอกข้อความสำเร็จ!')).catch(() => showToast('ไม่สามารถคัดลอกได้'));
    }
  };

  const handleShareImage = async (record) => {
    const data = record || {
      date: setupData.date,
      round: setupData.round,
      fruit: setupData.fruit,
      farmName: setupData.farmName,
      totalWeight: grandTotal,
      details: groupedRecords.map(g => ({ 
        category: g.category, 
        total: g.total, 
        items: g.items.map(item => item.weight).reverse() // Sequence as First -> Last
      }))
    };

    const currentFarmName = data.farmName || setupData.farmName;
    setIsGeneratingImg(true);

    try {
      const SCALE = 2;
      const W = 420;
      const PADDING = 32;
      const CONTENT_W = W - PADDING * 2;

      // Calculate card heights for each category
      const cardHeights = data.details.map(d => {
        const itemsText = d.items.join(', ');
        const charsPerLine = 38;
        const itemLines = Math.ceil(itemsText.length / charsPerLine) || 1;
        return 60 + itemLines * 18 + 16; // header + item lines + padding
      });
      const totalCardsH = cardHeights.reduce((a, b) => a + b + 12, 0); // 12px gap between cards

      // Total canvas height:  header(180) + cards + totalBar(80) + footer(60) + padding
      const H = 200 + totalCardsH + 100 + 70 + PADDING * 2;

      const canvas = document.createElement('canvas');
      canvas.width = W * SCALE;
      canvas.height = H * SCALE;
      const ctx = canvas.getContext('2d');
      ctx.scale(SCALE, SCALE);

      // --- Background ---
      ctx.fillStyle = '#FDFBF7';
      ctx.fillRect(0, 0, W, H);

      // Subtle border
      ctx.strokeStyle = '#E5E5E5';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

      let y = PADDING;

      // --- Logo Circle ---
      const logoSize = 48;
      ctx.fillStyle = '#1A1A1A';
      ctx.beginPath(); ctx.arc(W / 2, y + logoSize / 2, logoSize / 2, 0, Math.PI * 2); ctx.fill();
      // Asterisk inside circle
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('✻', W / 2, y + logoSize / 2 + 8);
      y += logoSize + 32; // เพิ่มระยะห่างจาก 16 เป็น 32

      // --- Farm Name ---
      ctx.fillStyle = '#1A1A1A';
      ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(currentFarmName, W / 2, y);
      y += 24;

      // --- Subtitle ---
      ctx.fillStyle = '#888888';
      ctx.font = '13px sans-serif';
      ctx.fillText(`บิลชั่งน้ำหนัก ${data.fruit}`, W / 2, y);
      y += 18;

      // --- Date / Time / Round ---
      ctx.fillStyle = '#AAAAAA';
      ctx.font = '11px sans-serif';
      ctx.fillText(`${formatDisplayDate(data.date)} • ${data.timestamp || ''} • รอบที่ ${data.round}`, W / 2, y);
      y += 28;

      // --- Dashed Line ---
      ctx.strokeStyle = '#D4D4D4'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(PADDING, y); ctx.lineTo(W - PADDING, y); ctx.stroke();
      ctx.setLineDash([]);
      y += 20;

      // --- Category Cards ---
      const ACCENTS = ['#4ADE80', '#C084FC', '#FDE047', '#93C5FD', '#F9A8D4', '#FCA5A5'];
      data.details.forEach((d, i) => {
        const catHex = getCategoryHex(d.category) || ACCENTS[i % ACCENTS.length];
        const itemsText = d.items.join(', ');
        const charsPerLine = 38;
        const itemLines = Math.ceil(itemsText.length / charsPerLine) || 1;
        const cardH = 60 + itemLines * 18 + 16;

        // Card background
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.roundRect(PADDING, y, CONTENT_W, cardH, 16); ctx.fill();
        // Card border
        ctx.strokeStyle = '#F0F0F0'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(PADDING, y, CONTENT_W, cardH, 16); ctx.stroke();

        // Color dot
        ctx.fillStyle = catHex;
        ctx.beginPath(); ctx.arc(PADDING + 20, y + 28, 6, 0, Math.PI * 2); ctx.fill();

        // Category name
        ctx.fillStyle = '#1A1A1A'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(d.category, PADDING + 34, y + 33);

        // Weight (right side)
        ctx.fillStyle = '#1A1A1A'; ctx.font = 'black 20px sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(d.total.toLocaleString(), W - PADDING - 40, y + 33);
        ctx.fillStyle = '#888888'; ctx.font = '12px sans-serif';
        ctx.fillText('กก.', W - PADDING - 12, y + 33);

        // Items text
        ctx.fillStyle = '#777777'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
        const words = itemsText;
        let startIdx = 0;
        let lineY = y + 56;
        while (startIdx < words.length) {
          const lineText = words.substring(startIdx, startIdx + charsPerLine);
          ctx.fillText(lineText, PADDING + 16, lineY);
          lineY += 18;
          startIdx += charsPerLine;
        }

        y += cardH + 12;
      });

      y += 4;

      // --- Total Bar ---
      const totalBarH = 72;
      ctx.fillStyle = '#1A1A1A';
      ctx.beginPath(); ctx.roundRect(PADDING, y, CONTENT_W, totalBarH, 16); ctx.fill();

      // "ยอดรวมสุทธิ" label
      ctx.fillStyle = '#999999'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('ยอดรวมสุทธิ', PADDING + 20, y + 30);

      // Total weight (yellow, right)
      ctx.fillStyle = '#FDE047'; ctx.font = 'bold 32px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(data.totalWeight.toLocaleString(), W - PADDING - 48, y + 48);
      ctx.fillStyle = '#999999'; ctx.font = 'bold 14px sans-serif';
      ctx.fillText('กก.', W - PADDING - 14, y + 48);
      y += totalBarH + 20;

      // --- Footer ---
      ctx.fillStyle = '#AAAAAA'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('ขอบคุณที่ใช้บริการ', W / 2, y);
      y += 16;
      ctx.fillStyle = '#CCCCCC'; ctx.font = '9px sans-serif';
      ctx.fillText('บันทึกโดย AgriWeigh', W / 2, y);

      const dataUrl = canvas.toDataURL('image/png');

      if (navigator.share && navigator.canShare) {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `receipt-${data.fruit}-round${data.round}.png`, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ 
            files: [file], 
            title: `ใบเสร็จ ${currentFarmName}`,
            text: `🧾 ใบเสร็จชั่งน้ำหนัก ${data.fruit} - ${currentFarmName} (${formatDisplayDate(data.date)})`
          });
        } else { downloadImage(dataUrl); }
      } else { downloadImage(dataUrl); }
      showToast('สร้างใบเสร็จสำเร็จ!');
    } catch (e) {
      console.error('Canvas image generation failed', e);
      showToast('เกิดข้อผิดพลาดในการสร้างรูปภาพ');
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const downloadImage = (dataUrl) => {
    const link = document.createElement('a');
    link.download = `CountGarden_Report_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const toggleCatExpand = (cat) => setExpandedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  const toggleHistoryExpand = (id) => setExpandedHistory(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleHistorySearchDateChange = (e) => {
    if (!e.target.value) return;
    setFilterDate(e.target.value); // Set raw YYYY-MM-DD for precise matching
  };

  const clearDateFilter = () => setFilterDate('');

  const toggleSelection = (id) => {
    setSelectedRounds(prev => prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]);
  };

  // --- Render Screens ---
  const renderSetupScreen = () => (
    <div className="flex-1 flex flex-col p-4 bg-[#FDFBF7] justify-center items-center min-h-full w-full relative overflow-y-auto lg:overflow-hidden pb-24 lg:pb-4">
      <Asterisk className="absolute top-6 left-6 w-10 h-10 text-[#C084FC] opacity-40 animate-spin-slow" />
      <Sparkles className="absolute bottom-16 right-6 w-8 h-8 text-[#FDE047] opacity-60" />
      <div className="absolute top-1/4 right-0 w-48 h-48 bg-[#4ADE80] rounded-full blur-[80px] opacity-20"></div>

      <div className="bg-white p-6 lg:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100 w-full max-w-sm lg:max-w-md transition-all relative z-10">
        <div className="flex justify-between items-start mb-6 lg:mb-8">
          <div className="flex-1"></div>
          <h2 className="text-3xl lg:text-4xl font-black text-neutral-900 text-center tracking-tight flex-1">
            {editingId ? (
              <span className="flex flex-col items-center">
                <span className="text-amber-500 text-xs font-black uppercase tracking-[0.2em] mb-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100 flex items-center gap-1.5 animate-pulse">
                  <AlertCircle className="w-3 h-3" /> Modifying Existing
                </span>
                Edit Setup <br /><span className="text-amber-500 font-sans font-bold text-2xl">แก้ไขข้อมูลเดิม</span>
              </span>
            ) : (
              <>Start now <br /><span className="text-[#4ADE80] font-sans font-bold text-2xl">Recording</span></>
            )}
          </h2>
          <div className="flex-1 flex justify-end">
            <button 
              onClick={loadGASData} 
              disabled={gasLoading}
              className={`p-2 rounded-full transition-all ${gasLoading ? 'animate-spin text-[#4ADE80] bg-green-50' : 'text-neutral-400 hover:text-[#4ADE80] hover:bg-green-50 active:scale-90'}`}
              title="รีเฟรชข้อมูล"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {/* Farm Selection */}
          <div className="relative">
            <label className="block text-xs font-semibold text-neutral-500 mb-1.5 ml-2 uppercase tracking-widest">สวน (Farm)</label>
            <select
              value={setupData.farmName}
              onChange={(e) => setSetupData(prev => ({ ...prev, farmName: e.target.value }))}
              className="w-full bg-white border-2 border-neutral-200 text-neutral-800 p-3.5 pl-6 pr-10 rounded-full font-bold text-sm appearance-none hover:border-neutral-300 transition-colors focus:outline-none focus:border-neutral-900 shadow-sm cursor-pointer"
            >
              {farmList.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-4 top-[38px] pointer-events-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-500 mb-1.5 ml-2">วันที่ (Date)</label>
            <div className="w-full bg-neutral-50 hover:bg-neutral-100 transition-colors text-neutral-800 p-3.5 rounded-full font-medium text-sm border border-neutral-100 flex items-center justify-center gap-2 relative overflow-hidden cursor-pointer shadow-sm">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <span>{formatDisplayDate(setupData.date)}</span>
              <input type="date" onClick={(e) => { try { if (e.target.showPicker) e.target.showPicker(); } catch (err) { } }} onChange={handleSetupDateChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-2 ml-2 uppercase tracking-widest">รอบ (Round)</label>
              <div className="relative group">
                {/* Horizontal Fade Edges */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

                <div
                  ref={roundScrollRef}
                  className="flex gap-2.5 overflow-x-auto hide-scrollbar py-2 px-8 snap-x snap-mandatory"
                >
                  {[...Array(50)].map((_, i) => {
                    const r = i + 1;
                    const isSelected = setupData.round === r;
                    return (
                      <button
                        key={r}
                        data-selected={isSelected}
                        onClick={() => setSetupData(prev => ({ ...prev, round: r }))}
                        className={`shrink-0 w-12 h-12 rounded-2xl font-black text-sm flex items-center justify-center transition-all snap-center
                          ${isSelected
                            ? 'bg-[#FDE047] text-neutral-900 shadow-[0_4px_12px_rgba(253,224,71,0.4)] scale-110'
                            : 'bg-neutral-50 text-neutral-400 border border-neutral-100 hover:bg-neutral-100 hover:text-neutral-600'}`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold text-neutral-500 mb-1.5 ml-2 uppercase tracking-widest">ผลไม้ (Fruit)</label>
              <select
                value={setupData.fruit}
                onChange={(e) => {
                  setSetupData(prev => ({ ...prev, fruit: e.target.value }));
                  setActiveCategory(''); // ล้างประเภทเมื่อเปลี่ยนผลไม้
                }}
                className="w-full bg-white border-2 border-neutral-200 text-neutral-800 p-4 pl-6 pr-10 rounded-2xl font-bold text-base appearance-none hover:border-neutral-300 transition-colors focus:outline-none focus:border-neutral-900 shadow-sm cursor-pointer"
              >
                {fruits.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <ChevronDown className="w-5 h-5 text-neutral-400 absolute right-4 top-[42px] pointer-events-none" />
            </div>
          </div>
        </div>

        <button onClick={handleStartRound} className={`w-full ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-neutral-900 hover:bg-neutral-800'} text-white font-bold text-lg py-4 rounded-full shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wide`}>
          {editingId ? 'Continue Editing' : 'Get started'} <ChevronDown className="w-4 h-4 -rotate-90" />
        </button>
        {editingId && (
          <button onClick={handleCancelEdit} className="w-full mt-4 text-neutral-400 hover:text-red-500 font-bold text-xs uppercase tracking-widest transition-colors">
            Cancel & Exit Edit Mode
          </button>
        )}
      </div>
    </div>
  );

  const renderActiveScreen = () => (
    <div className="flex-1 flex flex-col bg-[#FDFBF7] min-h-full w-full lg:overflow-hidden lg:pb-0">

      <div className={`p-3 lg:px-6 lg:py-4 flex flex-wrap justify-between items-center z-20 shrink-0 gap-3 w-full transition-colors border-b ${editingId ? 'bg-amber-50 border-amber-100' : 'bg-[#FDFBF7] border-transparent'}`}>
        <div className="flex flex-wrap items-center gap-2 text-neutral-600 font-medium flex-1">
          <button onClick={handleEditSetup} className={`bg-white border ${editingId ? 'border-amber-200 text-amber-600 bg-amber-50/50' : 'border-neutral-200'} px-3 py-1.5 rounded-full text-[11px] lg:text-xs font-bold shadow-sm flex items-center gap-1.5 hover:bg-neutral-50 shrink-0 transition-colors`}>
            <Edit2 className={`w-3 h-3 ${editingId ? 'text-amber-500' : 'text-neutral-400'}`} /> 
            {editingId ? `แก้หัวข้อรอบ ${setupData.round}` : formatDisplayDate(setupData.date)}
          </button>
          <div className={`${editingId ? 'bg-amber-400' : 'bg-[#4ADE80]'} text-neutral-900 px-3 py-1.5 rounded-full text-[11px] lg:text-xs font-bold shadow-sm shrink-0`}>
            {editingId ? 'โหมดแก้ไข' : `รอบ ${setupData.round}`}
          </div>
          <div className="bg-[#C084FC] text-white px-3 py-1.5 rounded-full text-[11px] lg:text-xs font-bold shadow-sm shrink-0">{setupData.fruit}</div>
          {editingId && (
            <button onClick={handleCancelEdit} className="bg-white border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-full text-[11px] lg:text-xs font-bold shadow-sm shrink-0 transition-colors">ยกเลิก</button>
          )}
        </div>
        <button onClick={handleOpenSummary} disabled={records.length === 0} className="flex items-center justify-center px-4 py-2 bg-neutral-900 text-[#FDE047] disabled:bg-neutral-200 disabled:text-neutral-400 font-bold rounded-full transition-all shadow-md text-[11px] lg:text-xs gap-1.5 active:scale-95 shrink-0 ml-auto uppercase tracking-wide">
          <ListChecks className="w-4 h-4" /> สรุปรอบ
        </button>
      </div>

      <div className="px-3 py-1.5 lg:px-6 z-10">
        <div className="bg-[#FDE047] rounded-3xl p-4 lg:p-6 flex flex-col md:flex-row md:items-center md:justify-between shadow-sm relative overflow-hidden">
          <Asterisk className="absolute -right-2 -top-2 w-16 h-16 text-black opacity-5" />
          <div>
            <h3 className="font-extrabold tracking-tight text-xl lg:text-2xl text-neutral-800 mb-0.5 uppercase">Total Weight</h3>
            <p className="text-neutral-700 font-medium text-[11px] lg:text-xs">ยอดรวมสุทธิของรอบนี้</p>
          </div>
          <div className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 mt-2 md:mt-0">
            {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} <span className="text-lg lg:text-xl font-bold text-neutral-700 ml-1">กก.</span>
          </div>
        </div>
      </div>

      <div className="py-1.5 lg:py-3 w-full shrink-0 overflow-hidden flex items-center z-10">
        <div className="flex overflow-x-auto hide-scrollbar px-3 lg:px-6 gap-2 pb-1.5 w-full">
          {/* Loop over categories associated with the current fruit */}
          {currentCategories.length === 0 ? (
            <div className="text-sm font-medium text-neutral-400 py-2">ไม่พบประเภทของผลไม้นี้ กรุณาเพิ่มในตั้งค่า</div>
          ) : currentCategories.map(cat => {
            const isActive = activeCategory === cat;
            const subtotal = getCategoryTotal(cat);
            const colorClass = isActive ? getCategoryColorClass(cat) : INACTIVE_COLOR;
            return (
              <button key={cat} onClick={() => { setActiveCategory(cat); setErrorMsg(''); }} className={`flex flex-col min-w-[85px] lg:min-w-[100px] items-start py-2.5 px-3.5 rounded-[1.25rem] border-2 transition-all shrink-0 text-left ${colorClass} ${isActive ? 'shadow-md lg:scale-105' : 'hover:border-neutral-300 hover:bg-neutral-50'}`}>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1.5 ${isActive ? 'bg-white/30 backdrop-blur-sm text-neutral-900' : 'bg-neutral-100 text-neutral-500'}`}>{subtotal > 0 ? subtotal.toLocaleString() : '0'} กก.</span>
                <span className="text-lg lg:text-xl font-bold tracking-tight">{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row bg-white rounded-3xl lg:rounded-t-3xl shadow-[0_-5px_20px_rgb(0,0,0,0.02)] border border-neutral-100 mx-2 lg:mx-4 mb-2 mt-1 lg:flex-1 lg:overflow-hidden">

        <div className="flex flex-col p-3 lg:p-6 md:border-r border-neutral-100 transition-all duration-300 h-[260px] md:h-[320px] lg:h-auto lg:flex-1">
          <div className="flex justify-between items-center mb-2 shrink-0">
            <h3 className="text-base lg:text-xl font-extrabold tracking-tight text-neutral-800">Recent Activity</h3>
            <button onClick={handleDeleteLast} disabled={records.length === 0} className="flex items-center gap-1 text-[10px] lg:text-xs font-bold text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-full hover:bg-neutral-200 active:bg-neutral-300 disabled:opacity-40 transition-colors"><Undo2 className="w-3 h-3" /> Undo</button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 pb-2 hide-scrollbar">
            {records.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-300">
                <div className="w-10 h-10 bg-neutral-50 rounded-full flex items-center justify-center mb-2"><Leaf className="w-5 h-5 text-neutral-300" /></div>
                <p className="text-xs font-medium text-neutral-400">ยังไม่มีรายการ</p>
              </div>
            ) : (
              records.map((record) => {
                const bgColorOnly = getCategoryColorClass(record.category).split(' ')[0];
                return (
                  <div key={record.id} className="group bg-white p-2 lg:p-4 rounded-xl flex justify-between items-center border border-neutral-100 hover:border-neutral-200 hover:shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full ${bgColorOnly} flex items-center justify-center text-white font-bold text-xs lg:text-sm`}>{record.category.charAt(0)}</div>
                      <div><div className="font-bold text-neutral-900 text-xs lg:text-base">{record.category}</div><div className="text-[9px] lg:text-xs text-neutral-400 font-medium">{record.timestamp}</div></div>
                    </div>
                    <div className="flex items-center gap-2 lg:gap-4">
                      <div className="flex items-baseline gap-1"><span className="text-lg lg:text-2xl font-black text-neutral-800 tracking-tight">{record.weight}</span><span className="text-neutral-400 text-[9px] lg:text-xs font-medium">กก.</span></div>
                      <button onClick={() => handleDeleteRecord(record.id)} className="text-red-400 bg-red-50 hover:text-red-600 hover:bg-red-100 w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center rounded-full transition-colors active:scale-95"><Trash2 className="w-3 h-3 lg:w-3.5 lg:h-3.5" /></button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="shrink-0 lg:flex-1 xl:w-[420px] xl:flex-none p-3 pb-28 lg:p-6 lg:pb-6 bg-[#FDFBF7] flex flex-col gap-3 rounded-b-3xl lg:rounded-none lg:rounded-br-3xl relative z-20">
          <div className="relative w-full">
            <div className={`bg-white rounded-2xl p-4 shadow-sm border-2 flex items-center justify-between min-h-[60px] lg:min-h-[70px] transition-colors ${activeCategory ? 'border-neutral-900' : 'border-neutral-200'}`}>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Current</span>
                <span className={`text-lg lg:text-xl font-bold tracking-tight ${activeCategory ? 'text-neutral-900' : 'text-neutral-300'}`}>{activeCategory || 'Select type'}</span>
              </div>
              <div className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 flex items-center">{inputValue || <span className="text-neutral-200 font-sans">0</span>}</div>
            </div>
            {errorMsg && (
              <div className="absolute inset-0 bg-neutral-900 text-white text-xs lg:text-sm font-bold rounded-2xl flex items-center justify-center shadow-xl animate-in zoom-in-95 duration-200 z-50">
                <AlertCircle className="w-4 h-4 text-[#FDE047] mr-2" /> {errorMsg}
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 h-full min-h-[220px] lg:min-h-[260px]">
            <div className="col-span-3 grid grid-cols-3 gap-2">
              {['7', '8', '9', '4', '5', '6', '1', '2', '3', '00', '0', '.'].map((btn) => (
                <button key={btn} onClick={() => handleNumpadClick(btn)} className="bg-white rounded-xl shadow-[0_2px_8px_rgb(0,0,0,0.02)] hover:shadow-md text-2xl lg:text-3xl font-bold text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100 active:scale-95 transition-all flex items-center justify-center py-2 lg:py-0 border border-neutral-100">{btn}</button>
              ))}
            </div>
            <div className="col-span-1 flex flex-col gap-2">
              <button onClick={() => handleNumpadClick('BACKSPACE')} className="bg-neutral-100 hover:bg-neutral-200 rounded-xl text-neutral-600 flex items-center justify-center flex-1 active:scale-95 transition-all"><Delete className="w-6 h-6 lg:w-7 lg:h-7" /></button>
              <button onClick={handleEnter} disabled={!activeCategory || !inputValue} className="bg-neutral-900 hover:bg-black disabled:bg-neutral-200 disabled:text-neutral-400 text-white rounded-xl flex flex-col items-center justify-center flex-[2] active:scale-95 transition-all shadow-lg disabled:shadow-none"><span className="text-lg lg:text-xl font-bold tracking-wide uppercase">Enter</span></button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  const renderSummaryModal = () => (
    <div className="fixed inset-0 z-[100] bg-neutral-900/60 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4">
      <div className="bg-[#FDFBF7] w-full max-w-lg rounded-t-[2rem] md:rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 fade-in duration-300">

        <div className="p-4 md:p-6 border-b border-neutral-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl lg:text-2xl font-extrabold tracking-tight text-neutral-900 flex items-center gap-2">{editingId ? 'บันทึกการแก้ไขรอบที่' : 'สรุปรอบที่'} {setupData.round}</h2>
            <p className="text-neutral-500 text-xs mt-1 flex items-center gap-2"><span className="bg-white border border-neutral-200 px-2 py-0.5 rounded-md font-medium">{formatDisplayDate(setupData.date)}</span><span className="font-semibold text-neutral-700">{setupData.fruit}</span></p>
          </div>
          <div className={`w-10 h-10 ${editingId ? 'bg-amber-300' : 'bg-[#4ADE80]'} rounded-full flex items-center justify-center shadow-sm`}>
            {editingId ? <Edit2 className="w-5 h-5 text-neutral-900" /> : <CheckCircle className="w-5 h-5 text-neutral-900" />}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-2.5">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-2 mb-1.5">แยกตามประเภท (Categories)</p>
          {groupedRecords.map(group => {
            const bgColorClass = getCategoryColorClass(group.category).split(' ')[0];
            const isExpanded = expandedCats.includes(group.category);

            return (
              <div key={group.category} className="bg-white border border-neutral-100 rounded-xl overflow-hidden shadow-sm transition-all">
                <div onClick={() => toggleCatExpand(group.category)} className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-8 rounded-full ${bgColorClass}`}></div>
                    <div className="text-left">
                      <div className="font-bold text-neutral-900 text-base">{group.category}</div>
                      <div className="text-[10px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full inline-block mt-0.5">{group.items.length} รายการ</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="text-lg font-black tracking-tight text-neutral-800">{group.total.toLocaleString()} <span className="text-[10px] font-medium text-neutral-400">กก.</span></div>
                    <div className={`w-7 h-7 rounded-full bg-neutral-50 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180 bg-neutral-100' : ''}`}><ChevronDown className="w-3.5 h-3.5 text-neutral-500" /></div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-3 pb-4 pt-1 bg-neutral-50 border-t border-neutral-100">
                    <p className="text-[10px] text-neutral-400 font-medium mb-1.5">รายละเอียดน้ำหนักแต่ละรายการ:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[...group.items].reverse().map((item, index) => (
                        <span key={item.id} className="bg-white border border-neutral-200 px-2.5 py-1 rounded-full text-xs font-bold text-neutral-700 shadow-sm flex items-center gap-1">
                          <span className="text-[9px] text-neutral-300 font-normal">{index + 1}.</span> {item.weight}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="p-4 md:p-6 bg-white border-t border-neutral-100 rounded-t-[2rem] md:rounded-b-[2rem] shrink-0 shadow-[0_-10px_20px_rgb(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-4 bg-[#FDE047]/20 p-3.5 rounded-xl border border-[#FDE047]/50">
            <span className="text-neutral-700 font-bold text-sm">ยอดรวมสุทธิทั้งรอบ</span>
            <div className="text-3xl font-black tracking-tight text-neutral-900">{grandTotal.toLocaleString()} <span className="text-sm font-bold text-neutral-500">กก.</span></div>
          </div>

          {/* Share Actions */}
          <div className="flex gap-2 mb-3">
            <button onClick={() => setShareModalRecord({ date: setupData.date, round: setupData.round, fruit: setupData.fruit, farmName: setupData.farmName, totalWeight: grandTotal, timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }), details: groupedRecords.map(g => ({ category: g.category, total: g.total, count: g.items.length, items: g.items.map(item => item.weight).reverse() })) })} className="flex-1 py-3 px-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 flex items-center justify-center gap-2 text-xs font-bold text-blue-600 transition-all active:scale-95">
              <Share2 className="w-4 h-4" /> แชร์บิลรอบนี้
            </button>
          </div>

          <div className="flex gap-2.5">
            <button onClick={() => setShowSummaryModal(false)} className="flex-1 py-3 rounded-full font-bold text-sm text-neutral-600 bg-neutral-100 hover:bg-neutral-200 active:scale-95 transition-all">กลับไปแก้ไข</button>
            <button onClick={handleConfirmRound} className="flex-[2] py-3 rounded-full font-bold text-sm text-white bg-neutral-900 hover:bg-black active:scale-95 transition-all shadow-lg flex justify-center items-center gap-1.5">
              {editingId ? 'บันทึกการแก้ไข' : 'ยืนยันบันทึกรอบ'} {editingId ? <Edit2 className="w-4 h-4 text-amber-300" /> : <CheckCircle className="w-4 h-4 text-[#4ADE80]" />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  const renderHistoryScreen = () => (
    <div className="flex-1 flex flex-col bg-[#FDFBF7] min-h-full w-full overflow-hidden">
      <div className="p-4 md:p-6 shrink-0 relative overflow-hidden bg-white border-b border-neutral-100">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#C084FC] rounded-full blur-[80px] opacity-10"></div>
        <div className="flex justify-between items-center relative z-10">
          <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-neutral-900 flex items-center gap-2">History <span className="text-neutral-300 font-normal">|</span> <span className="text-[#C084FC] font-bold text-lg lg:text-xl">ประวัติ</span></h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedRounds([]);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] lg:text-xs font-bold transition-all shadow-sm ${isSelectionMode ? 'bg-[#C084FC] text-white' : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'}`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              {isSelectionMode ? 'Cancel' : 'สรุปรวมบิล'}
            </button>
            <button 
              onClick={loadGASData} 
              disabled={gasLoading}
              className={`p-2 rounded-full transition-all ${gasLoading ? 'animate-spin text-[#C084FC] bg-purple-50' : 'text-neutral-400 hover:text-[#C084FC] hover:bg-purple-50 active:scale-90'}`}
              title="รีเฟรชข้อมูล"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 relative z-10 w-full">
          {/* Active Filter Chips */}
          {filterDate && (
            <div className="flex flex-wrap items-center gap-2 mb-1 px-1">
              <span className="bg-[#C084FC]/10 text-[#C084FC] border border-[#C084FC]/20 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 animate-in slide-in-from-left-2 duration-300">
                <Calendar className="w-3.5 h-3.5" />
                กรองวันที่: {formatDisplayDate(filterDate)}
                <button onClick={clearDateFilter} className="hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-white"><X className="w-3.5 h-3.5" /></button>
              </span>
            </div>
          )}

          <div className="flex gap-2 items-center w-full">
            <div className="flex-1 bg-neutral-50 border border-neutral-200 rounded-full flex items-center px-3 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-[#C084FC]/20 focus-within:border-[#C084FC] transition-all">
              <Search className="w-3.5 h-3.5 text-neutral-400 mr-1.5" />
              <input type="text" placeholder="ค้นหา... (ผลไม้, รอบ, สวน)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-xs w-full text-neutral-700 font-medium placeholder-neutral-300" />
              {searchTerm && (<button onClick={() => setSearchTerm('')} className="text-neutral-400 hover:text-neutral-600 px-1 transition-colors"><X className="w-3.5 h-3.5" /></button>)}
            </div>

            <div className="relative shrink-0">
              <button className={`border rounded-full w-8 h-8 flex items-center justify-center transition-all shadow-sm active:scale-95 shrink-0 overflow-hidden relative ${filterDate ? 'bg-[#C084FC] border-[#C084FC] text-white' : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'}`}>
                <Calendar className="w-3.5 h-3.5" />
                <input type="date" onClick={(e) => { try { if (e.target.showPicker) e.target.showPicker(); } catch (err) { } }} onChange={handleHistorySearchDateChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </button>
            </div>

            <div className="flex lg:hidden bg-neutral-100 p-0.5 rounded-full border border-neutral-200 shadow-inner shrink-0">
              <button onClick={() => setViewMode('list')} className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${viewMode === 'list' ? 'bg-white shadow-[0_2px_5px_rgba(0,0,0,0.1)] text-neutral-900 font-bold' : 'text-neutral-400 hover:text-neutral-600'}`}><List className="w-3.5 h-3.5" /></button>
              <button onClick={() => setViewMode('card')} className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${viewMode === 'card' ? 'bg-white shadow-[0_2px_5px_rgba(0,0,0,0.1)] text-neutral-900 font-bold' : 'text-neutral-400 hover:text-neutral-600'}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-28 hide-scrollbar">
        {filteredHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-400">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-3"><Search className="w-6 h-6 text-neutral-300" /></div>
            <p className="font-bold text-base text-neutral-700">ไม่พบข้อมูล</p>
            <p className="text-[11px] text-center max-w-[200px] mt-1 font-medium">ลองเปลี่ยนคำค้นหา หรือเลือกวันที่จากปฏิทินอีกครั้ง</p>
          </div>
        ) : (
          <>
            <div className="block lg:hidden space-y-3 max-w-3xl mx-auto">
              {filteredHistory.map(record => {
                const isExpanded = expandedHistory.includes(record.id);
                if (viewMode === 'list') {
                  return (
                    <div key={record.id} className="bg-white rounded-2xl border border-neutral-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden transition-all hover:border-neutral-200">
                      <div className="p-3 flex justify-between items-center cursor-pointer" onClick={() => isSelectionMode ? toggleSelection(record.id) : toggleHistoryExpand(record.id)}>
                        <div className="flex items-center gap-3">
                          {isSelectionMode && (
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedRounds.includes(record.id) ? 'bg-[#C084FC] border-[#C084FC]' : 'border-neutral-200 bg-white shadow-inner'}`}>
                              {selectedRounds.includes(record.id) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                            </div>
                          )}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-sm shrink-0 whitespace-nowrap transition-colors ${record.billingStatus === 'Billed' ? 'bg-green-100 text-green-700' : 'bg-[#4ADE80] text-neutral-900'}`}>ร.{record.round}</div>
                          <div>
                            <div className="font-bold text-neutral-900 text-sm flex items-center gap-1.5">
                              {record.fruit} 
                              {record.billingStatus === 'Billed' ? (
                                <span className="bg-green-100 text-green-600 text-[7px] px-1 py-0.5 rounded-full font-bold border border-green-200 uppercase tracking-tighter">Billed</span>
                              ) : (
                                <span className="bg-amber-100 text-amber-600 text-[7px] px-1 py-0.5 rounded-full font-bold border border-amber-200 uppercase tracking-tighter">Pending</span>
                              )}
                              <span className="bg-neutral-100 text-neutral-500 text-[8px] px-1.5 py-0.5 rounded-full font-bold">{record.details.length} ประเภท</span>
                            </div>
                            <div className="text-[9px] text-neutral-400 font-medium flex items-center gap-1 mt-0.5"><Calendar className="w-2.5 h-2.5" />{formatDisplayDate(record.date)} • {record.timestamp}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black tracking-tight text-neutral-900">{record.totalWeight.toLocaleString()} <span className="text-[9px] font-bold text-neutral-500">กก.</span></div>
                          <div className="text-[9px] text-[#C084FC] font-bold flex items-center justify-end gap-0.5 mt-0.5">{isExpanded ? 'ปิด' : 'รายละเอียด'} <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} /></div>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-3 pb-3 bg-neutral-50 border-t border-neutral-100 pt-3">
                          <div className="flex flex-col gap-2">
                            {record.details.map(detail => {
                              const catColor = getCategoryColorClass(detail.category).split(' ')[0];
                              return (
                                <div key={detail.category} className="bg-white p-2.5 rounded-xl border border-neutral-100 shadow-sm flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-8 rounded-full ${catColor}`}></div>
                                    <div className="flex-1 flex justify-between items-start">
                                      <div><div className="text-xs font-bold text-neutral-900">{detail.category}</div><div className="text-[9px] font-medium text-neutral-400">{detail.count} รายการ</div></div>
                                      <div className="text-base font-black tracking-tight text-neutral-800">{detail.total.toLocaleString()} <span className="text-[9px] font-medium text-neutral-500">กก.</span></div>
                                    </div>
                                  </div>
                                  {detail.items && detail.items.length > 0 && (
                                    <div className="pt-1.5 border-t border-neutral-50 flex flex-wrap gap-1">
                                      {detail.items.map((weight, idx) => (<span key={idx} className="bg-neutral-50 border border-neutral-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-neutral-600 shadow-sm">{weight}</span>))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                          <div className="mt-3 flex justify-end gap-2 items-center flex-wrap">
                            <button onClick={() => setShareModalRecord(record)} className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-[10px] font-bold text-blue-600 hover:bg-blue-100 shadow-sm flex items-center gap-1"><Share2 className="w-3 h-3" /> แชร์บิล</button>
                            <button onClick={() => setDeleteConfirmId(record.id)} className="px-3 py-1.5 bg-white border border-red-200 rounded-full text-[10px] font-bold text-red-500 hover:bg-red-50 shadow-sm flex items-center gap-1"><Trash2 className="w-3 h-3" /> ลบ</button>
                            <button onClick={() => handleEditHistory(record)} className="px-3 py-1.5 bg-white border border-neutral-200 rounded-full text-[10px] font-bold text-neutral-600 hover:bg-neutral-50 shadow-sm flex items-center gap-1"><Edit2 className="w-3 h-3" /> แก้ไขข้อมูล</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <div key={record.id} className="bg-white rounded-3xl border border-neutral-100 shadow-[0_2px_15px_rgb(0,0,0,0.02)] overflow-hidden transition-all hover:border-neutral-200">
                    <div onClick={() => isSelectionMode ? toggleSelection(record.id) : toggleHistoryExpand(record.id)} className="p-4 cursor-pointer">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          {isSelectionMode && (
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedRounds.includes(record.id) ? 'bg-[#C084FC] border-[#C084FC]' : 'border-neutral-200 bg-white'}`}>
                              {selectedRounds.includes(record.id) && <CheckCircle className="w-4 h-4 text-white" />}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-neutral-500">
                            <span className="flex items-center gap-1 bg-neutral-100 px-2 py-0.5 rounded-md"><Calendar className="w-2.5 h-2.5" /> {formatDisplayDate(record.date)}</span>
                            <span className="flex items-center gap-1 bg-neutral-100 px-2 py-0.5 rounded-md"><Clock className="w-2.5 h-2.5" /> {record.timestamp}</span>
                          </div>
                        </div>
                        <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm whitespace-nowrap transition-colors ${record.billingStatus === 'Billed' ? 'bg-green-100 text-green-700' : 'bg-[#4ADE80] text-neutral-900'}`}>{record.billingStatus === 'Billed' ? 'บันทึกบิลแล้ว' : `รอบที่ ${record.round}`}</div>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">ผลไม้</p>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-lg font-bold text-neutral-900">{record.fruit}</h3>
                            <span className="bg-neutral-100 text-neutral-500 text-[9px] px-1.5 py-0.5 rounded-full font-bold">{record.details.length} ประเภท</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">ยอดรวมสุทธิ</p>
                          <div className="text-2xl font-black tracking-tight text-neutral-900 text-[#C084FC]">{record.totalWeight.toLocaleString()} <span className="text-[11px] font-bold text-neutral-500">กก.</span></div>
                        </div>
                      </div>
                      <div className="mt-3.5 flex items-center justify-center gap-1 text-[10px] font-bold text-[#C084FC]/60">
                        {isExpanded ? 'ปิดรายละเอียด' : 'ดูรายละเอียดประเภท'} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 bg-neutral-50 border-t border-neutral-100 pt-3.5">
                        <div className="flex flex-col gap-2">
                          {record.details.map(detail => {
                            const catColor = getCategoryColorClass(detail.category).split(' ')[0];
                            return (
                              <div key={detail.category} className="bg-white p-2.5 rounded-xl border border-neutral-100 shadow-sm flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-1.5 h-8 rounded-full ${catColor}`}></div>
                                  <div className="flex-1 flex justify-between items-start">
                                    <div><div className="text-xs font-bold text-neutral-900">{detail.category}</div><div className="text-[9px] font-medium text-neutral-400">{detail.count} รายการ</div></div>
                                    <div className="text-base font-black tracking-tight text-neutral-800">{detail.total.toLocaleString()} <span className="text-[9px] font-medium text-neutral-500">กก.</span></div>
                                  </div>
                                </div>
                                {detail.items && detail.items.length > 0 && (
                                  <div className="pt-1.5 border-t border-neutral-50 flex flex-wrap gap-1">
                                    {detail.items.map((weight, idx) => (<span key={idx} className="bg-neutral-50 border border-neutral-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-neutral-600 shadow-sm">{weight}</span>))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                        <div className="mt-3 flex justify-end gap-2 items-center flex-wrap">
                          <button onClick={() => setShareModalRecord(record)} className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-[10px] font-bold text-blue-600 hover:bg-blue-100 shadow-sm flex items-center gap-1"><Share2 className="w-3 h-3" /> แชร์บิล</button>
                          <button onClick={() => setDeleteConfirmId(record.id)} className="px-3 py-1.5 bg-white border border-red-200 rounded-full text-[10px] font-bold text-red-500 hover:bg-red-50 shadow-sm flex items-center gap-1"><Trash2 className="w-3 h-3" /> ลบ</button>
                          <button onClick={() => handleEditHistory(record)} className="px-3 py-1.5 bg-white border border-neutral-200 rounded-full text-[10px] font-bold text-neutral-600 hover:bg-neutral-50 shadow-sm flex items-center gap-1"><Edit2 className="w-3 h-3" /> แก้ไขข้อมูล</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="hidden lg:block bg-white rounded-3xl border border-neutral-100 shadow-[0_2px_15px_rgb(0,0,0,0.02)] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-100 text-neutral-500 text-xs uppercase tracking-widest">
                    {isSelectionMode && <th className="p-4 pl-6 w-10"></th>}
                    <th className="p-4 pl-6 font-bold">วันที่</th><th className="p-4 font-bold">เวลา</th><th className="p-4 font-bold text-center">รอบ</th><th className="p-4 font-bold">ผลไม้</th><th className="p-4 font-bold">สถานะบิล</th><th className="p-4 font-bold text-right">ยอดรวมสุทธิ</th><th className="p-4 pr-6 font-bold text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((record, index) => {
                    const isExpanded = expandedHistory.includes(record.id);
                    const isLast = index === filteredHistory.length - 1;
                    const isSelected = selectedRounds.includes(record.id);
                    return (
                      <React.Fragment key={record.id}>
                        <tr onClick={() => isSelectionMode ? toggleSelection(record.id) : toggleHistoryExpand(record.id)} className={`hover:bg-neutral-50/50 cursor-pointer transition-colors group ${!isExpanded && !isLast ? 'border-b border-neutral-50' : ''} ${isExpanded ? 'bg-neutral-50/50 border-b border-neutral-100' : ''} ${isSelected ? 'bg-[#C084FC]/5' : ''}`}>
                          {isSelectionMode && (
                            <td className="p-4 pl-6">
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#C084FC] border-[#C084FC]' : 'border-neutral-200 bg-white'}`}>
                                {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                              </div>
                            </td>
                          )}
                          <td className="p-4 pl-6 text-sm font-semibold text-neutral-700"><span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-neutral-400" /> {formatDisplayDate(record.date)}</span></td>
                          <td className="p-4 text-sm font-medium text-neutral-500"><span className="flex items-center gap-2"><Clock className="w-4 h-4 text-neutral-400" /> {record.timestamp}</span></td>
                          <td className="p-4 text-center"><span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap ${record.billingStatus === 'Billed' ? 'bg-green-50 text-green-600' : 'bg-[#4ADE80] text-neutral-900'}`}>{record.round}</span></td>
                          <td className="p-4"><span className="text-base font-bold text-neutral-900">{record.fruit}</span></td>
                          <td className="p-4">
                            {record.billingStatus === 'Billed' ? (
                              <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 uppercase tracking-tight"><CheckCircle className="w-3.5 h-3.5" /> Billed</span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-tight"><Clock className="w-3.5 h-3.5" /> Pending</span>
                            )}
                          </td>
                          <td className="p-4 text-right"><span className="text-xl font-black tracking-tight text-neutral-900">{record.totalWeight.toLocaleString()}</span><span className="text-xs font-bold text-neutral-500 ml-1">กก.</span></td>
                          <td className="p-4 pr-6 text-center"><div className="flex items-center justify-center"><button className={`p-2 rounded-full transition-all ${isExpanded ? 'bg-[#C084FC] text-white shadow-md' : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 shadow-sm bg-white border border-neutral-200'}`}><ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} /></button></div></td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-neutral-50/80 border-b border-neutral-100">
                            <td colSpan="7" className="p-6 lg:px-8">
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {record.details.map(detail => {
                                  const catColor = getCategoryColorClass(detail.category).split(' ')[0];
                                  return (
                                    <div key={detail.category} className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col gap-3 hover:border-neutral-300 transition-colors">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-2 h-10 rounded-full ${catColor}`}></div>
                                        <div className="flex-1 flex justify-between items-start">
                                          <div><div className="text-sm font-bold text-neutral-900">{detail.category}</div><div className="text-xs font-medium text-neutral-500 mt-0.5">{detail.count} รายการ</div></div>
                                          <div className="text-lg font-black tracking-tight text-neutral-800">{detail.total.toLocaleString()} <span className="text-xs font-medium text-neutral-500">กก.</span></div>
                                        </div>
                                      </div>
                                      {detail.items && detail.items.length > 0 && (
                                        <div className="pt-2 border-t border-neutral-100 flex flex-wrap gap-1.5">
                                          {detail.items.map((weight, idx) => (<span key={idx} className="bg-neutral-50 border border-neutral-200 px-2 py-1 rounded-md text-xs font-bold text-neutral-600 shadow-sm">{weight}</span>))}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                              <div className="mt-5 flex justify-end gap-3 items-center flex-wrap">
                                <button onClick={() => setShareModalRecord(record)} className="px-5 py-2.5 bg-blue-50 border border-blue-200 rounded-full text-sm font-bold text-blue-600 hover:bg-blue-100 shadow-sm flex items-center gap-2 transition-all active:scale-95"><Share2 className="w-4 h-4" /> แชร์บิลรอบนี้</button>
                                <button onClick={() => handleEditHistory(record)} className="px-5 py-2.5 bg-white border border-neutral-200 rounded-full text-sm font-bold text-neutral-600 hover:bg-neutral-50 shadow-sm flex items-center gap-2 transition-all active:scale-95"><Edit2 className="w-4 h-4" /> แก้ไขข้อมูลรอบนี้</button>
                                <button onClick={() => setDeleteConfirmId(record.id)} className="px-5 py-2.5 bg-white border border-red-200 rounded-full text-sm font-bold text-red-500 hover:bg-red-50 shadow-sm flex items-center gap-2 transition-all active:scale-95"><Trash2 className="w-4 h-4" /> ลบข้อมูล</button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Floating Selection Bar */}
      {isSelectionMode && (
        <div className="fixed bottom-24 left-0 right-0 z-[90] px-4 animate-in slide-in-from-bottom-5 duration-300 pointer-events-none">
          <div className="max-w-md mx-auto bg-neutral-900 text-white rounded-3xl p-4 shadow-2xl flex items-center justify-between border border-neutral-800 pointer-events-auto">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">เลือกไปแล้ว</span>
              <span className="text-lg font-black">{selectedRounds.length} <span className="text-xs font-bold text-neutral-500">รายการ</span></span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => { setIsSelectionMode(false); setSelectedRounds([]); }}
                className="px-4 py-2 rounded-full text-xs font-bold text-neutral-400 hover:text-white transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                disabled={selectedRounds.length === 0}
                onClick={() => setShowMasterBillModal(true)}
                className="bg-[#C084FC] hover:bg-[#A855F7] disabled:bg-neutral-700 disabled:text-neutral-500 text-white px-6 py-2 rounded-full text-xs font-black shadow-lg shadow-purple-900/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" /> สร้างบิลสรุป
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderMasterBillModal = () => {
    const selectedData = historyRecords.filter(r => selectedRounds.includes(r.id));
    if (selectedData.length === 0 && !masterBillSuccess) return null;

    // Snapshot the data before it might change
    const snapshotData = masterBillSuccess
      ? historyRecords.filter(r => r.billingStatus === 'Billed').slice(0, selectedRounds.length)
      : selectedData;

    const categorySummary = {};
    let totalWeight = 0;
    selectedData.forEach(r => {
      totalWeight += r.totalWeight;
      r.details.forEach(d => {
        categorySummary[d.category] = (categorySummary[d.category] || 0) + d.total;
      });
    });

    const dates = selectedData.map(r => r.date).sort();
    const dateRange = dates.length > 1
      ? `${formatDisplayDate(dates[0])} - ${formatDisplayDate(dates[dates.length - 1])}`
      : formatDisplayDate(dates[0]);

    // --- Share Text for Master Bill ---
    const handleShareMasterText = () => {
      const sortedRounds = [...selectedData].sort((a,b) => new Date(a.date) - new Date(b.date));
      let text = `📋 บิลรวมน้ำหนัก (Master Invoice)\n`;
      text += `📅 ช่วงวันที่: ${dateRange}\n`;
      text += `📦 จำนวน ${sortedRounds.length} รอบ\n\n`;
      text += `─────────────────\n`;
      text += `สรุปตามประเภท:\n`;
      Object.entries(categorySummary).sort((a,b) => b[1]-a[1]).forEach(([cat, weight]) => {
        text += `✅ ${cat}: ${weight.toLocaleString()} กก.\n`;
      });
      text += `─────────────────\n`;
      text += `💰 ยอดรวมสุทธิ: ${totalWeight.toLocaleString()} กก.\n\n`;
      text += `รายละเอียดรายรอบ:\n`;
      sortedRounds.forEach(r => {
        text += `  • รอบ ${r.round} (${formatDisplayDate(r.date)}): ${r.totalWeight.toLocaleString()} กก.\n`;
      });
      text += `\n🌾 บันทึกโดย AgriWeigh`;

      if (navigator.share) {
        navigator.share({ text }).catch(e => console.error('Share failed', e));
      } else {
        navigator.clipboard.writeText(text).then(() => showToast('คัดลอกข้อความสำเร็จ!')).catch(() => showToast('ไม่สามารถคัดลอกได้'));
      }
    };

    // --- Share Image for Master Bill ---
    const handleShareMasterImage = async () => {
      setIsGeneratingImg(true);
      try {
        const SCALE = 2;
        const W = 420;
        const PADDING = 32;
        const CONTENT_W = W - PADDING * 2;
        const sortedRounds = [...selectedData].sort((a,b) => new Date(a.date) - new Date(b.date));
        const catEntries = Object.entries(categorySummary).sort((a,b) => b[1]-a[1]);
        const catSectionH = catEntries.length * 68 + 60;
        const auditSectionH = sortedRounds.length * 36 + 60;
        const H = 220 + catSectionH + auditSectionH + 100;

        const canvas = document.createElement('canvas');
        canvas.width = W * SCALE;
        canvas.height = H * SCALE;
        const ctx = canvas.getContext('2d');
        ctx.scale(SCALE, SCALE);

        // Background
        ctx.fillStyle = '#FDFBF7';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#E5E5E5'; ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, W-1, H-1);

        let y = PADDING;

        // Header black bar
        ctx.fillStyle = '#1A1A1A';
        ctx.beginPath(); ctx.roundRect(0, 0, W, 140, [0, 0, 32, 32]); ctx.fill();
        ctx.fillStyle = '#C084FC'; ctx.globalAlpha = 0.2;
        ctx.beginPath(); ctx.arc(W - 30, 30, 80, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;

        // Logo
        ctx.fillStyle = '#C084FC';
        ctx.beginPath(); ctx.arc(W/2, 38, 20, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('✻', W/2, 44);

        // Title
        ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Master Invoice', W/2, 82);
        ctx.fillStyle = '#999999'; ctx.font = '11px sans-serif';
        ctx.fillText(dateRange, W/2, 102);
        ctx.fillStyle = '#666666'; ctx.font = '10px sans-serif';
        ctx.fillText(`รวม ${sortedRounds.length} รอบ  •  ยอดสุทธิ ${totalWeight.toLocaleString()} กก.`, W/2, 120);

        y = 160;

        // Category Summary Label
        ctx.fillStyle = '#C084FC'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('สรุปยอดตามประเภท', PADDING, y);
        y += 18;

        // Category Cards
        catEntries.forEach(([cat, weight]) => {
          const catHex = getCategoryHex(cat);
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.roundRect(PADDING, y, CONTENT_W, 52, 12); ctx.fill();
          ctx.strokeStyle = '#F0F0F0'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(PADDING, y, CONTENT_W, 52, 12); ctx.stroke();
          ctx.fillStyle = catHex;
          ctx.beginPath(); ctx.arc(PADDING+18, y+26, 5, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#1A1A1A'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'left';
          ctx.fillText(cat, PADDING+30, y+30);
          ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'right';
          ctx.fillText(weight.toLocaleString(), W-PADDING-36, y+30);
          ctx.fillStyle = '#888'; ctx.font = '11px sans-serif';
          ctx.fillText('กก.', W-PADDING-10, y+30);
          y += 60;
        });

        // Total Bar
        ctx.fillStyle = '#1A1A1A';
        ctx.beginPath(); ctx.roundRect(PADDING, y, CONTENT_W, 64, 14); ctx.fill();
        ctx.fillStyle = '#999'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('ยอดรวมสุทธิ', PADDING+16, y+24);
        ctx.fillStyle = '#FDE047'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(totalWeight.toLocaleString(), W-PADDING-42, y+46);
        ctx.fillStyle = '#999'; ctx.font = 'bold 12px sans-serif';
        ctx.fillText('กก.', W-PADDING-12, y+46);
        y += 80;

        // Audit Log
        ctx.strokeStyle = '#E5E5E5'; ctx.lineWidth = 1; ctx.setLineDash([4,4]);
        ctx.beginPath(); ctx.moveTo(PADDING, y); ctx.lineTo(W-PADDING, y); ctx.stroke();
        ctx.setLineDash([]);
        y += 16;
        ctx.fillStyle = '#AAAAAA'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('AUDIT LOG - รายละเอียดรายรอบ', PADDING, y);
        y += 16;
        sortedRounds.forEach(r => {
          ctx.fillStyle = '#555'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left';
          ctx.fillText(`รอบ ${r.round}  •  ${formatDisplayDate(r.date)}`, PADDING, y);
          ctx.fillStyle = '#1A1A1A'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'right';
          ctx.fillText(`${r.totalWeight.toLocaleString()} กก.`, W-PADDING, y);
          y += 28;
        });
        y += 8;

        // Footer
        ctx.fillStyle = '#CCCCCC'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('บันทึกโดย AgriWeigh Pro', W/2, y);

        const dataUrl = canvas.toDataURL('image/png');
        if (navigator.share && navigator.canShare) {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], `master-invoice-${Date.now()}.png`, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Master Invoice - AgriWeigh' });
          } else { downloadImage(dataUrl); }
        } else { downloadImage(dataUrl); }
        showToast('สร้างใบสรุปรวมสำเร็จ!');
      } catch(e) {
        console.error('Master image failed', e);
        showToast('เกิดข้อผิดพลาดในการสร้างรูปภาพ');
      } finally {
        setIsGeneratingImg(false);
      }
    };

    // --- Finalize Master Bill ---
    const handleFinalizeMasterBill = async () => {
      setIsGeneratingMasterBill(true);
      // ✅ Optimistic UI: Update local state immediately
      const billedIds = [...selectedRounds];
      setHistoryRecords(prev => prev.map(r =>
        billedIds.includes(r.id) ? { ...r, billingStatus: 'Billed' } : r
      ));

      // Show success view immediately
      setMasterBillSuccess(true);
      setIsGeneratingMasterBill(false);

      // Try to sync with Google Sheet in the background
      if (GAS_URL) {
        try {
          await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'updateBillingStatus', payload: { ids: billedIds, status: 'Billed' } })
          });
        } catch (e) {
          console.error('Master bill GAS sync failed (UI already updated)', e);
        }
      }
    };

    const handleCloseMasterBill = () => {
      setShowMasterBillModal(false);
      setMasterBillSuccess(false);
      setIsSelectionMode(false);
      setSelectedRounds([]);
    };

    return (
      <div className="fixed inset-0 z-[110] bg-neutral-900/80 backdrop-blur-md flex items-end md:items-center justify-center md:p-4 overflow-y-auto">
        <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl flex flex-col my-auto animate-in slide-in-from-bottom-10 duration-500 overflow-hidden">

          {/* Header */}
          <div className={`text-white p-6 relative overflow-hidden shrink-0 transition-colors duration-500 ${masterBillSuccess ? 'bg-[#14532D]' : 'bg-neutral-900'}`}>
            <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-[60px] opacity-30 ${masterBillSuccess ? 'bg-[#4ADE80]' : 'bg-[#C084FC]'}`}></div>
            <h2 className="text-2xl font-black tracking-tight mb-1 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center transition-colors ${masterBillSuccess ? 'bg-[#4ADE80]' : 'bg-[#C084FC]'}`}>
                {masterBillSuccess ? <CheckCircle className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
              </div>
              {masterBillSuccess ? 'บิลสำเร็จแล้ว!' : 'Master Invoice'}
            </h2>
            <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> ประจำวันที่: {dateRange}
            </p>
          </div>

          {/* Body */}
          <div className="bg-white p-6 space-y-8 overflow-y-auto max-h-[60vh] hide-scrollbar">
            <div className="text-center pb-6 border-b border-dashed border-neutral-100 italic text-neutral-400 text-xs">AgriWeigh Pro - ใบสรุปผลผลิตรวม</div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-1.5 h-4 rounded-full ${masterBillSuccess ? 'bg-[#4ADE80]' : 'bg-[#C084FC]'}`}></div>
                <h4 className="font-extrabold text-neutral-800 text-sm uppercase tracking-wider">สรุปยอดรวมตามประเภท</h4>
              </div>
              <div className="space-y-3">
                {Object.entries(categorySummary).sort((a,b) => b[1]-a[1]).map(([cat, weight]) => (
                  <div key={cat} className="flex justify-between items-center p-4 bg-neutral-50 rounded-2xl border border-neutral-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryHex(cat) }}></div>
                      <span className="font-bold text-neutral-700">{cat}</span>
                    </div>
                    <div className="text-xl font-black text-neutral-900">{weight.toLocaleString()} <span className="text-[10px] text-neutral-400">กก.</span></div>
                  </div>
                ))}
                <div className="pt-4 border-t border-neutral-100 flex justify-between items-center">
                  <span className="text-sm font-black text-neutral-500 uppercase tracking-widest">ยอดรวมสุทธิทั้งสิ้น</span>
                  <span className="text-3xl font-black text-neutral-900 tracking-tight">{totalWeight.toLocaleString()} <span className="text-sm font-bold text-neutral-400">กก.</span></span>
                </div>
              </div>
            </div>
            <div className="bg-neutral-50/50 p-5 rounded-3xl border border-neutral-100">
              <div className="flex items-center gap-2 mb-4">
                <List className="w-4 h-4 text-neutral-400" />
                <h4 className="font-extrabold text-neutral-400 text-[10px] uppercase tracking-widest">แจกแจงรายรอบ (Audit Log)</h4>
              </div>
              <div className="space-y-3">
                {[...selectedData].sort((a,b) => new Date(a.date) - new Date(b.date)).map(r => (
                  <div key={r.id} className="flex justify-between items-center">
                    <div className="text-[11px] font-bold text-neutral-600 flex items-center gap-2">
                      <span className="w-4 h-4 bg-white border border-neutral-200 rounded-full flex items-center justify-center text-[8px]">{r.round}</span>
                      {formatDisplayDate(r.date)}
                    </div>
                    <div className="text-[11px] font-black text-neutral-900">{r.totalWeight.toLocaleString()} <span className="text-neutral-400 font-bold">กก.</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer - changes based on success state */}
          <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex flex-col gap-3 shrink-0">
            {masterBillSuccess ? (
              <>
                <p className="text-center text-sm font-bold text-[#14532D] flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#4ADE80]" /> อัปเดตสถานะเป็น BILLED เรียบร้อยแล้วค่ะ!
                </p>
                <button
                  onClick={handleShareMasterText}
                  className="w-full flex items-center justify-center gap-3 bg-neutral-900 text-white p-4 rounded-2xl font-black text-sm shadow-xl hover:shadow-2xl active:scale-95 transition-all"
                >
                  <MessageSquare className="w-5 h-5 text-[#4ADE80]" /> แชร์สรุปเป็นข้อความ
                </button>
                <button
                  onClick={handleShareMasterImage}
                  disabled={isGeneratingImg}
                  className="w-full flex items-center justify-center gap-3 bg-white border-2 border-[#C084FC] text-[#7C3AED] p-4 rounded-2xl font-black text-sm hover:bg-[#C084FC]/5 active:scale-95 transition-all disabled:opacity-60"
                >
                  {isGeneratingImg
                    ? <><RotateCcw className="w-5 h-5 animate-spin" /> กำลังสร้างรูป...</>
                    : <><ImageIcon className="w-5 h-5" /> แชร์เป็นรูปภาพบิลรวม</>
                  }
                </button>
                <button onClick={handleCloseMasterBill} className="w-full bg-white border border-neutral-200 text-neutral-500 p-3.5 rounded-2xl font-bold text-sm hover:bg-neutral-50 transition-colors">ปิด</button>
              </>
            ) : (
              <>
                <button
                  onClick={handleFinalizeMasterBill}
                  disabled={isGeneratingMasterBill}
                  className="w-full bg-neutral-900 text-white p-4 rounded-2xl font-black text-base shadow-xl hover:shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {isGeneratingMasterBill
                    ? <><RotateCcw className="w-5 h-5 animate-spin" /> กำลังบันทึก...</>
                    : <><CheckCircle className="w-5 h-5 text-[#4ADE80]" /> ยืนยันออกบิล & บันทึกสถานะ</>
                  }
                </button>
                <button onClick={() => { setShowMasterBillModal(false); setMasterBillSuccess(false); }} className="w-full bg-white border border-neutral-200 text-neutral-500 p-4 rounded-2xl font-bold text-sm hover:bg-neutral-50 transition-colors">ย้อนกลับ</button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDashboardScreen = () => {
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

    let topCategory = 'ไม่มีข้อมูล';
    let topWeight = 0;
    Object.entries(catTotals).forEach(([cat, weight]) => {
      if (weight > topWeight) { topWeight = weight; topCategory = cat; }
    });

    let conicGradientString = '';
    if (totalDashboardWeight > 0) {
      let currentPercentage = 0;
      const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

      const gradientParts = sortedCats.map(([cat, weight]) => {
        const percentage = (weight / totalDashboardWeight) * 100;
        const color = getCategoryHex(cat);
        const part = `${color} ${currentPercentage}% ${currentPercentage + percentage}%`;
        currentPercentage += percentage;
        return part;
      });
      conicGradientString = `conic-gradient(${gradientParts.join(', ')})`;
    } else {
      conicGradientString = `conic-gradient(#f1f5f9 0% 100%)`;
    }

    const mockTrendData = [
      { label: '4 เม.ย.', value: 1200 },
      { label: '5 เม.ย.', value: 1550 },
      { label: '6 เม.ย.', value: 800 },
      { label: '7 เม.ย.', value: 2100 },
      { label: '8 เม.ย.', value: 1850 },
      { label: '9 เม.ย.', value: 890 },
      { label: '10 เม.ย.', value: 1245 },
    ];
    const maxTrendValue = Math.max(...mockTrendData.map(d => d.value));

    const handleDashboardDateChange = (e) => {
      if (!e.target.value) return;
      const dateObj = new Date(e.target.value);
      if (!isNaN(dateObj)) {
        const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        setDashboardDate(`${dateObj.getDate()} ${thaiMonths[dateObj.getMonth()]} ${dateObj.getFullYear()}`);
      }
    };

    return (
      <div className="flex-1 flex flex-col bg-[#FDFBF7] min-h-full w-full overflow-hidden animate-in fade-in duration-300">
        <div className="p-4 md:p-6 shrink-0 relative overflow-hidden bg-white border-b border-neutral-100">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#FDE047] rounded-full blur-[80px] opacity-20"></div>
          <div className="flex justify-between items-center relative z-10 w-full">
            <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-neutral-900 flex items-center gap-2">
              Statistics <span className="text-neutral-300 font-normal">|</span> <span className="text-[#FDE047] font-bold text-lg lg:text-xl drop-shadow-sm">สถิติ</span>
            </h2>
            <button 
              onClick={loadGASData} 
              disabled={gasLoading}
              className={`p-2 rounded-full transition-all ${gasLoading ? 'animate-spin text-amber-500 bg-amber-50' : 'text-neutral-400 hover:text-amber-500 hover:bg-amber-50 active:scale-90'}`}
              title="รีเฟรชข้อมูล"
            >
              <RotateCcw className="w-5 h-5 transition-transform" />
            </button>
          </div>

          <div className="mt-4 flex flex-col md:flex-row gap-3 relative z-10">
            <div className="flex bg-neutral-100 p-1 rounded-full border border-neutral-200 shadow-inner overflow-x-auto hide-scrollbar">
              {['daily', 'weekly', 'monthly', 'yearly'].map((range) => {
                const labels = { daily: 'รายวัน', weekly: 'รายสัปดาห์', monthly: 'รายเดือน', yearly: 'รายปี' };
                return (
                  <button
                    key={range} onClick={() => setDashboardRange(range)}
                    className={`px-4 py-1.5 rounded-full text-[11px] lg:text-xs font-bold transition-all whitespace-nowrap ${dashboardRange === range ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-neutral-900' : 'text-neutral-500 hover:text-neutral-800'}`}
                  >
                    {labels[range]}
                  </button>
                );
              })}
            </div>

            <div className="relative shrink-0 ml-auto md:ml-0 flex items-center gap-2">
              <div className="relative">
                <select
                  value={dashboardFruitFilter}
                  onChange={e => setDashboardFruitFilter(e.target.value)}
                  className="bg-white border border-neutral-200 rounded-full pl-3 pr-8 py-1.5 text-neutral-700 shadow-sm hover:bg-neutral-50 appearance-none outline-none font-bold text-[11px] lg:text-xs cursor-pointer"
                >
                  <option value="All">รวมผลไม้ทุกชนิด</option>
                  {fruits.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button className="bg-white border border-neutral-200 rounded-full px-4 py-1.5 flex items-center justify-center text-neutral-700 shadow-sm hover:bg-neutral-50 active:scale-95 shrink-0 overflow-hidden relative font-bold text-[11px] lg:text-xs gap-2">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                {dashboardDate}
                <input type="date" onClick={(e) => { try { if (e.target.showPicker) e.target.showPicker(); } catch (err) { } }} onChange={handleDashboardDateChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-28 space-y-4 lg:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-[0_2px_15px_rgb(0,0,0,0.02)] flex flex-col relative overflow-hidden">
              <div className="w-10 h-10 bg-[#FDE047]/20 rounded-full flex items-center justify-center mb-3 text-[#FDE047]"><BarChart2 className="w-5 h-5 text-neutral-800" /></div>
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">ยอดรวมทั้งหมด</p>
              <div className="text-3xl font-black tracking-tight text-neutral-900">{totalDashboardWeight.toLocaleString()} <span className="text-xs font-bold text-neutral-500">กก.</span></div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#FDE047] rounded-full blur-[40px] opacity-20"></div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-[0_2px_15px_rgb(0,0,0,0.02)] flex flex-col">
              <div className="w-10 h-10 bg-[#4ADE80]/20 rounded-full flex items-center justify-center mb-3 text-[#4ADE80]"><ListChecks className="w-5 h-5 text-neutral-800" /></div>
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">จำนวนรอบ</p>
              <div className="text-3xl font-black tracking-tight text-neutral-900">{totalRounds} <span className="text-xs font-bold text-neutral-500">รอบ</span></div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-[0_2px_15px_rgb(0,0,0,0.02)] flex flex-col">
              <div className="w-10 h-10 bg-[#C084FC]/20 rounded-full flex items-center justify-center mb-3 text-[#C084FC]"><TrendingUp className="w-5 h-5 text-neutral-800" /></div>
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">ประเภทที่เยอะที่สุด</p>
              <div className="text-3xl font-black tracking-tight text-neutral-900">{topCategory}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="bg-white p-5 lg:p-6 rounded-3xl border border-neutral-100 shadow-[0_2px_15px_rgb(0,0,0,0.02)] flex flex-col lg:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <PieChart className="w-5 h-5 text-neutral-400" />
                <h3 className="font-extrabold text-neutral-800">สัดส่วนตามประเภท</h3>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative w-40 h-40 lg:w-48 lg:h-48 rounded-full mb-6 shadow-sm" style={{ background: conicGradientString }}>
                  <div className="absolute inset-[15%] bg-white rounded-full flex items-center justify-center shadow-inner flex-col">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">รวม</span>
                    <span className="text-lg font-black text-neutral-900">{totalDashboardWeight.toLocaleString()}</span>
                  </div>
                </div>
                <div className="w-full flex flex-wrap justify-center gap-3">
                  {Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([cat, weight]) => (
                    <div key={cat} className="flex items-center gap-1.5 bg-neutral-50 px-2.5 py-1 rounded-lg border border-neutral-100">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getCategoryHex(cat) }}></div>
                      <span className="text-[10px] font-bold text-neutral-700">{cat} <span className="text-neutral-400 ml-1">{Math.round((weight / totalDashboardWeight) * 100)}%</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-5 lg:p-6 rounded-3xl border border-neutral-100 shadow-[0_2px_15px_rgb(0,0,0,0.02)] flex flex-col lg:col-span-2 min-h-[300px]">
              <div className="flex items-center gap-2 mb-8">
                <BarChart2 className="w-5 h-5 text-neutral-400" />
                <h3 className="font-extrabold text-neutral-800">แนวโน้มน้ำหนัก (7 วันย้อนหลัง)</h3>
              </div>
              <div className="flex-1 flex items-end justify-between gap-2 lg:gap-4 relative pt-6 border-b border-neutral-200 pb-2">
                <div className="absolute top-0 w-full border-t border-neutral-100 border-dashed"></div>
                <div className="absolute top-1/2 w-full border-t border-neutral-100 border-dashed"></div>
                {mockTrendData.map((data, index) => {
                  const heightPercent = (data.value / maxTrendValue) * 100;
                  const isToday = index === mockTrendData.length - 1;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2 relative group">
                      <div className="absolute -top-8 bg-neutral-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none whitespace-nowrap">
                        {data.value.toLocaleString()} กก.
                      </div>
                      <div className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 hover:opacity-80 relative overflow-hidden ${isToday ? 'bg-neutral-900' : 'bg-neutral-200'}`} style={{ height: `${heightPercent}%`, minHeight: '4px' }}>
                        {isToday && <div className="absolute inset-0 bg-[#FDE047] opacity-20"></div>}
                      </div>
                      <span className={`text-[9px] lg:text-[10px] font-bold ${isToday ? 'text-neutral-900' : 'text-neutral-400'}`}>{data.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettingsScreen = () => {
    const handleAddFruit = async () => {
      if (!newFruit.trim()) return;
      const name = newFruit.trim();
      if (!masterData[name]) {
        setMasterData(prev => ({ ...prev, [name]: [] }));
        setSettingsActiveFruit(name);
      }
      setNewFruit('');
      if (GAS_URL) {
        try { await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'addFruit', payload: { fruitName: name } }) }); }
        catch (e) { console.error('GAS addFruit failed', e); }
      }
    };

    const handleRemoveFruit = async (f) => {
      const newData = { ...masterData };
      delete newData[f];
      setMasterData(newData);
      if (setupData.fruit === f) setSetupData(prev => ({ ...prev, fruit: Object.keys(newData)[0] || '' }));
      if (GAS_URL) {
        try { await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteFruit', payload: { fruitName: f } }) }); }
        catch (e) { console.error('GAS deleteFruit failed', e); }
      }
    };

    const handleAddCat = async () => {
      if (!newCat.trim() || !settingsActiveFruit) return;
      const catName = newCat.trim();
      setMasterData(prev => ({
        ...prev,
        [settingsActiveFruit]: [...(prev[settingsActiveFruit] || []), catName]
      }));
      setNewCat('');
      if (GAS_URL) {
        try { await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'addCategory', payload: { fruitName: settingsActiveFruit, categoryName: catName } }) }); }
        catch (e) { console.error('GAS addCategory failed', e); }
      }
    };

    const handleRemoveCat = async (c) => {
      setMasterData(prev => ({
        ...prev,
        [settingsActiveFruit]: prev[settingsActiveFruit].filter(item => item !== c)
      }));
      if (activeCategory === c) setActiveCategory('');
      if (GAS_URL) {
        try { await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteCategory', payload: { fruitName: settingsActiveFruit, categoryName: c } }) }); }
        catch (e) { console.error('GAS deleteCategory failed', e); }
      }
    };

    return (
      <div className="flex-1 flex flex-col bg-[#FDFBF7] min-h-full w-full overflow-hidden animate-in fade-in duration-300">
        <div className="p-4 md:p-6 shrink-0 relative overflow-hidden bg-white border-b border-neutral-100">
          <div className="absolute top-0 right-0 w-48 h-48 bg-neutral-200 rounded-full blur-[80px] opacity-20"></div>
          <div className="flex justify-between items-center relative z-10 w-full">
            <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-neutral-900 flex items-center gap-2">
              Settings <span className="text-neutral-300 font-normal">|</span> <span className="text-neutral-400 font-bold text-lg lg:text-xl drop-shadow-sm">ตั้งค่าระบบ</span>
            </h2>
            <button 
              onClick={loadGASData} 
              disabled={gasLoading}
              className={`p-2 rounded-full transition-all ${gasLoading ? 'animate-spin text-blue-500 bg-blue-50' : 'text-neutral-400 hover:text-blue-500 hover:bg-blue-50 active:scale-90'}`}
              title="รีเฟรชข้อมูล"
            >
              <RotateCcw className="w-5 h-5 transition-transform" />
            </button>
          </div>
          <p className="text-xs text-neutral-500 mt-2">จัดการรายชื่อผลไม้และประเภทเพื่อใช้ในระบบบันทึกและสถิติ</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-28 space-y-6">
          {/* Farm Management */}
          <div className="bg-white p-5 lg:p-6 rounded-3xl border border-neutral-100 shadow-[0_2px_15px_rgb(0,0,0,0.02)] max-w-2xl">
            <h3 className="font-extrabold text-neutral-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center"><Settings className="w-4 h-4" /></div>
              ข้อมูลสวน / ร้าน (Farm)
            </h3>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text" id="newFarmInput" placeholder="เพิ่มชื่อสวนใหม่..."
                onKeyDown={e => { if (e.key === 'Enter') { const name = e.target.value.trim(); if (name) { 
                  if (!farmList.includes(name)) { 
                    setFarmList(prev => [...prev, name]); 
                    if (GAS_URL) fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'addFarm', payload: { farmName: name } }) });
                  }
                  e.target.value = ''; 
                }}}}
                className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white transition-colors"
              />
              <button 
                onClick={() => { 
                  const input = document.getElementById('newFarmInput'); 
                  const name = input?.value?.trim(); 
                  if (name && !farmList.includes(name)) { 
                    setFarmList(prev => [...prev, name]); 
                    if (GAS_URL) fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'addFarm', payload: { farmName: name } }) });
                    input.value = ''; 
                  } 
                }} 
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> เพิ่ม
              </button>
            </div>

            <div className="space-y-2">
              {farmList.map(farm => (
                <div key={farm} className="flex justify-between items-center p-3 px-4 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-neutral-200 transition-colors group">
                  <span className="font-bold text-neutral-800 text-sm">{farm}</span>
                  <button onClick={() => { 
                    if (farmList.length <= 1) return; 
                    setFarmList(prev => prev.filter(f => f !== farm)); 
                    if (setupData.farmName === farm) setSetupData(prev => ({ ...prev, farmName: farmList.filter(f => f !== farm)[0] }));
                    if (GAS_URL) fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteFarm', payload: { farmName: farm } }) });
                  }}
                    className={`p-1.5 rounded-full transition-colors ${farmList.length <= 1 ? 'text-neutral-200 cursor-not-allowed' : 'text-neutral-300 hover:text-red-500 hover:bg-red-50'}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

            <div className="bg-white p-5 lg:p-6 rounded-3xl border border-neutral-100 shadow-[0_2px_15px_rgb(0,0,0,0.02)]">
              <h3 className="font-extrabold text-neutral-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#C084FC]/20 text-[#C084FC] flex items-center justify-center"><Leaf className="w-4 h-4" /></div>
                จัดการ "ผลไม้" (Fruits)
              </h3>

              <div className="flex gap-2 mb-5">
                <input
                  type="text" value={newFruit} onChange={e => setNewFruit(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddFruit()}
                  placeholder="เพิ่มชื่อผลไม้ เช่น ทุเรียน..."
                  className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#C084FC] focus:bg-white transition-colors"
                />
                <button onClick={handleAddFruit} className="bg-[#C084FC] hover:bg-[#A855F7] text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center gap-1">
                  <Plus className="w-4 h-4" /> เพิ่ม
                </button>
              </div>

              <div className="space-y-2">
                {fruits.map(f => (
                  <div
                    key={f}
                    onClick={() => setSettingsActiveFruit(f)}
                    className={`flex justify-between items-center p-3 px-4 rounded-xl border transition-colors cursor-pointer group ${settingsActiveFruit === f ? 'bg-[#C084FC]/10 border-[#C084FC]' : 'bg-neutral-50 border-neutral-100 hover:border-neutral-200'}`}
                  >
                    <span className="font-bold text-neutral-800 text-sm">{f}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleRemoveFruit(f); }} className="text-neutral-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {fruits.length === 0 && <p className="text-center text-xs text-neutral-400 py-4">ไม่มีข้อมูลผลไม้ในระบบ</p>}
              </div>
            </div>

            <div className="bg-white p-5 lg:p-6 rounded-3xl border border-neutral-100 shadow-[0_2px_15px_rgb(0,0,0,0.02)]">
              <h3 className="font-extrabold text-neutral-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#4ADE80]/20 text-[#4ADE80] flex items-center justify-center"><LayoutGrid className="w-4 h-4" /></div>
                ประเภทของ "{settingsActiveFruit || 'ยังไม่ได้เลือกผลไม้'}"
              </h3>

              <div className="flex gap-2 mb-5">
                <input
                  type="text" value={newCat} onChange={e => setNewCat(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCat()}
                  disabled={!settingsActiveFruit}
                  placeholder="เพิ่มประเภท เช่น ไซส์ S..."
                  className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#4ADE80] focus:bg-white transition-colors disabled:opacity-50"
                />
                <button onClick={handleAddCat} disabled={!settingsActiveFruit} className="bg-[#4ADE80] hover:bg-[#22C55E] disabled:bg-neutral-200 disabled:text-neutral-400 text-neutral-900 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center gap-1">
                  <Plus className="w-4 h-4" /> เพิ่ม
                </button>
              </div>

              <div className="space-y-2">
                {settingsActiveFruit && masterData[settingsActiveFruit]?.map(c => {
                  const hexColor = getCategoryHex(c);
                  return (
                    <div key={c} className="flex justify-between items-center p-3 px-4 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-neutral-200 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: hexColor }}></div>
                        <span className="font-bold text-neutral-800 text-sm">{c}</span>
                      </div>
                      <button onClick={() => handleRemoveCat(c)} className="text-neutral-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )
                })}
                {(!settingsActiveFruit || masterData[settingsActiveFruit]?.length === 0) && <p className="text-center text-xs text-neutral-400 py-4">ไม่มีข้อมูลประเภท</p>}
              </div>
            </div>
          </div>

          {/* System Utilities */}
          <div className="bg-white p-5 lg:p-6 rounded-3xl border border-neutral-100 shadow-[0_2px_15px_rgb(0,0,0,0.02)] max-w-2xl">
            <h3 className="font-extrabold text-neutral-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center"><Monitor className="w-4 h-4" /></div>
              อรรถประโยชน์ (System Utilities)
            </h3>
            <p className="text-[11px] text-neutral-500 mb-4">ส่วนนี้ใช้สำหรับการทดสอบระบบและการตั้งค่าขั้นสูง</p>
            <button 
              onClick={() => { setShowInstallBanner(true); sessionStorage.removeItem('cg_install_dismissed'); }}
              className="w-full bg-neutral-900 hover:bg-black text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> ทดสอบแถบติดตั้ง (Test PWA Banner)
            </button>
            <p className="text-[10px] text-neutral-400 mt-3 text-center italic">ระบบจะบังคับให้แถบติดตั้งสีเขียวด้านบนแสดงขึ้นเพื่อให้คุณตรวจสอบความสวยงาม</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-[100dvh] flex flex-col lg:flex-row bg-[#FDFBF7] overflow-hidden font-sans relative">

      {/* --- Desktop Sidebar (Light Theme) --- */}
      <div className="hidden lg:flex flex-col w-72 bg-[#FDFBF7] border-r border-neutral-200 z-30 shrink-0">
        <div className="p-8 flex items-center gap-3">
          <Asterisk className="w-8 h-8 text-neutral-900 animate-spin-slow" />
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">AgriWeigh</h1>
        </div>

        <div className="flex-1 py-4 flex flex-col gap-2 px-6">
          <SidebarItem icon={<Sparkles />} label="Recording" isActive={activeTab === 'record'} onClick={() => setActiveTab('record')} />
          <SidebarItem icon={<History />} label="History" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
          <SidebarItem icon={<BarChart2 />} label="Statistics" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />

          <div className="mt-10 mb-2 px-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">System</div>
          <SidebarItem icon={<Settings />} label="Settings" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden lg:overflow-hidden flex flex-col relative w-full h-full"
      >
        {/* --- Sync/Offline Indicator --- */}
        {!navigator.onLine && (
          <div className="bg-red-500 text-white text-[10px] py-1 text-center font-bold tracking-widest z-[150] sticky top-0 flex items-center justify-center gap-2">
            <AlertCircle className="w-3 h-3" /> OFFLINE MODE - Saving Locally
          </div>
        )}
        {syncQueue.length > 0 && navigator.onLine && (
          <div className="bg-[#4ADE80] text-neutral-900 text-[10px] py-1 text-center font-bold tracking-widest z-[150] sticky top-0 flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3 animate-spin-slow" /> DATA SYNCING... ({syncQueue.length})
          </div>
        )}

        {activeTab === 'record' ? (
          isRecording ? renderActiveScreen() : renderSetupScreen()
        ) : activeTab === 'history' ? (
          renderHistoryScreen()
        ) : activeTab === 'dashboard' ? (
          renderDashboardScreen()
        ) : activeTab === 'settings' ? (
          renderSettingsScreen()
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col text-neutral-400 bg-[#FDFBF7] w-full">
            <div className="w-24 h-24 lg:w-32 lg:h-32 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
              <Settings className="w-10 h-10 lg:w-12 lg:h-12 text-neutral-300" />
            </div>
            <p className="font-extrabold tracking-tight text-2xl lg:text-3xl text-neutral-800 mb-2">Coming Soon</p>
            <p className="text-sm lg:text-base text-neutral-500 font-medium">Feature under construction.</p>
          </div>
        )}

        {/* --- Bottom Fade Overlay (Mobile only) --- */}
        <div className={`lg:hidden bottom-fade-overlay transition-opacity duration-500 ${showNav ? 'opacity-100' : 'opacity-0'}`}></div>
      </div>

      {/* --- PWA Install Banner --- */}
      {showInstallBanner && (
        <div className="fixed top-4 left-4 right-4 z-[150] animate-in slide-in-from-top-10 fade-in duration-500 lg:left-auto lg:right-6 lg:top-6 lg:w-[400px]">
          <div className="bg-white/95 backdrop-blur-md border border-neutral-100 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-4 flex items-center gap-4 relative overflow-hidden group">
            {/* Background Decorative Sparkle */}
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-[#4ADE80]/10 rounded-full blur-2xl group-hover:bg-[#C084FC]/10 transition-colors duration-700"></div>
            
            <div className="shrink-0 relative">
              <img src="/icon-192.png" alt="App Icon" className="w-12 h-12 rounded-xl shadow-sm border border-neutral-50" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#4ADE80] rounded-full border-2 border-white flex items-center justify-center">
                <Plus className="w-2.5 h-2.5 text-white stroke-[2.5]" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-extrabold text-neutral-800 truncate leading-tight">เพิ่ม AgriWeigh ไปที่หน้าจอหลัก</h4>
              <p className="text-[10px] font-medium text-neutral-500 leading-tight mt-0.5">เพื่อการบันทึกน้ำหนักที่รวดเร็วและสะดวกยิ่งขึ้น</p>
            </div>

            <div className="flex items-center gap-3 relative z-10">
              <button 
                onClick={handleInstallClick}
                className="bg-[#4ADE80] hover:bg-[#22C55E] text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-md shadow-[#4ADE80]/20 transition-all active:scale-95 whitespace-nowrap"
              >
                เพิ่ม
              </button>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setShowInstallBanner(false); 
                  sessionStorage.setItem('cg_install_dismissed', 'true'); 
                }}
                className="p-3 -mr-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-all active:scale-90"
                aria-label="ปิด"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Delete Confirmation Modal --- */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[200] bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-6 lg:p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-2">ยืนยันการลบข้อมูล</h3>
            <p className="text-sm text-neutral-500 mb-6 font-medium">คุณต้องการลบข้อมูลรอบนี้ใช่หรือไม่? ข้อมูลจะหายไปอย่างถาวร</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 rounded-full font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200">ยกเลิก</button>
              <button onClick={() => {
                setHistoryRecords(prev => prev.filter(r => r.id !== deleteConfirmId));
                setDeleteConfirmId(null);
              }} className="flex-1 py-3 rounded-full font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg">ลบข้อมูล</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Toast Notification --- */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] bg-neutral-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold text-sm animate-in slide-in-from-top-4 fade-in duration-300">
          <CheckCircle className="w-4 h-4 text-[#4ADE80]" /> {toastMsg}
        </div>
      )}

      {/* --- Share Modal Bottom Sheet --- */}
      {shareModalRecord && (
        <div className="fixed inset-0 z-[200] bg-neutral-900/60 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4">
          <div className="bg-white w-full max-w-sm rounded-t-[2rem] md:rounded-[2rem] shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300 p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-extrabold text-neutral-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-500" /> แชร์ใบเสร็จ
              </h3>
              <button onClick={() => setShareModalRecord(null)} className="p-2 bg-neutral-100 rounded-full text-neutral-500 hover:bg-neutral-200"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <button onClick={() => { handleShareText(shareModalRecord); setShareModalRecord(null); }} className="w-full flex items-center gap-4 bg-neutral-50 border border-neutral-200 p-4 rounded-2xl hover:bg-neutral-100 transition-colors active:scale-95 group">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-all text-green-500"><MessageSquare className="w-5 h-5" /></div>
                <div className="text-left"><p className="font-bold text-neutral-900">แชร์ข้อความ (Share Text)</p><p className="text-[10px] text-neutral-500 font-medium">ส่งข้อความสรุปน้ำหนักผ่าน Line, Messenger</p></div>
              </button>
              <button onClick={() => { handleShareImage(shareModalRecord); setShareModalRecord(null); }} disabled={isGeneratingImg} className="w-full flex items-center gap-4 bg-blue-50 border border-blue-200 p-4 rounded-2xl hover:bg-blue-100 transition-colors active:scale-95 group disabled:opacity-70 disabled:active:scale-100">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-all text-blue-600">
                  {isGeneratingImg ? <Asterisk className="w-5 h-5 animate-spin-slow" /> : <ImageIcon className="w-5 h-5" />}
                </div>
                <div className="text-left"><p className="font-bold text-blue-900">{isGeneratingImg ? 'กำลังสร้างรูปภาพ...' : 'แชร์เป็นรูปภาพ (Share Image)'}</p><p className="text-[10px] text-blue-600/70 font-medium">สร้างใบเสร็จสวยงาม ส่งให้พ่อค้า</p></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Summary Modal Overlay --- */}
      {showSummaryModal && renderSummaryModal()}

      {/* --- Master Bill Modal Overlay --- */}
      {showMasterBillModal && renderMasterBillModal()}

      {/* --- Mobile & Tablet Bottom Navigation --- */}
      <div className={`lg:hidden fixed bottom-3 left-3 right-3 z-50 pointer-events-none pb-safe transition-all duration-300 ${showNav ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'}`}>
        <div className="bg-neutral-900/95 backdrop-blur-md px-4 py-2.5 flex justify-between items-center rounded-full shadow-2xl pointer-events-auto max-w-sm mx-auto border border-neutral-800">
          <BottomNavItem icon={<Sparkles />} label="Record" isActive={activeTab === 'record'} onClick={() => { setActiveTab('record'); setShowNav(true); }} />
          <BottomNavItem icon={<History />} label="History" isActive={activeTab === 'history'} onClick={() => { setActiveTab('history'); setShowNav(true); }} />
          <BottomNavItem icon={<BarChart2 />} label="Stats" isActive={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setShowNav(true); }} />
          <BottomNavItem icon={<Settings />} label="Settings" isActive={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setShowNav(true); }} />
        </div>
      </div>


      {/* Inline Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        input[type="date"]::-webkit-calendar-picker-indicator {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 16px);
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}} />
    </div>
  );
}

// Sidebar Component for Desktop
const SidebarItem = ({ icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 px-6 py-4 rounded-full transition-all w-full text-left font-bold
        ${isActive
          ? 'bg-neutral-900 text-white shadow-md'
          : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'}`}
    >
      {React.cloneElement(icon, { className: `w-5 h-5` })}
      <span className="text-base">{label}</span>
    </button>
  );
};

// Bottom Nav Component for Mobile/Tablet
const BottomNavItem = ({ icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all
        ${isActive ? 'text-[#FDE047] scale-110' : 'text-neutral-400 hover:text-white'}`}
    >
      {React.cloneElement(icon, { className: `w-6 h-6` })}
      <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-[#FDE047]' : 'hidden'}`}>{label}</span>
    </button>
  );
};