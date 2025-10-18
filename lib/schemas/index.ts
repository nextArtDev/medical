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

export const patientProfileUpdateSchema = z.object({
  name: z
    .string({
      required_error: 'Name is required.',
    })
    .min(3, { message: 'Name must be at least 3 characters long.' }),

  phoneNumber: z
    .string()
    .min(7, { message: 'Phone number must be at least 7 characters long.' })
    .max(20, { message: 'Phone number cannot be longer than 20 characters.' })
    .regex(/^[0-9+-]+$/, {
      message: "Phone number can only contain numbers, '+', or '-'.",
    })
    .optional(),

  address: z.string().optional(),

  dateOfBirth: z
    .string()
    .optional()
    .or(z.literal('')) // Allow empty string for optional field
    .refine(
      (date) => {
        if (!date) return true
        return new Date(date) <= new Date()
      },
      { message: 'Date of Birth cannot be in the future' }
    )
    .refine(
      (date) => {
        if (!date) return true
        const minDate = new Date()
        minDate.setFullYear(new Date().getFullYear() - 120)
        return new Date(date) >= minDate
      },
      { message: 'You must be younger than 120 years old to register' }
    ),
})
