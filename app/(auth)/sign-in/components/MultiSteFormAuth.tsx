'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { PhoneInput } from '@/components/ui/phone-input'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Phone,
  Shield,
  LucideIcon,
  Loader,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { SlidingNumber } from './SlidingTimer'

// Schemas
const phoneSchema = z.object({
  phone: z.string().min(10, 'شماره موبایل معتبر وارد کنید'),
})

const otpSchema = z.object({
  code: z
    .string()
    .min(6, 'کد تایید باید ۶ رقم باشد')
    .max(6, 'کد تایید باید ۶ رقم باشد'),
})

// Types
type PhoneFormData = z.infer<typeof phoneSchema>
type OtpFormData = z.infer<typeof otpSchema>

interface FormStep {
  id: 'phone' | 'otp'
  title: string
  description: string
  schema: z.ZodSchema<unknown>
  icon: LucideIcon
}

// Better-auth response types
// interface BetterAuthData<T> {
//   data: T
//   error: null
// }

// interface BetterAuthError {
//   data: null
//   error: {
//     message: string
//     code?: string
//   }
// }

// type BetterAuthResponse<T> = BetterAuthData<T> | BetterAuthError

interface MultiStepFormAuthProps {
  className?: string
}

export default function MultiStepFormAuth({
  className,
}: // onSuccess,
MultiStepFormAuthProps) {
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<0 | 1>(0)
  const [phoneNumber, setPhoneNumber] = useState<string>('')
  const [otpValue, setOtpValue] = useState<string>('')
  const [otpKey, setOtpKey] = useState<number>(0)
  const [isSuccess, setIsSuccess] = useState<boolean>(false)
  const [countdown, setCountdown] = useState(180)

  const router = useRouter()
  // Define steps
  const steps: FormStep[] = [
    {
      id: 'phone',
      title: 'تایید شماره موبایل',
      // description: 'شماره موبایل خود را وارد کنید',
      description: 'شماره موبایل خود را وارد کنید.',
      schema: phoneSchema,
      icon: Phone,
    },
    {
      id: 'otp',
      title: 'کد تایید',
      // description: 'کد ارسال شده را وارد کنید',
      description: '',
      schema: otpSchema,
      icon: Shield,
    },
  ]

  const currentStep = steps[step]

  useEffect(() => {
    if (step === 1 && countdown > 0) {
      const timerId = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1)
      }, 1000)

      // Cleanup function to clear the interval when the component unmounts
      // or when the step changes or countdown reaches 0.
      return () => clearInterval(timerId)
    }
  }, [step, countdown])

  // Form setup with proper typing
  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: phoneNumber },
  })

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: otpValue },
  })

  // Use the appropriate form based on current step
  const form = step === 0 ? phoneForm : otpForm

  const {
    // register,
    // handleSubmit,
    // formState: { errors },
    // setValue,
    // reset,
  } = form

  const progress = ((step + 1) / steps.length) * 100

  // Handle phone submission
  const handlePhoneSubmit = (data: PhoneFormData): void => {
    startTransition(async () => {
      try {
        const result = await authClient.phoneNumber.sendOtp({
          phoneNumber: data.phone,
        })
        console.log({ result })
        if (result.error) {
          toast.error(result.error.message || 'خطا در ارسال کد')
        } else {
          setPhoneNumber(data.phone)
          setStep(1)
          setOtpValue('')
          setOtpKey((prev) => prev + 1)
          otpForm.reset({ code: '' })
          setCountdown(180)
          toast.success('کد تایید ارسال شد')
        }
      } catch (error) {
        console.error('Phone submission error:', error)
        toast.error('خطا در ارسال کد تایید')
      }
    })
  }

  // Handle OTP submission
  const handleOtpSubmit = (data: OtpFormData): void => {
    if (!phoneNumber) {
      toast.error('شماره تلفن یافت نشد')
      return
    }

    startTransition(async () => {
      try {
        const result = await authClient.phoneNumber.verify({
          phoneNumber,
          code: data.code,
        })

        if (result.error) {
          // OTP not found
          toast.error(
            result.error.message === 'Invalid OTP'
              ? 'کد وارد شده اشتباه است!'
              : result.error.message === 'OTP not found'
              ? 'کد تایید منقضی شده است.'
              : result.error.message === 'Too many attempts'
              ? 'تعداد وارد کردن کد بیش از حد مجاز است!'
              : 'لطفا دوباره تلاش کنید.'
          )
          // toast.error(result.error.message || 'کد وارد شده اشتباه است')
          // Reset OTP on error
          setOtpValue('')
          setOtpKey((prev) => prev + 1)
          otpForm.setValue('code', '')
        } else {
          setIsSuccess(true)
          toast.success('تایید موفقیت‌آمیز بود!')
          // onSuccess?.()
          router.refresh()
        }
      } catch (error) {
        console.error('OTP verification error:', error)
        toast.error('خطا در تایید کد')
        setOtpValue('')
        setOtpKey((prev) => prev + 1)
        otpForm.setValue('code', '')
      }
    })
  }

  // Form submit handler
  const handleFormSubmit =
    step === 0
      ? phoneForm.handleSubmit(handlePhoneSubmit)
      : otpForm.handleSubmit(handleOtpSubmit)

  // Handle back button
  const handlePrevStep = (): void => {
    if (step === 1) {
      setStep(0)
      setOtpValue('')
      setOtpKey((prev) => prev + 1)
      phoneForm.reset({ phone: phoneNumber })
    }
  }

  // Handle resend OTP
  const handleResendOtp = (): void => {
    if (!phoneNumber) {
      toast.error('شماره تلفن یافت نشد!')
      return
    }
    if (countdown > 0) {
      toast.info(`لطفا ${countdown} ثانیه دیگر دوباره تلاش کنید.`)
      return
    }

    startTransition(async () => {
      try {
        const result = await authClient.phoneNumber.sendOtp({
          phoneNumber,
        })

        if (result.error) {
          toast.error(result.error.message || 'خطا در ارسال مجدد کد!')
        } else {
          setOtpValue('')
          setOtpKey((prev) => prev + 1)
          otpForm.setValue('code', '')
          setCountdown(180)
          toast.success('کد تایید مجدداً ارسال شد!')
        }
      } catch (error) {
        console.error('Resend OTP error:', error)
        toast.error('خطا در ارسال مجدد کد!')
      }
    })
  }

  // Handle phone input change
  const handlePhoneChange = (value: string): void => {
    phoneForm.setValue('phone', value)
  }

  // Handle OTP change
  const handleOtpChange = (value: string): void => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6)
    setOtpValue(numericValue)
    otpForm.setValue('code', numericValue)
  }

  // Reset form
  // const resetForm = (): void => {
  //   setStep(0)
  //   setPhoneNumber('')
  //   setOtpValue('')
  //   setOtpKey(0)
  //   setIsSuccess(false)
  //   phoneForm.reset({ phone: '' })
  //   otpForm.reset({ code: '' })
  // }

  // Animation variants
  const variants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  }

  const phoneError = phoneForm.formState.errors.phone?.message
  const codeError = otpForm.formState.errors.code?.message

  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60

  return (
    <div
      className={cn(
        'mx-auto w-full max-w-md rounded-none border  p-6 shadow-lg bg-card/5 backdrop-blur-2xl text-white ',
        className
      )}
      dir="rtl"
    >
      {!isSuccess ? (
        <>
          {/* Step indicators */}
          <div className=" flex justify-between">
            {steps.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={s.id} className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-10 w-10 border-indigo-600 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors mb-2',
                      i < step
                        ? 'border-indigo-600 bg-indigo-600 text-muted dark:text-white/80'
                        : i === step
                        ? 'border-indigo-600 bg-indigo-600 text-primary-foreground'
                        : 'border-muted bg-muted text-muted-foreground'
                    )}
                  >
                    {i < step ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="mt-2 hidden text-xs font-medium text-muted dark:text-white/80 sm:block">
                    {s.title}
                  </span>
                </div>
              )
            })}
          </div>
          {/* Progress bar */}
          <div dir="rtl" className="mb-8">
            <Progress value={progress} className="h-2  " />
            <div className="my-2 flex justify-between">
              <span className="text-xs font-medium  dark:text-white/70">
                {step + 1}/{steps.length}
              </span>
              {/* <span className="text-sm font-medium text-muted dark:text-white/80">
                {Math.round(progress)}%
              </span> */}
            </div>
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={variants}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6 text-center">
                <h2 className="text-xl font-bold  ">{currentStep.title}</h2>
                <p className="text-sm text-muted dark:text-white/80">
                  {currentStep.description}
                </p>
                {step === 1 && phoneNumber && (
                  <p className="mt-2 text-sm text-indigo-900 dark:text-indigo-200">
                    کد تایید به شماره {phoneNumber} ارسال شد.
                  </p>
                )}
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {step === 0 ? (
                  <div className="space-y-2">
                    {/* <Label htmlFor="phone">شماره موبایل</Label> */}
                    <Label htmlFor="phone"></Label>
                    <div dir="ltr">
                      <PhoneInput
                        dir="ltr"
                        placeholder="09123456789"
                        defaultCountry="IR"
                        disabled={isPending}
                        className={cn(phoneError && 'border-destructive')}
                        onChange={handlePhoneChange}
                        onBlur={phoneForm.register('phone').onBlur}
                        value={phoneNumber}
                      />
                    </div>
                    {phoneError && (
                      <p className="text-center text-sm text-destructive">
                        {phoneError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 w-full flex item-center flex-col gap-2">
                    <Label htmlFor="code" className="text-center ">
                      {/* کد تایید: */}
                    </Label>
                    <div dir="ltr" className="flex justify-center">
                      <InputOTP
                        key={otpKey}
                        maxLength={6}
                        value={otpValue}
                        onChange={handleOtpChange}
                        disabled={isPending}
                        autoComplete="one-time-code"
                        inputMode="numeric"
                        onComplete={handleOtpChange}
                      >
                        <InputOTPGroup>
                          {Array.from({ length: 6 }, (_, index) => (
                            <InputOTPSlot key={index} index={index} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {codeError && (
                      <p className="text-center text-sm text-destructive">
                        {codeError}
                      </p>
                    )}
                  </div>
                )}

                {/* Resend OTP button */}
                {step === 1 && (
                  <div className="text-center flex flex-col gap-1">
                    {/* <p>مدت اعتبار کد 3 دقیقه می‌باشد.</p> */}
                    {countdown > 0 ? (
                      <div
                        className="flex items-center justify-center gap-1 text-lg font-mono text-indigo-300"
                        dir="ltr"
                      >
                        <SlidingNumber value={minutes} padStart />
                        <span>:</span>
                        <SlidingNumber value={seconds} padStart />
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="link"
                        onClick={handleResendOtp}
                        disabled={isPending}
                        className="text-sm text-white/80"
                      >
                        ارسال مجدد کد تایید
                      </Button>
                    )}
                  </div>
                )}
                {/* Navigation buttons */}
                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handlePrevStep}
                    disabled={step === 0 || isPending}
                    className={cn(
                      'rounded-xs border',
                      step === 0 && 'invisible'
                    )}
                  >
                    <ArrowRight className="ml-2 h-4 w-4" />
                    قبلی
                  </Button>

                  <Button
                    type="submit"
                    disabled={
                      isPending || (step === 1 && otpValue.length !== 6)
                    }
                    className="rounded-xs"
                  >
                    {isPending ? (
                      step === 0 ? (
                        <span className="flex gap-1">
                          <Loader className="animate-spin" />
                          <p>{'در حال ارسال...'}</p>
                        </span>
                      ) : (
                        <span className="flex gap-1">
                          <Loader className="animate-spin" />
                          <p>{'در حال بررسی...'}</p>
                        </span>
                      )
                    ) : step === 0 ? (
                      <>
                        بعدی
                        <ArrowLeft className="mr-2 h-4 w-4" />
                      </>
                    ) : (
                      'تایید'
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </AnimatePresence>
        </>
      ) : (
        /* Success message */
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="py-10 text-center"
        >
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full  ">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">تایید موفقیت‌آمیز!</h2>
          <p className="mb-6 text-muted dark:text-white/80">
            شماره موبایل شما با موفقیت تایید شد.
          </p>
        </motion.div>
      )}
    </div>
  )
}
