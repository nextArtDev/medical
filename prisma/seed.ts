import {
  PrismaClient,
  Role,
  LeaveType,
  PatientType,
  AppointmentStatus,
  PaymentStatus,
} from '../lib/generated/prisma'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

const NUM_DOCTORS = 5
const NUM_PATIENTS = 20
const NUM_APPOINTMENTS = 50
const NUM_DEPARTMENTS = 6
const NUM_FAQS = 5

async function main() {
  console.log('Start seeding...')

  // --- Cleanup: Delete existing data to start fresh ---
  // Order of deletion is important due to foreign key constraints
  await prisma.paymentDetails.deleteMany()
  await prisma.order.deleteMany()
  await prisma.doctorTestimonial.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.doctorLeave.deleteMany()
  await prisma.doctorProfile.deleteMany()
  await prisma.user.deleteMany()
  await prisma.workingDay.deleteMany()
  await prisma.fAQ.deleteMany()
  await prisma.department.deleteMany()
  await prisma.appSettings.deleteMany()
  console.log('Database cleaned.')

  // --- 1. Seed Simple, Independent Tables ---

  // App Settings
  await prisma.appSettings.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      slotsPerHour: 2,
      startTime: '09:00',
      endTime: '17:00',
      slotReservationDuration: 10,
    },
  })

  // Working Days (Monday to Friday)
  for (let i = 1; i <= 5; i++) {
    await prisma.workingDay.create({
      data: {
        dayOfWeek: i, // 1=Monday, 5=Friday
        isWorkingDay: true,
      },
    })
  }
  console.log('Seeded AppSettings and WorkingDays.')

  // Departments
  const departmentNames = [
    'Cardiology',
    'Dermatology',
    'Neurology',
    'Pediatrics',
    'Orthopedics',
    'General Practice',
  ]
  const departments = await Promise.all(
    departmentNames.map((name) =>
      prisma.department.create({
        data: {
          name,
          iconName: faker.helpers.arrayElement([
            'heart',
            'stethoscope',
            'brain',
            'baby',
            'bone',
          ]),
        },
      })
    )
  )
  console.log(`Seeded ${departments.length} departments.`)

  // FAQs
  const faqs = await Promise.all(
    Array.from({ length: NUM_FAQS }).map((_, i) =>
      prisma.fAQ.create({
        data: {
          question: `Is this a common question ${i + 1}?`,
          answer: faker.lorem.sentences(2),
          order: i + 1,
        },
      })
    )
  )
  console.log(`Seeded ${faqs.length} FAQs.`)

  // --- 2. Seed Users (Doctors, Patients, Admin) ---
  const doctorUsers = await Promise.all(
    Array.from({ length: NUM_DOCTORS }).map(() =>
      prisma.user.create({
        data: {
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          email: faker.internet.email(),
          role: Role.doctor,
          isActive: true,
        },
      })
    )
  )

  const patientUsers = await Promise.all(
    Array.from({ length: NUM_PATIENTS }).map(() =>
      prisma.user.create({
        data: {
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          email: faker.internet.email(),
          role: Role.user,
          dateOfBirth: faker.date.past({ years: 60, refDate: '2000-01-01' }),
          phoneNumber: faker.phone.number(),
          isActive: true,
        },
      })
    )
  )

  // Create one admin user
  const adminUser = await prisma.user.create({
    data: {
      id: faker.string.uuid(),
      name: 'Admin User',
      email: 'admin@example.com',
      role: Role.admin,
      isRootAdmin: true,
      isActive: true,
    },
  })
  console.log(
    `Seeded ${doctorUsers.length} doctors, ${patientUsers.length} patients, and 1 admin.`
  )

  // --- 3. Seed Doctor Profiles ---
  await Promise.all(
    doctorUsers.map((doctor) =>
      prisma.doctorProfile.create({
        data: {
          userId: doctor.id,
          specialty: faker.helpers.arrayElement(departments).name,
          brief: faker.lorem.paragraph(),
          credentials: `MD, ${faker.helpers.arrayElement([
            'PhD',
            'Board Certified',
          ])}`,
          specializations: faker.helpers.arrayElements(
            ['Hypertension', 'ECG', 'Angioplasty', 'Acne', 'Eczema'],
            { min: 1, max: 3 }
          ),
          rating: faker.number.float({ min: 3.5, max: 5.0 }),
          reviewCount: faker.number.int({ min: 10, max: 200 }),
        },
      })
    )
  )
  console.log('Seeded doctor profiles.')

  // --- 4. Seed Doctor Leaves ---
  await Promise.all(
    doctorUsers.slice(0, 3).map(
      (
        doctor // Give leaves to the first 3 doctors
      ) =>
        prisma.doctorLeave.create({
          data: {
            doctorId: doctor.id,
            leaveDate: faker.date.future({ years: 0.5 }),
            leaveType: faker.helpers.arrayElement(Object.values(LeaveType)),
            reason: faker.lorem.sentence(),
          },
        })
    )
  )
  console.log('Seeded doctor leaves.')

  // --- 5. Seed Appointments ---
  const appointments = await Promise.all(
    Array.from({ length: NUM_APPOINTMENTS }).map(() => {
      const doctor = faker.helpers.arrayElement(doctorUsers)
      const patient = faker.helpers.arrayElement(patientUsers)
      const startDate = faker.date.past({ years: 1 })
      const endDate = new Date(startDate.getTime() + 30 * 60000) // 30 min appointment

      return prisma.appointment.create({
        data: {
          doctorId: doctor.id,
          userId: patient.id,
          patientType: PatientType.MYSELF,
          patientName: patient.name,
          appointmentStartUTC: startDate,
          appointmentEndUTC: endDate,
          phoneNumber: patient.phoneNumber,
          reasonForVisit: faker.lorem.sentence(),
          status: faker.helpers.arrayElement(Object.values(AppointmentStatus)),
        },
      })
    })
  )
  console.log(`Seeded ${appointments.length} appointments.`)

  // --- 6. Seed Testimonials for Completed Appointments ---
  const completedAppointments = appointments.filter(
    (apt) => apt.status === AppointmentStatus.COMPLETED
  )
  await Promise.all(
    completedAppointments.slice(0, 15).map((appointment) =>
      prisma.doctorTestimonial.create({
        data: {
          appointmentId: appointment.appointmentId,
          doctorId: appointment.doctorId,
          patientId: appointment.userId!,
          testimonialText: faker.lorem.paragraph(),
          rating: faker.number.float({ min: 4.0, max: 5.0 }),
          isPending: false,
        },
      })
    )
  )
  console.log(`Seeded testimonials for completed appointments.`)

  // --- 7. Seed Orders and Payment Details ---
  await Promise.all(
    appointments.map((appointment) =>
      prisma.order.create({
        data: {
          appointmentId: appointment.appointmentId,
          doctorId: appointment.doctorId,
          amount: faker.number.float({ min: 50, max: 300 }),
          currency: 'USD',
          notes: faker.lorem.sentence({ min: 1, max: 3 }),
          paymentStatus: faker.helpers.arrayElement(
            Object.values(PaymentStatus)
          ),
          paidAt:
            appointment.status === AppointmentStatus.COMPLETED
              ? faker.date.past({ years: 1 })
              : null,
        },
      })
    )
  )
  console.log('Seeded orders.')

  const orders = await prisma.order.findMany()
  await Promise.all(
    orders.map((order) =>
      prisma.paymentDetails.create({
        data: {
          orderId: order.id,
          userId: order.doctorId, // Linking to doctor for simplicity, can be patient
          status: order.paymentStatus,
          amount: order.amount,
          Authority: faker.string.alphanumeric(10),
          transactionId: faker.string.alphanumeric(15),
        },
      })
    )
  )
  console.log('Seeded payment details.')

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
