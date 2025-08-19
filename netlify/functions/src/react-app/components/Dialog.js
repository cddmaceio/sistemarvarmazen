"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DialogDescription = exports.DialogTitle = exports.DialogHeader = exports.DialogContent = exports.Dialog = void 0;
const react_1 = __importDefault(require("react"));
const utils_1 = require("@/react-app/lib/utils");
const Dialog = ({ open, onOpenChange, children }) => {
    if (!open)
        return null;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)}/>
      <div className="relative z-50 w-full max-w-lg mx-4">
        {children}
      </div>
    </div>);
};
exports.Dialog = Dialog;
const DialogContent = react_1.default.forwardRef(({ className, children, ...props }, ref) => (<div ref={ref} className={(0, utils_1.cn)('bg-background p-6 shadow-lg duration-200 rounded-lg border', className)} {...props}>
    {children}
  </div>));
exports.DialogContent = DialogContent;
DialogContent.displayName = 'DialogContent';
const DialogHeader = react_1.default.forwardRef(({ className, ...props }, ref) => (<div ref={ref} className={(0, utils_1.cn)('flex flex-col space-y-1.5 text-center sm:text-left mb-4', className)} {...props}/>));
exports.DialogHeader = DialogHeader;
DialogHeader.displayName = 'DialogHeader';
const DialogTitle = react_1.default.forwardRef(({ className, ...props }, ref) => (<h2 ref={ref} className={(0, utils_1.cn)('text-lg font-semibold leading-none tracking-tight', className)} {...props}/>));
exports.DialogTitle = DialogTitle;
DialogTitle.displayName = 'DialogTitle';
const DialogDescription = react_1.default.forwardRef(({ className, ...props }, ref) => (<p ref={ref} className={(0, utils_1.cn)('text-sm text-muted-foreground', className)} {...props}/>));
exports.DialogDescription = DialogDescription;
DialogDescription.displayName = 'DialogDescription';
