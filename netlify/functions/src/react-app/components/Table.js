"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableCaption = exports.TableCell = exports.TableRow = exports.TableHead = exports.TableFooter = exports.TableBody = exports.TableHeader = exports.Table = void 0;
const react_1 = __importDefault(require("react"));
const utils_1 = require("@/react-app/lib/utils");
const Table = react_1.default.forwardRef(({ className, ...props }, ref) => (<div className="relative w-full overflow-auto">
    <table ref={ref} className={(0, utils_1.cn)('w-full caption-bottom text-sm', className)} {...props}/>
  </div>));
exports.Table = Table;
Table.displayName = 'Table';
const TableHeader = react_1.default.forwardRef(({ className, ...props }, ref) => (<thead ref={ref} className={(0, utils_1.cn)('[&_tr]:border-b', className)} {...props}/>));
exports.TableHeader = TableHeader;
TableHeader.displayName = 'TableHeader';
const TableBody = react_1.default.forwardRef(({ className, ...props }, ref) => (<tbody ref={ref} className={(0, utils_1.cn)('[&_tr:last-child]:border-0', className)} {...props}/>));
exports.TableBody = TableBody;
TableBody.displayName = 'TableBody';
const TableFooter = react_1.default.forwardRef(({ className, ...props }, ref) => (<tfoot ref={ref} className={(0, utils_1.cn)('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', className)} {...props}/>));
exports.TableFooter = TableFooter;
TableFooter.displayName = 'TableFooter';
const TableRow = react_1.default.forwardRef(({ className, ...props }, ref) => (<tr ref={ref} className={(0, utils_1.cn)('border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', className)} {...props}/>));
exports.TableRow = TableRow;
TableRow.displayName = 'TableRow';
const TableHead = react_1.default.forwardRef(({ className, ...props }, ref) => (<th ref={ref} className={(0, utils_1.cn)('h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0', className)} {...props}/>));
exports.TableHead = TableHead;
TableHead.displayName = 'TableHead';
const TableCell = react_1.default.forwardRef(({ className, ...props }, ref) => (<td ref={ref} className={(0, utils_1.cn)('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)} {...props}/>));
exports.TableCell = TableCell;
TableCell.displayName = 'TableCell';
const TableCaption = react_1.default.forwardRef(({ className, ...props }, ref) => (<caption ref={ref} className={(0, utils_1.cn)('mt-4 text-sm text-muted-foreground', className)} {...props}/>));
exports.TableCaption = TableCaption;
TableCaption.displayName = 'TableCaption';
