import { ThemeSwitcher } from '@/components/shared/theme-switcher'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <section className="min-h-screen w-screen flex  flex-col items-center justify-center h-full ">
      <ThemeSwitcher />
      <p className="bg-foreground text-primary rounded-3xl px-4 py-4">
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Veritatis
        inventore placeat perferendis similique? Quas esse quaerat aperiam minus
        officiis impedit hic aliquam, facilis commodi recusandae ullam.
        Quibusdam repellat molestiae assumenda!
      </p>
      <Button>Register</Button>
    </section>
  )
}
