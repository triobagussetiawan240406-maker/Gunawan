'use client'
import dynamic from 'next/dynamic'

const Editor = dynamic(() => import('@monaco-editor/react').then((mod) => mod.default), {
  loading: () => <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">Loading editor...</div>,
  ssr: false
})

interface CodeEditorProps {
  value: string
  onChange: (value: string | undefined) => void
  language?: 'python' | 'javascript' | 'typescript'
  height?: string
  theme?: 'light' | 'dark'
  readOnly?: boolean
}

export function CodeEditor({
  value,
  onChange,
  language = 'python',
  height = '400px',
  theme = 'light',
  readOnly = false
}: CodeEditorProps) {
  return (
    <div className="rounded-lg border border-gray-300 overflow-hidden">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={onChange}
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'Fira Code', 'Monaco', monospace",
          autoIndent: 'advanced',
          scrollBeyondLastLine: false,
          tabSize: 2,
          wordWrap: 'on',
          lineNumbers: 'on'
        }}
      />
    </div>
  )
}
