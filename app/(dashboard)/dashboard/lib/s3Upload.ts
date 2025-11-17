'use server'
import prisma from '@/lib/prisma'
// import { revalidatePath } from 'next/cache'
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  PutBucketCorsCommand,
  // PutBucketCorsCommand,
} from '@aws-sdk/client-s3'

import { randomUUID } from 'crypto'
// import sharp from 'sharp'

const s3Client = new S3Client({
  region: process.env.NEXT_AWS_S3_REGION!,
  //   endpoint: process.env.LIARA_ENDPOINT!,
  endpoint: 'https://storage.iran.liara.space',
  //   endpointProvider: process.env.LIARA_ENDPOINT!,

  credentials: {
    accessKeyId: process.env.NEXT_AWS_S3_ACCESS_KEY_ID!,

    secretAccessKey: process.env.NEXT_AWS_S3_SECRET_ACCESS_KEY!,
  },
})

export async function setBucketCors() {
  const corsCommand = new PutBucketCorsCommand({
    Bucket: process.env.NEXT_AWS_S3_BUCKET_NAME,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET'],
          AllowedOrigins: [
            'http://localhost:3000',
            // 'https://kosar-clinic-mis.ir',
          ], // Note: http, not https, for localhost
          MaxAgeSeconds: 3000,
        },
      ],
    },
  })
  try {
    await s3Client.send(corsCommand)
    console.log('CORS policy applied successfully to the bucket')
    return { success: true }
  } catch (error) {
    console.error('Error setting CORS policy:', error)
    throw error
  }
}
export async function uploadFileToS3(file: Buffer, fileName: string) {
  const fileBuffer = file
  //   const fileBuffer = await sharp(file)
  //     .jpeg({ quality: 50 })
  //     .resize(800, 400)
  //     .toBuffer()
  if (!file || !fileName) return null

  const Key = `${fileName}.${randomUUID()}`
  const url = `https://mye-commerce.storage.iran.liara.space/${Key}`

  const command = new PutObjectCommand({
    Bucket: process.env.NEXT_AWS_S3_BUCKET_NAME,
    Key,
    Body: fileBuffer,
    // ContentType: 'image/jpg',
    ContentType: 'image/webp',
    ACL: 'public-read',
  })
  // const cors = new PutBucketCorsCommand({
  //   Bucket: process.env.NEXT_AWS_S3_BUCKET_NAME,
  //   CORSConfiguration: {
  //     CORSRules: [
  //       {
  //         AllowedHeaders: ['*'],
  //         AllowedMethods: ['GET'],
  //         AllowedOrigins: [
  //           'https://localhost:3000',
  //           'https://kosar-clinic-mis.ir',
  //         ],
  //         MaxAgeSeconds: 3000,
  //       },
  //     ],
  //   },
  // })
  try {
    await s3Client.send(command)

    const prismaUpload = await prisma.image.create({
      data: {
        key: Key,
        url,
      },
    })
    // console.log({ prismaUpload })

    // console.log('File uploaded successfully:', response)
    if (!prismaUpload) return
    return {
      imageId: prismaUpload?.id,
      imageKey: prismaUpload?.key,
      imageUrl: prismaUpload?.url,
    }
  } catch (error) {
    console.log(error)
    throw error
  }
}
export async function deleteFileFromS3(key: string) {
  const params = {
    Bucket: process.env.NEXT_AWS_S3_BUCKET_NAME,
    Key: key,
    ContentType: 'image/jpg',
  }

  const command = new DeleteObjectCommand(params)
  try {
    await s3Client.send(command)

    await prisma.image.deleteMany({
      where: {
        key,
      },
    })

    // console.log(response)

    // console.log('File uploaded successfully:', response)
    return {
      success: true,
    }
  } catch (error) {
    console.log(error)
    throw error
  }
}
