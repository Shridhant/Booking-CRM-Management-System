
interface ThreeDotsLoaderProps {
  color?: string
  size?: string
  className?: string
}

export default function ThreeDotsLoader({ 
  color = "bg-indigo-600", 
  size = "w-3 h-3",
  className = "py-8"
}: ThreeDotsLoaderProps) {
  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      <span className={`${size} animate-bounce rounded-full ${color}`}></span>
      <span className={`${size} animate-bounce rounded-full ${color} [animation-delay:0.2s]`}></span>
      <span className={`${size} animate-bounce rounded-full ${color} [animation-delay:0.4s]`}></span>
    </div>
  )
}
