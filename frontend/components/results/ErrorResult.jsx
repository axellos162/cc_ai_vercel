export default function ErrorResult({ message }) {
  return (
    <div className="text-text-secondary">
      <div className="flex items-start gap-2 mb-2">
        <span className="text-text-tertiary">×</span>
        <p className="font-body text-sm">{message}</p>
      </div>
      <p className="font-body text-xs text-text-tertiary ml-5">
        Try rephrasing your query or check the example suggestions.
      </p>
    </div>
  )
}
