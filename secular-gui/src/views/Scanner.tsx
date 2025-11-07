import { useState } from 'react';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Search, AlertTriangle, CheckCircle, Folder, File } from 'lucide-react';

interface SecretMatch {
  kind: string;
  line: number;
  column: number;
  match_text: string;
  file_path?: string;
}

interface ScanResult {
  total_secrets: number;
  secrets: SecretMatch[];
}

export default function Scanner() {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ScanResult | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>('');

  const selectPath = async (isDirectory: boolean) => {
    try {
      const selected = await open({
        directory: isDirectory,
        multiple: false,
      });

      if (selected) {
        setSelectedPath(selected as string);
      }
    } catch (error) {
      console.error('Failed to select path:', error);
    }
  };

  const runScan = async () => {
    if (!selectedPath) return;

    setScanning(true);
    setResults(null);

    try {
      const result = await invoke<ScanResult>('scan_for_secrets', {
        path: selectedPath,
      });
      setResults(result);
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setScanning(false);
    }
  };

  const getSeverityColor = (kind: string) => {
    const critical = ['AwsSecretKey', 'PrivateKey', 'StripeKey'];
    const high = ['AwsAccessKey', 'GitHubToken', 'GcpApiKey'];

    if (critical.includes(kind)) return 'text-red-400';
    if (high.includes(kind)) return 'text-orange-400';
    return 'text-yellow-400';
  };

  const formatKind = (kind: string) => {
    return kind.replace(/([A-Z])/g, ' $1').trim();
  };

  return (
    <div className="page-container">
      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="page-title">Secret Scanner</h1>
      </motion.div>

      {/* Scanner Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-hero"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="icon-container-lg">
            <Search className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="card-title">Scan for Secrets</h3>
            <p className="text-sm text-tertiary mt-1">Detect exposed credentials and sensitive data</p>
          </div>
        </div>

        <div className="content-gap">
          <div className="grid grid-cols-2 card-gap">
            <button
              onClick={() => selectPath(false)}
              className="btn-secondary h-16"
            >
              <File className="w-5 h-5" />
              Select File
            </button>
            <button
              onClick={() => selectPath(true)}
              className="btn-secondary h-16"
            >
              <Folder className="w-5 h-5" />
              Select Directory
            </button>
          </div>

          {selectedPath && (
            <div className="card-standard">
              <div className="text-sm font-medium text-secondary mb-2">Selected Path:</div>
              <div className="text-base font-mono text-primary truncate">{selectedPath}</div>
            </div>
          )}

          <button
            onClick={runScan}
            disabled={!selectedPath || scanning}
            className="btn-primary w-full h-14"
          >
            {scanning ? (
              <>
                <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search className="w-6 h-6" />
                Start Security Scan
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Results */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-hero"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className={`icon-container-lg ${results.total_secrets === 0 ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                {results.total_secrets === 0 ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-yellow-400" />
                )}
              </div>
              <div>
                <h3 className="card-title">
                  {results.total_secrets === 0 ? 'Scan Complete - Clean' : 'Scan Complete'}
                </h3>
                <p className="text-sm text-tertiary mt-1">
                  {results.total_secrets === 0 ? 'No vulnerabilities detected' : 'Security issues found'}
                </p>
              </div>
            </div>
            <div className={`metric-value ${results.total_secrets === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
              {results.total_secrets}
            </div>
          </div>

          {results.total_secrets > 0 && (
            <div className="content-gap max-h-[600px] overflow-y-auto pr-2">
              {results.secrets.map((secret, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card-standard"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="icon-container-md bg-red-500/20">
                        <AlertTriangle className={`w-5 h-5 ${getSeverityColor(secret.kind)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-lg font-semibold ${getSeverityColor(secret.kind)}`}>
                          {formatKind(secret.kind)}
                        </div>
                        {secret.file_path && (
                          <div className="text-sm text-tertiary font-mono mt-1 truncate">
                            {secret.file_path}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="metric-change status-info border whitespace-nowrap">
                      Line {secret.line}:{secret.column}
                    </div>
                  </div>
                  <div className="card-compact mt-4 bg-slate-900/50">
                    <code className="text-sm text-cyan-300 break-all font-mono">
                      {secret.match_text}
                    </code>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {results.total_secrets === 0 && (
            <div className="text-center py-16">
              <div className="icon-container-lg mx-auto mb-6 bg-green-500/20">
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
              <p className="text-lg text-secondary">No secrets detected in the scanned files</p>
              <p className="text-sm text-tertiary mt-2">Your code is secure</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
