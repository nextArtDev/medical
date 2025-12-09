'use client'

import { useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useDoctorsInfiniteParams } from '@/lib/trpc/doctors/hooks/use-doctors-params'
import { useDoctorFilterOptions } from '@/lib/trpc/doctors/hooks/use-filter-options'
import { Button } from '@/components/ui/button'

interface DoctorFilterProps {
  title: string
  className?: string
  children: React.ReactNode
}

const DoctorFilter = ({ title, className, children }: DoctorFilterProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const Icon = isOpen ? ChevronDownIcon : ChevronRightIcon

  return (
    <div className={cn('p-4 border-b flex flex-col gap-2', className)}>
      <div
        onClick={() => setIsOpen((current) => !current)}
        className="flex items-center justify-between cursor-pointer"
      >
        <p className="font-medium">{title}</p>
        <Icon className="size-5" />
      </div>
      {isOpen && children}
    </div>
  )
}

export const DoctorFilters = () => {
  const [filters, setFilters] = useDoctorsInfiniteParams()

  const hasAnyFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'sort') return false

    if (Array.isArray(value)) {
      return value.length > 0
    }

    if (typeof value === 'string') {
      return value !== ''
    }

    return value !== null
  })

  const onClear = () => {
    setFilters({
      search: '',
      specialty: [],
    })
  }

  const onChange = (key: keyof typeof filters, value: unknown) => {
    setFilters({ ...filters, [key]: value })
  }

  return (
    <div className="border rounded-md bg-white">
      <div className="p-4 border-b flex items-center justify-between">
        <p className="font-medium">Filters</p>
        {hasAnyFilters && (
          <button
            className="underline cursor-pointer"
            onClick={() => onClear()}
            type="button"
          >
            Clear
          </button>
        )}
      </div>
      <DoctorFilter title="Specialty">
        <div className="gap-2 flex flex-wrap">
          {useDoctorFilterOptions().data?.specializations.map((item) => {
            const isSelected = filters.specialty.includes(item.value)

            const handleToggle = () => {
              if (isSelected) {
                // Remove from array
                onChange(
                  'specialty',
                  filters.specialty.filter((s) => s !== item.value)
                )
              } else {
                // Add to array
                onChange('specialty', [...filters.specialty, item.value])
              }
            }

            return (
              <Button
                key={item.value}
                onClick={handleToggle}
                variant={isSelected ? 'default' : 'outline'}
                className="cursor-pointer"
              >
                {item.label} ({item.count})
              </Button>
            )
          })}
        </div>
      </DoctorFilter>
    </div>
  )
}
