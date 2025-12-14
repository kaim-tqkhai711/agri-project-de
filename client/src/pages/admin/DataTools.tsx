import { useState, useRef, useEffect } from "react";
import { Database, Play, HardDriveUpload, HardDriveDownload, TerminalSquare, AlertTriangle, CheckCircle2, Loader2, XCircle, Trash, RefreshCw } from "lucide-react";
import { AdminService } from "../../services/product.service";

// Định nghĩa cấu trúc Log chuẩn
interface LogEntry {
  id: number;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

const DataTools = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processType, setProcessType] = useState<'gen'|'backup'|'restore'|null>(null);
  
  // Ref để tự động scroll terminal
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll khi có log mới
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Hàm thêm log chuẩn
  const addLog = (message: string, type: 'info'|'success'|'warning'|'error' = 'info') => {
    const entry: LogEntry = {
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString('vi-VN', { hour12: false }),
      type,
      message
    };
    setLogs(prev => [...prev, entry]); // Thêm vào cuối mảng
  };

  const clearLogs = () => setLogs([]);

  // --- 1. GENERATE DATA (Giả lập Big Data Simulation) ---
  const handleGenerate = async () => {
    if (isProcessing) return;
    setIsProcessing(true); 
    setProcessType('gen');
    clearLogs();

    addLog("INIT: Khởi động quy trình sinh dữ liệu mẫu (Mocking)...", 'warning');
    
    // Giả lập quy trình bất đồng bộ
    const steps = [
        { msg: "Connecting to MongoDB Cluster...", delay: 500 },
        { msg: "Connection Established. Latency: 24ms", delay: 1000, type: 'success' },
        { msg: "Reading Schema: ProductModel...", delay: 1500 },
        { msg: "Generating 1000 batches (500 docs/batch)...", delay: 2000 },
        { msg: "Writing to 'products' collection...", delay: 2500 },
        { msg: "Writing to 'farms' collection...", delay: 3000 },
        { msg: "Indexing field: 'qrCode' (Text Index)...", delay: 4000 },
        { msg: "DONE: Đã sinh thành công 500,000 bản ghi giả lập!", delay: 5000, type: 'success' }
    ];

    for (const step of steps) {
        await new Promise(r => setTimeout(r, step.delay - (steps[steps.indexOf(step)-1]?.delay || 0)));
        addLog(step.msg, (step.type as any) || 'info');
    }

    setIsProcessing(false); 
    setProcessType(null);
  };

  // --- 2. BACKUP DATABASE ---
  const handleBackup = async () => {
    if (isProcessing) return;
    setIsProcessing(true); 
    setProcessType('backup');
    clearLogs();

    addLog("SYSTEM: Bắt đầu sao lưu dữ liệu (Mongodump)...", 'warning');
    addLog("Sending Request to Backend API...");

    try {
        const res = await AdminService.backupDB();
        
        // Xử lý log trả về từ server
        if (res.data && res.data.log) {
            const lines = res.data.log.split('\n');
            lines.forEach((line: string) => {
                if(line.trim()) addLog(`SERVER: ${line}`, 'success');
            });
        } else {
            addLog("Backup hoàn tất (Server không trả về chi tiết).", 'success');
        }
    } catch (error: any) {
        console.error(error);
        const msg = error.response?.data?.message || error.message || "Lỗi kết nối";
        addLog(`ERROR: ${msg}`, 'error');
    } finally {
        setIsProcessing(false); 
        setProcessType(null);
    }
  };

  // --- 3. RESTORE DATABASE ---
  const handleRestore = async () => {
    if (isProcessing) return;
    
    if (!window.confirm("NGUY HIỂM: Hành động này sẽ GHI ĐÈ toàn bộ dữ liệu hiện tại bằng bản backup mới nhất. Bạn có chắc chắn?")) return;

    setIsProcessing(true); 
    setProcessType('restore');
    clearLogs();

    addLog("WARNING: Đang thực hiện khôi phục dữ liệu...", 'warning');
    addLog("Stopping Write Operations...");

    try {
        const res = await AdminService.restoreDB();
        
        if (res.data && res.data.log) {
            const lines = res.data.log.split('\n');
            lines.forEach((line: string) => {
                if(line.trim()) addLog(`SERVER: ${line}`, 'success');
            });
        } else {
            addLog("Khôi phục dữ liệu thành công.", 'success');
        }
    } catch (error: any) {
        const msg = error.response?.data?.message || error.message || "Lỗi kết nối";
        addLog(`FATAL: ${msg}`, 'error');
    } finally {
        setIsProcessing(false); 
        setProcessType(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <Database className="text-emerald-600" size={28} />
                Data Engineering Tools
            </h2>
            <p className="text-gray-500 mt-1 text-sm">Bộ công cụ quản trị hệ thống Big Data (Backup, Restore, Seeding).</p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ToolCard 
            title="Generate Mock Data"
            desc="Giả lập sinh 500k bản ghi để test hiệu năng (Client-side Simulation)."
            icon={Play}
            color="text-blue-600" bg="bg-blue-50"
            onClick={handleGenerate}
            btnText="Generate Data"
            isLoading={processType === 'gen'}
        />
        <ToolCard 
            title="Backup Database"
            desc="Tạo Snapshot toàn bộ Database và lưu vào thư mục /backups trên Server."
            icon={HardDriveUpload}
            color="text-amber-600" bg="bg-amber-50"
            onClick={handleBackup}
            btnText="Start Backup"
            isLoading={processType === 'backup'}
        />
        <ToolCard 
            title="Restore Database"
            desc="Khôi phục dữ liệu từ bản sao lưu gần nhất (Nguy hiểm: Ghi đè dữ liệu)."
            icon={HardDriveDownload}
            color="text-red-600" bg="bg-red-50"
            onClick={handleRestore}
            btnText="Restore Data"
            isLoading={processType === 'restore'}
        />
      </div>

      {/* Terminal UI */}
      <div className="bg-[#1e1e1e] rounded-xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col h-[450px]">
        {/* Terminal Header */}
        <div className="bg-[#2d2d2d] px-4 py-2 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center gap-2">
                <TerminalSquare size={16} className="text-gray-400"/>
                <span className="text-xs font-mono font-bold text-gray-300">ADMIN@SERVER:~/AGRI-TRACE/TOOLS</span>
            </div>
            <div className="flex gap-2">
                <button onClick={clearLogs} className="p-1 hover:bg-white/10 rounded text-gray-400" title="Clear Console">
                    <Trash size={14}/>
                </button>
                <div className="flex gap-1.5 ml-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
            </div>
        </div>
        
        {/* Terminal Body */}
        <div className="flex-1 p-4 font-mono text-[13px] overflow-y-auto custom-scrollbar relative">
            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] pointer-events-none z-10"></div>

            {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50 select-none">
                   <TerminalSquare size={48} className="mb-3 opacity-20" />
                   <p>System Ready. Waiting for commands...</p>
                </div>
            ) : (
                <div className="space-y-1 relative z-0">
                    {logs.map((log) => (
                        <div key={log.id} className="flex gap-3">
                            <span className="text-gray-500 shrink-0 select-none">[{log.time}]</span>
                            <span className="flex-1 break-all">
                                {log.type === 'info' && <span className="text-blue-400">➜ </span>}
                                {log.type === 'success' && <span className="text-green-500">✔ </span>}
                                {log.type === 'warning' && <span className="text-yellow-500">⚠ </span>}
                                {log.type === 'error' && <span className="text-red-500">✖ </span>}
                                <span className={
                                    log.type === 'success' ? 'text-green-400' :
                                    log.type === 'warning' ? 'text-yellow-400' :
                                    log.type === 'error' ? 'text-red-400 font-bold' : 'text-gray-300'
                                }>
                                    {log.message}
                                </span>
                            </span>
                        </div>
                    ))}
                    {/* Dummy element để scroll xuống */}
                    <div ref={terminalEndRef} />
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---
const ToolCard = ({ title, desc, icon: Icon, color, bg, onClick, btnText, isLoading }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group relative overflow-hidden">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform ${color}`}>
        <Icon size={80} />
      </div>
      
      <div className={`w-12 h-12 ${bg} ${color} rounded-lg flex items-center justify-center mb-4`}>
        <Icon size={24} />
      </div>
      <h3 className="font-bold text-lg text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 h-10">{desc}</p>
      
      <button 
        onClick={onClick} 
        disabled={isLoading}
        className={`w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : `${bg} ${color} hover:brightness-95`}`}
      >
        {isLoading ? <><Loader2 size={16} className="animate-spin"/> Processing...</> : <>{btnText}</>}
      </button>
    </div>
);

export default DataTools;