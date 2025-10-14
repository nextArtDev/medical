'use client'

import Image from 'next/image'
import React from 'react'

export default function ToothGlassHero() {
  return (
    <section className="relative w-full h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-pink-200 via-rose-300 to-orange-200">
      {/* Glass layer with tooth cutout */}
      <Image
        src={'/images/9.jpg'}
        fill
        alt=""
        className="object-cover mask-conic-to-muted mix-blend-darken"
      />
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="toothMask">
            {/* White = visible (frosted), Black = transparent cutout */}
            <rect width="100%" height="100%" fill="white" />
            <path
              d="M6.34,5.95c3.14-3.02,7.01-4.76,11.33-5.37c4.41-0.62,9.29-0.05,14.32,1.55c2.76,0.88,4.91,1.62,6.67,2.23 c3.33,1.15,5.12,1.78,6.74,1.78c1.95,0.01,4.3-0.84,9.39-2.66c1.58-0.57,3.31-1.19,3.48-1.25c4.4-1.55,8.68-2.32,12.62-2.23 c3.98,0.09,7.62,1.03,10.7,2.89c4.38,2.65,6.8,6.2,8.05,10.23c1.2,3.84,1.3,8.04,1.07,12.29c-0.33,6.13-1.39,12.13-3.19,17.99 c-1.72,5.61-4.11,11.09-7.16,16.45c1.55,9.74,1.98,18.5,1.71,26.24c-0.27,7.99-1.26,14.88-2.51,20.63 c-1.36,6.3-3.32,11.17-5.49,13.69c-1.24,1.44-2.63,2.26-4.13,2.36c-1.59,0.1-3.09-0.59-4.42-2.19c-1.86-2.24-3.55-6.67-4.81-13.78 c-0.35-1.97-0.55-4.14-0.64-5.08l-0.03-0.27l0,0l-0.06-0.56c-1.38-14-2.74-27.78-15.03-27.92c-5.86,1.34-8.95,4.1-10.67,8.18 c-1.88,4.47-2.33,10.72-2.85,18.36l0,0.03c-0.07,1.06-0.31,4.63-0.74,7.23c-1.19,7.21-2.9,11.7-4.8,13.95 c-1.33,1.56-2.82,2.25-4.41,2.16c-1.5-0.08-2.9-0.88-4.14-2.3c-2.19-2.5-4.14-7.35-5.39-13.73c-1.03-5.27-1.82-12.26-2.22-20.83 c-0.35-7.56-0.39-16.36-0.02-26.3c-2.11-4.83-3.99-9.69-5.52-14.6c-1.58-5.08-2.79-10.23-3.49-15.48 c-0.58-4.39-1.02-8.41-0.43-12.26C0.9,13.31,2.61,9.55,6.34,5.95L6.34,5.95z"
              fill="black"
              transform="translate(200,100) scale(2.5)"
              style={{
                scale:
                  typeof window !== 'undefined' && window.innerWidth < 768
                    ? 0.6
                    : 1.2,
              }}
            />
          </mask>
        </defs>

        {/* Glass rectangle with blur */}
        <rect
          width="100%"
          height="100%"
          mask="url(#toothMask)"
          fill="rgba(255,255,255,0.4)"
          style={{
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
          }}
        />
      </svg>

      {/* Content example */}
      <div className="relative z-10 text-center text-white drop-shadow-lg">
        <h1 className="text-6xl font-bold mb-4">Dental Studio</h1>
        <p className="text-lg opacity-90">
          Modern dental care experience with clarity and comfort.
        </p>
      </div>
    </section>
  )
}
