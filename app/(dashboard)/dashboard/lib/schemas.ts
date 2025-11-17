import z from 'zod'
import * as LucideIcons from 'lucide-react'

const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4MB
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]

export const addBannerSchema = z.object({
  name: z.string().min(1, 'Banner name is required.'),
  bannerImageFile: z
    .instanceof(File, { message: 'Banner image is required.' })
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max image size is 4MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      'Only .jpg, .jpeg, .png, .gif and .webp formats are supported.'
    ),
})

const validIconNames = Object.keys(LucideIcons).filter(
  (key) =>
    typeof LucideIcons[key as keyof typeof LucideIcons] === 'object' &&
    key !== 'createReactComponent' &&
    key !== 'icons' &&
    key !== 'LucideIcon' &&
    key !== 'LucideProps' &&
    !key.includes('Logo') &&
    [
      'Heart',
      'Brain',
      'Eye',
      'Stethoscope',
      'Thermometer',
      'Activity',
      'Scissors',
      'Bone',
      'Baby',
      'Pill',
      'Syringe',
      'Bandage',
      'Microscope',
      'ClipboardList',
      'Users',
      'FlaskConical',
      'Dna',
      'Ear',
      'PersonStanding',
    ].includes(key)
) as (keyof typeof LucideIcons)[]

export const addDepartmentSchema = z.object({
  name: z
    .string()
    .min(3, 'Department name must be at least 3 characters')
    .max(50, 'Department name cannot exceed 50 characters'),
  iconName: z
    .string()
    .min(1, 'Icon selection is required.')
    .refine(
      (name) => validIconNames.includes(name as keyof typeof LucideIcons),
      {
        message: 'Invalid icon selected.',
      }
    ),
})

export const editDepartmentSchema = z.object({
  name: z
    .string()
    .min(3, 'Department name must be at least 3 characters')
    .max(50, 'Department name cannot exceed 50 characters'),
  iconName: z
    .string()
    .min(1, 'Icon selection is required.')
    .refine(
      (name) => validIconNames.includes(name as keyof typeof LucideIcons),
      {
        message: 'Invalid icon selected.',
      }
    ),
})

export const addDoctorFormSchema = z.object({
  name: z.string().min(3, 'Doctor name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  credentials: z.string().min(1, 'Credentials are required'),
  specialty: z.string().min(1, 'Department/Specialty is required'),
  languages: z.string().min(1, 'Languages are required'), // Expecting comma-separated string
  specializations: z.string().min(1, 'Specializations are required'), // Expecting comma-separated string
  brief: z.string().min(10, 'About Doctor must be at least 10 characters'),
  imageUrl: z.string().url('Invalid image URL').optional(),
})

export const editDoctorFormSchema = z.object({
  name: z.string().min(3, 'Doctor name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  credentials: z.string().min(1, 'Credentials are required'),
  specialty: z.string().min(1, 'Department/Specialty is required'),
  languages: z.string().min(1, 'Languages are required'),
  specializations: z.string().min(1, 'Specializations are required'),
  brief: z.string().min(10, 'About Doctor must be at least 10 characters'),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
})

export const addAdminFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z
    .string()
    .email('Invalid email address')
    .min(3, 'Email must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  // Role is assigned on the server, not submitted via form
})

export const editAdminFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
})
