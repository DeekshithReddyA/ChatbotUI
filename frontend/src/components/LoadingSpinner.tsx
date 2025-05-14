interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  centered?: boolean;
}

export const LoadingSpinner = ({ 
  message = "Loading...", 
  size = 'medium',
  centered = true 
}: LoadingSpinnerProps) => {
  const spinnerSizeClass = {
    small: 'w-5 h-5 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4'
  }[size];

  return (
    <div className={`flex flex-col items-center ${centered ? 'justify-center min-h-[200px]' : 'py-4'}`}>
      <div className={`${spinnerSizeClass} border-t-accent border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-3`}></div>
      {message && <p className="text-muted-foreground font-medium text-sm">{message}</p>}
    </div>
  );
}; 