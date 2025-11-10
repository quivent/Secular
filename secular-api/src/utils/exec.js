import { exec } from 'child_process';

// Security: Shell escape function
export function shellEscape(arg) {
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

// Security: Validate alphanumeric names (for friend names, remote names)
export function isValidName(name) {
  return /^[a-zA-Z0-9_-]+$/.test(name);
}

// Security: Validate Node IDs (Radicle format)
export function isValidNodeId(nid) {
  // Radicle Node IDs start with did:key:z6Mk or just z6Mk
  return /^(did:key:)?z6Mk[a-zA-Z0-9]+$/.test(nid);
}

// Security: Validate paths (no command injection)
export function isValidPath(p) {
  // Reject paths with shell metacharacters
  return !/[;&|`$<>()]/.test(p);
}

// Helper to execute shell commands
export function execPromise(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        // With 2>&1, stderr goes to stdout, so check stdout for error details
        const errorOutput = stdout || stderr || error.message;
        reject({ error: error.message, stderr, stdout, errorOutput });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}
