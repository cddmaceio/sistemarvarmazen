"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUpload = FileUpload;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const Button_1 = require("@/react-app/components/Button");
const utils_1 = require("@/react-app/lib/utils");
function FileUpload({ onFileUpload, accept = '.csv,.xlsx,.xls', className, uploadedFileName, onRemoveFile }) {
    const fileInputRef = (0, react_1.useRef)(null);
    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            onFileUpload(file);
        }
    };
    const handleClick = () => {
        fileInputRef.current?.click();
    };
    if (uploadedFileName) {
        return (<div className={(0, utils_1.cn)("flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg", className)}>
        <div className="flex items-center space-x-2">
          <lucide_react_1.FileText className="h-4 w-4 text-green-600"/>
          <span className="text-sm text-green-800 font-medium">{uploadedFileName}</span>
        </div>
        {onRemoveFile && (<Button_1.Button type="button" variant="ghost" size="sm" onClick={onRemoveFile} className="h-6 w-6 p-0 text-green-600 hover:text-green-700">
            <lucide_react_1.X className="h-4 w-4"/>
          </Button_1.Button>)}
      </div>);
    }
    return (<div className={(0, utils_1.cn)("relative", className)}>
      <input ref={fileInputRef} type="file" onChange={handleFileChange} accept={accept} className="hidden"/>
      <div onClick={handleClick} className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
        <lucide_react_1.Upload className="h-8 w-8 text-gray-400 mb-2"/>
        <p className="text-sm text-gray-600 text-center">
          <span className="font-medium text-blue-600">Clique para fazer upload</span>
          <br />
          ou arraste o arquivo aqui
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Formatos aceitos: CSV, Excel
        </p>
      </div>
    </div>);
}
