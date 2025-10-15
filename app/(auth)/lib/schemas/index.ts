import z from 'zod'

export const authFormSchema = z.object({
  phone: z
    .string()
    .max(14, { message: 'شماره تلفن نمی‌تواند از 12 رقم بیشتر باشد!' }),
  code: z.string(),
})

export const signInFormSchema = authFormSchema.pick({ phone: true })
export const otpInFormSchema = authFormSchema.pick({ code: true })
