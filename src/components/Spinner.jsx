export default function Spinner({ inline = false }) {
  return (
    <div className={`flex items-center justify-center ${inline ? 'py-12' : 'min-h-dvh'}`}>
      <div className="size-10 animate-spin rounded-full border-4 border-primary-soft border-t-primary" />
    </div>
  )
}
