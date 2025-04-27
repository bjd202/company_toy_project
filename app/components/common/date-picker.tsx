import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, getMonth, getYear, setMonth, setYear } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export function DatePicker({
  name,
  value,
  onChange,
}: {
  name: string;
  value?: Date;
  onChange: (date: Date | undefined) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState(new Date());

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const startYear = getYear(new Date()) - 20;
  const endYear = getYear(new Date()) + 20;
  const years = Array.from({length: endYear - startYear + 1}, (_, i) => startYear + i);

  const handleMonthChange = (month: string) => {
    const newDate = setMonth(date, months.indexOf(month));
    setDate(newDate);
  }

  const handleYearChange = (year: string) => {
    const newDate = setYear(date, parseInt(year));
    setDate(newDate);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "yyyy-MM-dd") : <span>날짜 선택</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="flex justify-between p-2">
          <Select
            onValueChange={handleYearChange}
            value={getYear(date).toString()}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="연" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {years.map((year) => {
                  return <SelectItem key={year} value={year.toString()}>{`${(year)}년`}</SelectItem>
                })}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            onValueChange={handleMonthChange}
            value={months[getMonth(date)]}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="월" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {months.map((month, i) => {
                  return <SelectItem key={month} value={month}>{`${(i+1)}월`}</SelectItem>
                })}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          locale={ko}
          // fromDate={new Date()}
          month={date}
          initialFocus
        />
      </PopoverContent>
      <input
        type="hidden"
        name={name}
        value={value ? format(value, "yyyy-MM-dd") : ""}
      />
    </Popover>
  );
}
