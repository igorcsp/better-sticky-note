import { useCodeMirror } from './useCodeMirror'

interface Props {
  initialDoc: string
  onChange: (text: string) => void
  onBlur?: () => void
}

export default function NoteEditor({ initialDoc, onChange, onBlur }: Props) {
  const { parentRef } = useCodeMirror({ initialDoc, onChange, onBlur })

  return <div ref={parentRef} className="min-h-0 flex-1 overflow-hidden" />
}
