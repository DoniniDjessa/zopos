"use client";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmStyle?: "danger" | "warning" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  confirmStyle = "primary",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const confirmButtonClass = {
    danger: "bg-red-500 hover:bg-red-600 text-white",
    warning: "bg-orange-500 hover:bg-orange-600 text-white",
    primary: "bg-[#3B82F6] hover:bg-[#2563EB] text-white",
  }[confirmStyle];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-none shadow-2xl max-w-md w-full">
        <div className="p-6">
          <h3 className="font-serif text-xl font-bold text-[#0F172A] mb-3">
            {title}
          </h3>
          <p className="text-sm text-[#0F172A]/70 whitespace-pre-line">
            {message}
          </p>
        </div>
        <div className="p-4 border-t flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 bg-gray-200 text-[#0F172A] rounded-none 
                     hover:bg-gray-300 transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`px-4 py-1.5 rounded-none transition-colors font-medium ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
