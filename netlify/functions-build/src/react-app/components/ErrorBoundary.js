import { Component } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/Card';
import { Alert, AlertDescription } from '@/react-app/components/Alert';
import { AlertTriangle } from 'lucide-react';
class ErrorBoundary extends Component {
    state = {
        hasError: false
    };
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (<Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5"/>
              Erro no Componente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-red-200">
              <AlertDescription className="text-red-700">
                Ocorreu um erro ao renderizar este componente. 
                {this.state.error?.message && (<div className="mt-2 text-sm font-mono bg-red-100 p-2 rounded">
                    {this.state.error.message}
                  </div>)}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>);
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
