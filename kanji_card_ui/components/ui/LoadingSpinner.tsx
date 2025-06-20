interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  overlay?: boolean;
}

export function LoadingSpinner({ size = 'medium', overlay = false }: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-16 w-16',
    large: 'h-32 w-32'
  };

  const spinner = (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full border-b-2 border-blue-500 ${sizeClasses[size]}`}></div>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`animate-spin rounded-full border-b-2 border-white ${sizeClasses[size]}`}></div>
      </div>
    );
  }

  if (size === 'large') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {spinner}
      </div>
    );
  }

  return spinner;
}