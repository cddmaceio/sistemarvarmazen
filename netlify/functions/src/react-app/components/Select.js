"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Select = void 0;
const react_1 = __importDefault(require("react"));
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/react-app/lib/utils");
const Select = react_1.default.forwardRef(({ className, children, placeholder, ...props }, ref) => {
    return (<div className="relative">
        <select className={(0, utils_1.cn)('flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none', className)} ref={ref} {...props}>
          {placeholder && (<option value="" disabled>
              {placeholder}
            </option>)}
          {children}
        </select>
        <lucide_react_1.ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none"/>
      </div>);
});
exports.Select = Select;
Select.displayName = 'Select';
