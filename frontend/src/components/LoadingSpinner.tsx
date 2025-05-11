interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner = ({ message = "Loading..." }: LoadingSpinnerProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="w-10 h-10 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-lg font-medium">{message}</p>
    </div>
  );
}; 