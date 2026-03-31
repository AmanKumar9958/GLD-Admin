import { cn } from '../../lib/utils'

export const Spinner = ({ className, size = 'md', label = 'Loading' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-10 w-10 border-4',
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-gray-300 border-t-gray-700',
        sizeClasses[size] || sizeClasses.md,
        className,
      )}
      role="status"
      aria-label={label}
    />
  )
}
