import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/Button';

export default function ResetButton() {
  const handleReset = () => {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
    });
    
    // Redirect to reset page
    window.location.href = '/?reset=true';
  };

  return (
    <Button
      onClick={handleReset}
      variant="outline"
      size="sm"
      className="fixed bottom-4 right-4 z-50 bg-red-100 border-red-300 text-red-700 hover:bg-red-200"
      title="Limpar dados e ir para login"
    >
      <RotateCcw className="h-4 w-4 mr-2" />
      Reset Login
    </Button>
  );
}
