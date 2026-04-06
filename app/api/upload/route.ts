import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { auth } from '@clerk/nextjs/server'

const f = createUploadthing()

// Define upload routes
export const ourFileRouter = {
  // Player profile photo
  profilePhoto: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async () => {
      const { userId } = await auth()
      if (!userId) throw new Error('Unauthorized')
      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('[uploadthing] Profile photo uploaded:', file.url, 'by', metadata.userId)
      return { url: file.url, uploadedBy: metadata.userId }
    }),

  // Highlight reel video
  highlightReel: f({ video: { maxFileSize: '256MB', maxFileCount: 1 } })
    .middleware(async () => {
      const { userId } = await auth()
      if (!userId) throw new Error('Unauthorized')
      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('[uploadthing] Highlight reel uploaded:', file.url, 'by', metadata.userId)
      return { url: file.url, uploadedBy: metadata.userId }
    }),

  // Match clips (up to 3)
  matchClips: f({ video: { maxFileSize: '128MB', maxFileCount: 3 } })
    .middleware(async () => {
      const { userId } = await auth()
      if (!userId) throw new Error('Unauthorized')
      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('[uploadthing] Match clip uploaded:', file.url, 'by', metadata.userId)
      return { url: file.url, uploadedBy: metadata.userId }
    }),

  // Organisation logo
  orgLogo: f({ image: { maxFileSize: '2MB', maxFileCount: 1 } })
    .middleware(async () => {
      const { userId } = await auth()
      if (!userId) throw new Error('Unauthorized')
      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('[uploadthing] Org logo uploaded:', file.url, 'by', metadata.userId)
      return { url: file.url, uploadedBy: metadata.userId }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter

// UploadThing route handler
export { ourFileRouter as GET, ourFileRouter as POST }
