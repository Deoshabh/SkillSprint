import { ImageResponse } from 'next/og'
 
// Route segment config - temporarily disabled due to OpenTelemetry conflicts
// export const runtime = 'edge'
 
// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/svg+xml'
 
// Image generation
export default function Icon() {
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
      <rect width="32" height="32" fill="#ffffff"/>
      <g transform="translate(4,4) scale(0.75,0.75)">
        <path d="M8 6L18 12L8 22L4 18L12 12L4 6L8 6Z" fill="#000000"/>
        <path d="M18 6L22 6L22 18L18 22L18 12L18 6Z" fill="#000000"/>
        <path d="M4 18L12 18L18 22L4 22L4 18Z" fill="#000000"/>
      </g>
    </svg>`,
    {
      headers: {
        'Content-Type': 'image/svg+xml',
      },
    }
  )
}