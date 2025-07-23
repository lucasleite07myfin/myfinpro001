"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CalendarWithDropdownProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  className?: string
}

export function CalendarWithDropdown({ 
  date, 
  onDateChange,
  className 
}: CalendarWithDropdownProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date || new Date())

  const handleDateSelect = (newDate: Date | undefined) => {
    setSelectedDate(newDate)
    onDateChange?.(newDate)
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <Calendar
        mode="single"
        defaultMonth={selectedDate}
        selected={selectedDate}
        onSelect={handleDateSelect}
        className="rounded-lg border shadow-sm bg-background"
      />
    </div>
  )
}
