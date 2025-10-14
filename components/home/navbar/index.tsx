'use client'
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from './Navbar'
import { useState } from 'react'

export function NavbarDemo() {
  const navItems = [
    {
      name: 'Features',
      link: '#features',
    },
    {
      name: 'Pricing',
      link: '#pricing',
    },
    {
      name: 'Contact',
      link: '#contact',
    },
  ]

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="relative w-full">
      <Navbar className="top-1">
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-4">
            <NavbarButton variant="secondary">Login</NavbarButton>
            <NavbarButton variant="primary">Book a call</NavbarButton>
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-600 dark:text-neutral-300"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full flex-col gap-4">
              <NavbarButton
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                className="w-full"
              >
                Login
              </NavbarButton>
              <NavbarButton
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                className="w-full"
              >
                Book a call
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
      {/* <DummyContent /> */}

      {/* Navbar */}
    </div>
  )
}

// const DummyContent = () => {
//   return (
//     <div className="relative   mx-auto p-8  ">
//       {/* Hidden SVG for clip path definition */}
//       <svg
//         width="0"
//         height="0"
//         className="absolute fill-transparent stroke-transparent bg-transparent"
//       >
//         <defs>
//           <clipPath id="heroClipPath" clipPathUnits="objectBoundingBox">
//             <path d="M0.973,0 C0.986,0 1,0.012 1,0.027 V0.974 C1,0.986 0.986,1 0.973,1 H0.027 C0.012,1 0,0.986 0,0.974 V0.027 C0,0.012 0.012,0 0.027,0 H0.973 Z M0.501,0.249 C0.357,0.249 0.24,0.361 0.24,0.5 C0.24,0.606 0.309,0.697 0.405,0.734 H0.378 C0.36,0.734 0.346,0.747 0.346,0.764 V0.83 C0.346,0.847 0.36,0.861 0.378,0.861 H0.625 C0.643,0.861 0.657,0.847 0.657,0.83 V0.764 C0.657,0.747 0.643,0.734 0.625,0.734 H0.597 C0.694,0.697 0.762,0.606 0.762,0.5 C0.762,0.361 0.645,0.249 0.501,0.249 Z M0.597,0.734 C0.567,0.745 0.535,0.751 0.501,0.751 C0.467,0.751 0.435,0.745 0.405,0.734 H0.597 Z" />
//           </clipPath>
//         </defs>
//       </svg>

//       {/* Hero content container */}
//       <div className="w-full  ">
//         {/* Glass effect container with clip path */}
//         <div
//           className="relative w-full h-96 md:h-[500px] rounded-lg overflow-hidden"
//           style={{
//             clipPath: 'url(#heroClipPath)',
//           }}
//         >
//           {/* Background image */}
//           <div
//             className="absolute inset-0 bg-cover bg-center"
//             style={{
//               backgroundImage:
//                 'url(https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80)',
//             }}
//           ></div>

//           {/* Glass effect overlay */}
//           <div className="absolute inset-0 bg-white/10 backdrop-blur-md border border-white/20"></div>
//         </div>
//       </div>
//       <h1 className="mb-4 text-center text-3xl font-bold">
//         Check the navbar at the top of the container
//       </h1>
//       <p className="mb-10 text-center text-sm text-zinc-500">
//         For demo purpose we have kept the position as{' '}
//         <span className="font-medium">Sticky</span>. Keep in mind that this
//         component is <span className="font-medium">fixed</span> and will not
//         move when scrolling.
//       </p>
//       <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
//         {[
//           {
//             id: 1,
//             title: 'The',
//             width: 'md:col-span-1',
//             height: 'h-60',
//             bg: 'bg-neutral-100 dark:bg-neutral-800',
//           },
//           {
//             id: 2,
//             title: 'First',
//             width: 'md:col-span-2',
//             height: 'h-60',
//             bg: 'bg-neutral-100 dark:bg-neutral-800',
//           },
//           {
//             id: 3,
//             title: 'Rule',
//             width: 'md:col-span-1',
//             height: 'h-60',
//             bg: 'bg-neutral-100 dark:bg-neutral-800',
//           },
//           {
//             id: 4,
//             title: 'Of',
//             width: 'md:col-span-3',
//             height: 'h-60',
//             bg: 'bg-neutral-100 dark:bg-neutral-800',
//           },
//           {
//             id: 5,
//             title: 'F',
//             width: 'md:col-span-1',
//             height: 'h-60',
//             bg: 'bg-neutral-100 dark:bg-neutral-800',
//           },
//           {
//             id: 6,
//             title: 'Club',
//             width: 'md:col-span-2',
//             height: 'h-60',
//             bg: 'bg-neutral-100 dark:bg-neutral-800',
//           },
//           {
//             id: 7,
//             title: 'Is',
//             width: 'md:col-span-2',
//             height: 'h-60',
//             bg: 'bg-neutral-100 dark:bg-neutral-800',
//           },
//           {
//             id: 8,
//             title: 'You',
//             width: 'md:col-span-1',
//             height: 'h-60',
//             bg: 'bg-neutral-100 dark:bg-neutral-800',
//           },
//           {
//             id: 9,
//             title: 'Do NOT TALK about',
//             width: 'md:col-span-2',
//             height: 'h-60',
//             bg: 'bg-neutral-100 dark:bg-neutral-800',
//           },
//           {
//             id: 10,
//             title: 'F Club',
//             width: 'md:col-span-1',
//             height: 'h-60',
//             bg: 'bg-neutral-100 dark:bg-neutral-800',
//           },
//         ].map((box) => (
//           <div
//             key={box.id}
//             className={`${box.width} ${box.height} ${box.bg} flex items-center justify-center rounded-lg p-4 shadow-sm`}
//           >
//             <h2 className="text-xl font-medium">{box.title}</h2>
//           </div>
//         ))}
//       </div>
//     </div>
//   )
// }
