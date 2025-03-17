"use client";

import { useState, useEffect } from 'react';
import { isMockModeEnabled } from '@/utils/mock-data';

export default function EnvTestPage() {
  const [envVars, setEnvVars] = useState<{[key: string]: string | boolean}>({});
  
  useEffect(() => {
    // Collect all environment variables that start with NEXT_PUBLIC_
    const vars: {[key: string]: string | boolean} = {};
    
    // Add all environment variables
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('NEXT_PUBLIC_')) {
        vars[key] = process.env[key] as string;
      }
    });
    
    // Add computed values
    vars['isMockModeEnabled()'] = isMockModeEnabled();
    vars['isMockModeEnabled source'] = `process.env.NEXT_PUBLIC_ENABLE_MOCK_MODE === 'true'`;
    vars['process.env.NEXT_PUBLIC_ENABLE_MOCK_MODE'] = process.env.NEXT_PUBLIC_ENABLE_MOCK_MODE as string;
    vars['typeof process.env.NEXT_PUBLIC_ENABLE_MOCK_MODE'] = typeof process.env.NEXT_PUBLIC_ENABLE_MOCK_MODE;
    
    setEnvVars(vars);
  }, []);
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variable Test</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Mock Mode Check</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="font-medium">isMockModeEnabled()</div>
          <div className={`font-mono ${envVars['isMockModeEnabled()'] ? 'text-red-500' : 'text-green-500'}`}>
            {String(envVars['isMockModeEnabled()'])}
          </div>
        </div>
        
        <h2 className="text-xl font-semibold mb-4">All Environment Variables</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Key</th>
                <th className="border p-2 text-left">Value</th>
                <th className="border p-2 text-left">Type</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(envVars).map(([key, value]) => (
                <tr key={key} className="border-b">
                  <td className="border p-2 font-mono text-sm">{key}</td>
                  <td className="border p-2 font-mono text-sm">{String(value)}</td>
                  <td className="border p-2 font-mono text-sm">{typeof value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 