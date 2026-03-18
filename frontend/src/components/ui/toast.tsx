import { useStore } from "@/store/useStore";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function ToastContainer() {
  const { toasts, removeToast } = useStore();
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div key={t.id} className={cn("flex items-start gap-3 p-4 rounded-lg shadow-lg border text-sm animate-in slide-in-from-right-full",
          t.type==='success' && 'bg-green-50 border-green-200 text-green-800',
          t.type==='error' && 'bg-red-50 border-red-200 text-red-800',
          t.type==='warning' && 'bg-yellow-50 border-yellow-200 text-yellow-800',
          t.type==='info' && 'bg-blue-50 border-blue-200 text-blue-800',
        )}>
          {t.type==='success' && <CheckCircle className="h-5 w-5 flex-shrink-0" />}
          {t.type==='error' && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
          {t.type==='warning' && <AlertTriangle className="h-5 w-5 flex-shrink-0" />}
          {t.type==='info' && <Info className="h-5 w-5 flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="font-medium">{t.title}</p>
            {t.message && <p className="mt-0.5 text-xs opacity-80">{t.message}</p>}
          </div>
          <button onClick={() => removeToast(t.id)} className="flex-shrink-0 opacity-60 hover:opacity-100"><X className="h-4 w-4" /></button>
        </div>
      ))}
    </div>
  );
}
