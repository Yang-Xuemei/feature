import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  componentStack: string;
  copied: boolean;
}

// Catches render/lifecycle errors that would otherwise white-screen the app.
// Logs the full error to the console AND shows the details on screen with a
// copy button, so the user can copy the error and paste it into the chat to
// get it fixed.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: '', copied: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[app] React render error:', error);
    console.error('[app] Component stack:', info.componentStack);
    this.setState({ componentStack: info.componentStack ?? '' });
  }

  private buildReport(): string {
    const { error, componentStack } = this.state;
    return [
      `Error: ${error?.message ?? 'Unknown error'}`,
      '',
      'Stack:',
      error?.stack ?? '(no stack)',
      '',
      'Component stack:',
      componentStack || '(no component stack)',
    ].join('\n');
  }

  private handleCopy = async (): Promise<void> => {
    const report = this.buildReport();
    try {
      await navigator.clipboard.writeText(report);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      // Clipboard API unavailable (e.g. non-secure context) — select-all fallback.
      const ta = document.createElement('textarea');
      ta.value = report;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }
  };

  render(): ReactNode {
    const { error, copied } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        style={{
          padding: 24,
          fontFamily: '"ZCOOL XiaoWei", "Noto Serif SC", serif',
          maxWidth: 900,
          margin: '40px auto',
          backgroundColor: '#F5EFE6',
          minHeight: '100vh',
        }}
      >
        <h1 style={{
          fontSize: 22,
          marginBottom: 8,
          color: '#8B2635',
          letterSpacing: '0.2em',
          fontWeight: 700,
          borderBottom: '1px solid #6B4423',
          paddingBottom: 8,
        }}>
          應 · 用 · 有 · 誤
        </h1>
        <p style={{
          margin: '8px 0 16px',
          color: '#4A3F2A',
          fontSize: 14,
          letterSpacing: '0.08em',
        }}>
          復制以下錯誤信息 · 粘貼到對話裡 · 吾將為君修之。
        </p>
        <button
          type="button"
          onClick={this.handleCopy}
          style={{
            marginBottom: 12,
            padding: '8px 18px',
            fontSize: 14,
            cursor: 'pointer',
            borderRadius: 2,
            border: '1px solid #6B1D28',
            background: copied ? '#5B7F62' : '#8B2635',
            color: '#F5EFE6',
            letterSpacing: '0.15em',
            fontWeight: 600,
            fontFamily: 'inherit',
          }}
        >
          {copied ? '已 · 復制' : '復制錯誤信息'}
        </button>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            background: '#E8DCC4',
            border: '1px solid #6B4423',
            borderRadius: 2,
            padding: 16,
            fontSize: 12,
            color: '#2C2416',
            maxHeight: 400,
            overflow: 'auto',
            fontFamily: 'monospace',
          }}
        >
          {this.buildReport()}
        </pre>
      </div>
    );
  }
}
