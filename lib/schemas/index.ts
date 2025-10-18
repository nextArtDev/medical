import z from 'zod'

export const reviewFormSchema = z.object({
  rating: z
    .number({
      required_error: 'A rating is required.',
      invalid_type_error: 'Rating must be a number.',
    })
    .int({ message: 'Rating must be a whole number (e.g., 1, 2, 3, 4, or 5).' })
    .min(1, { message: 'Rating must be at least 1.' })
    .max(5, { message: 'Rating cannot be greater than 5.' }),

  reviewText: z
    .string()
    .min(10, { message: 'Review must be at least 10 characters long.' })
    .max(100, { message: 'Review must be no more than 100 characters long.' }),
})
export type ReviewFormValues = z.infer<typeof reviewFormSchema>

export const fullReviewDataSchema = z.object({
  appointmentId: z.string().uuid({
    message: 'A valid appointment ID is required.',
  }),

  doctorId: z.string().uuid({
    message: 'A valid doctor ID is required.',
  }),

  patientId: z.string().uuid({
    message: 'A valid patient ID is required.',
  }),

  rating: z
    .number({
      required_error: 'A rating is required.',
      invalid_type_error: 'Rating must be a number.',
    })
    .int({ message: 'Rating must be a whole number (e.g., 1, 2, 3, 4, or 5).' })
    .min(1, { message: 'Rating must be at least 1.' })
    .max(5, { message: 'Rating cannot be greater than 5.' }),

  reviewText: z
    .string()
    .min(10, { message: 'Review must be at least 10 characters long.' })
    .max(100, { message: 'Review must be no more than 100 characters long.' }),
})
