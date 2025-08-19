"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertDescription = exports.AlertTitle = exports.Alert = void 0;
const react_1 = __importDefault(require("react"));
const utils_1 = require("@/react-app/lib/utils");
const Alert = react_1.default.forwardRef(({ className, variant = 'default', ...props }, ref) => (<div ref={ref} role="alert" className={(0, utils_1.cn)('relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground', {
        'bg-background text-foreground': variant === 'default',
        'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive': variant === 'destructive',
    }, className)} {...props}/>));
exports.Alert = Alert;
Alert.displayName = 'Alert';
const AlertTitle = react_1.default.forwardRef(({ className, ...props }, ref) => (<h5 ref={ref} className={(0, utils_1.cn)('mb-1 font-medium leading-none tracking-tight', className)} {...props}/>));
exports.AlertTitle = AlertTitle;
AlertTitle.displayName = 'AlertTitle';
const AlertDescription = react_1.default.forwardRef(({ className, ...props }, ref) => (<div ref={ref} className={(0, utils_1.cn)('text-sm [&_p]:leading-relaxed', className)} {...props}/>));
exports.AlertDescription = AlertDescription;
AlertDescription.displayName = 'AlertDescription';
