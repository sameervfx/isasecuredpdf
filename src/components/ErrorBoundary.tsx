import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in PDF Suite:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Application Exception Caught</h2>
            <p className="text-xs text-slate-400 mb-6">
              The application encountered a runtime error. Details are displayed below for debugging:
            </p>

            <div className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 text-left mb-6 overflow-x-auto max-h-48">
              <p className="text-xs font-mono text-rose-400 font-bold mb-1">
                {this.state.error?.name}: {this.state.error?.message}
              </p>
              {this.state.errorInfo?.componentStack && (
                <pre className="text-[10px] font-mono text-slate-500 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  window.location.reload();
                }}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('isa_editor_unlocked');
                  } catch (e) {}
                  window.location.href = window.location.pathname;
                }}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition active:scale-95"
              >
                <span>🏠 Return to Home Landing Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
