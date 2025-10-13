import { ThemeSwitcher } from '@/components/shared/theme-switcher'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <section className="relative min-h-screen w-screen flex  flex-col gap-10 items-center justify-center h-full ">
      <div className="absolute top-10">
        <ThemeSwitcher />
      </div>
      {/* <p
        style={
          {
            '--positive-shadow': '1px',
            '--negative-shadow': '-1px',
            '--zoom-shadow': '1px',
            '--foreground': '#33333360',
          } as React.CSSProperties
        }
        className=" shadow-neu-light dark:shadow-neu-dark wrap-break-word text-shadow-sky-300 rounded-3xl px-4 py-4 mx-auto max-w-md text-nue-shadow"
      >
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Veritatis
        inventore placeat perferendis similique? Quas esse quaerat aperiam minus
        officiis impedit hic aliquam, facilis commodi recusandae ullam.
        Quibusdam repellat molestiae assumenda!
      </p> */}
      <div className="neu-card-2 w-64 h-64 mx-auto flex flex-col">
        <div className="neu-card-3 w-32 h-32 !rounded-full mx-auto"></div>
      </div>
      {/* <Button className="mask-radial-from-transparent mask-radial-from-15% mask-radial-to-black mask-radial-to-55% mask-radial-at-right">
        Register
      </Button>
      <Button className="drop-shadow-xl drop-shadow-cyan-500/50">
        Register
      </Button> */}
    </section>
  )
}
