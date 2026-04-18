import { useState, useEffect } from 'react'

function Drawer({ isOpen, onClose, title, children }) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(onClose, 300)
  }

  if (!isOpen && !isAnimating) return null

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-[#22170e] transition-opacity duration-300 ${
          isAnimating ? 'opacity-30' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[#d9cebc] bg-[color-mix(in_srgb,#fffdf8_90%,white)] shadow-2xl backdrop-blur-md transition-transform duration-300 ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ece2d4] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#1f1c17]">{title}</h2>
          <button
            onClick={handleClose}
            className="rounded-md p-1 text-[#8a7a67] transition hover:bg-[#f7ecdf] hover:text-[#1f1c17]"
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </>
  )
}

export default Drawer
