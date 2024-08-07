import BookingForm from '@/components/frontend/BookingForm/BookingForm'
import Books from '@/components/frontend/BookingForm/Books'
import ChatBook from '@/components/frontend/BookingForm/ChatBook'
import ChatBook2 from '@/components/frontend/BookingForm/ChatBook2'
import ChatBook3 from '@/components/frontend/BookingForm/ChatBook3'
import ChatBook4 from '@/components/frontend/BookingForm/ChatBook4'
import Availability from '@/components/frontend/yt-booking/Availability'

export default function Home() {
  return (
    <section className="min-h-screen w-screen flex  flex-col items-center justify-center h-full ">
      {/* Main one */}
      <ChatBook4 />
      {/* <BookingForm /> */}
      {/* <Books />
      <section className="my-20">
        <ChatBook3 />
      </section>
      <ChatBook />
      <section className="h-full w-full my-20">
        <h1>Booking2</h1>
        <ChatBook2 />
      </section> */}
      <Availability />
    </section>
  )
}
