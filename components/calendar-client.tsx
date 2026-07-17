'use client';

import { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, LogIn, LogOut, 
  Trash2, Building2, User, HelpCircle, CalendarDays 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { deleteBooking } from '@/app/actions/pms-actions';

interface CalendarClientProps {
  properties: any[];
  bookings: any[];
}

export default function CalendarClient({ properties, bookings }: CalendarClientProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Filter bookings based on selected property
  const filteredBookings = bookings.filter(b => 
    (selectedPropertyId === 'all' || b.propertyId === selectedPropertyId) &&
    b.status !== 'CANCELLED'
  );

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Generate calendar days for monthly grid (Desktop)
  const getDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days = [];
    
    // Day of the week of first day (0 = Sunday, 1 = Monday...)
    // Shift so Monday is index 0: (day + 6) % 7
    let firstDayIndex = date.getDay();
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    // Previous month days to pad
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    const totalDays = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month days to pad to make full weeks (multiple of 7)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const calendarDays = getDaysInMonth(currentYear, currentMonth);

  // Check if a specific property is occupied on a given date
  const getPropertyBookingForDate = (propertyId: string, date: Date) => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return bookings.find(b => {
      if (b.propertyId !== propertyId || b.status === 'CANCELLED') return false;
      const start = new Date(b.checkIn);
      start.setHours(0, 0, 0, 0);
      const end = new Date(b.checkOut);
      end.setHours(0, 0, 0, 0);
      return checkDate >= start && checkDate < end;
    });
  };

  // Generate dynamic agenda events for mobile timeline (Next 14 Days)
  const getAgendaTimeline = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const timelineDays: { date: Date; events: any[] }[] = [];
    
    // Generate events for the next 14 days
    for (let i = 0; i < 14; i++) {
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + i);
      targetDate.setHours(0, 0, 0, 0);
      
      const dayEvents: any[] = [];
      
      filteredBookings.forEach(booking => {
        const checkInDate = new Date(booking.checkIn);
        checkInDate.setHours(0, 0, 0, 0);
        
        const checkOutDate = new Date(booking.checkOut);
        checkOutDate.setHours(0, 0, 0, 0);
        
        const prop = properties.find(p => p.id === booking.propertyId);
        
        if (checkInDate.getTime() === targetDate.getTime()) {
          dayEvents.push({
            type: 'CHECK_IN',
            booking,
            property: prop,
          });
        }
        
        if (checkOutDate.getTime() === targetDate.getTime()) {
          dayEvents.push({
            type: 'CHECK_OUT',
            booking,
            property: prop,
          });
        }
      });
      
      if (dayEvents.length > 0) {
        timelineDays.push({
          date: targetDate,
          events: dayEvents,
        });
      }
    }
    
    return timelineDays;
  };

  const timelineDays = getAgendaTimeline();

  // Action: cancel booking
  const handleCancelBooking = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
      await deleteBooking(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Month Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendario de Ocupación</h2>
          <p className="text-sm text-muted-foreground">Monitoreo mensual y agenda cronológica de huéspedes.</p>
        </div>
        
        {/* Month selector controls (Desktop style) */}
        <div className="flex items-center gap-3 bg-card border border-border px-4 py-2 rounded-2xl w-fit self-start md:self-auto shadow-sm">
          <button 
            onClick={handlePrevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            style={{ minWidth: '44px', minHeight: '44px', margin: '-8px' }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm min-w-[7.5rem] text-center capitalize">
            {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </span>
          <button 
            onClick={handleNextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            style={{ minWidth: '44px', minHeight: '44px', margin: '-8px' }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Property Selector Bar (Horizontal Scrollable) */}
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none gap-2">
        <button
          onClick={() => setSelectedPropertyId('all')}
          className={cn(
            "px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 border transition-all active:scale-95",
            selectedPropertyId === 'all'
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:text-foreground"
          )}
          style={{ minHeight: '44px' }}
        >
          Todas las Propiedades
        </button>
        {properties.map(prop => (
          <button
            key={prop.id}
            onClick={() => setSelectedPropertyId(prop.id)}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 border transition-all flex items-center gap-2 active:scale-95",
              selectedPropertyId === prop.id
                ? "bg-secondary text-foreground border-foreground/30 shadow-sm"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            )}
            style={{ minHeight: '44px' }}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: prop.colorCode }} />
            {prop.name}
          </button>
        ))}
      </div>

      {/* DESKTOP VIEW: HORIZONTAL MONTH GRID */}
      <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/30 text-center py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <div>Lun</div>
          <div>Mar</div>
          <div>Mié</div>
          <div>Jue</div>
          <div>Vie</div>
          <div>Sáb</div>
          <div>Dom</div>
        </div>

        {/* Calendar days grid */}
        <div className="grid grid-cols-7 grid-rows-6 divide-x divide-y divide-border border-l -ml-[1px]">
          {calendarDays.map((day, idx) => {
            const isToday = new Date().toDateString() === day.date.toDateString();
            return (
              <div 
                key={idx} 
                className={cn(
                  "min-h-[7.5rem] p-3 flex flex-col justify-between transition-colors hover:bg-muted/10",
                  !day.isCurrentMonth && "opacity-40 bg-muted/5"
                )}
              >
                {/* Day indicator */}
                <div className="flex justify-between items-center">
                  <span className={cn(
                    "text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center",
                    isToday ? "bg-primary text-primary-foreground font-bold shadow-sm" : "text-muted-foreground"
                  )}>
                    {day.date.getDate()}
                  </span>
                </div>

                {/* Properties occupancy indicators */}
                <div className="space-y-1 mt-2">
                  {properties.map(prop => {
                    const booking = getPropertyBookingForDate(prop.id, day.date);
                    const isSelected = selectedPropertyId === 'all' || selectedPropertyId === prop.id;
                    
                    if (!isSelected) return null;

                    return (
                      <div 
                        key={prop.id}
                        className={cn(
                          "h-2.5 rounded-full w-full transition-all group relative",
                          booking ? "shadow-sm" : "bg-zinc-100 dark:bg-zinc-800"
                        )}
                        style={{ backgroundColor: booking ? prop.colorCode : undefined }}
                        title={booking ? `${prop.name}: ${booking.guestName}` : `${prop.name}: Libre`}
                      >
                        {booking && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-zinc-950 text-white text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap z-30 font-medium border border-zinc-800">
                            {booking.guestName} ({booking.platform})
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MOBILE VIEW: VERTICAL TIMELINE / AGENDA */}
      <div className="md:hidden space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 px-1">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          Timeline Próximos 14 Días
        </h3>

        {timelineDays.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">
            No hay check-ins ni check-outs en las próximas dos semanas.
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[1px] before:bg-border">
            {timelineDays.map((day, idx) => {
              const isToday = new Date().toDateString() === day.date.toDateString();
              const isTomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toDateString() === day.date.toDateString();
              
              return (
                <div key={idx} className="space-y-3 relative pl-8">
                  {/* Timeline node dot */}
                  <div className={cn(
                    "absolute left-[11px] top-1 w-2.5 h-2.5 rounded-full ring-4 bg-background",
                    isToday ? "bg-primary ring-primary/20" : "bg-muted-foreground/30 ring-background"
                  )} />

                  {/* Day title */}
                  <h4 className="text-xs font-bold text-foreground">
                    {isToday && <span className="text-primary font-semibold mr-1">[HOY]</span>}
                    {isTomorrow && <span className="text-muted-foreground font-semibold mr-1">[MAÑANA]</span>}
                    {day.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </h4>

                  {/* Day Events Card */}
                  <div className="space-y-2">
                    {day.events.map((event, eIdx) => {
                      const isCheckIn = event.type === 'CHECK_IN';
                      return (
                        <div 
                          key={eIdx}
                          className="bg-card border border-border rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-sm hover:bg-muted/10 transition-colors"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            {/* Direction Icon */}
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                              isCheckIn 
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            )}>
                              {isCheckIn ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-xs text-foreground truncate max-w-[8rem] md:max-w-none">
                                  {event.booking.guestName}
                                </span>
                                <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                  {event.booking.platform}
                                </span>
                              </div>
                              
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: event.property?.colorCode }} />
                                {event.property?.name}
                              </p>
                            </div>
                          </div>

                          {/* Event type badge and interactive delete action */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={cn(
                              "text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border",
                              isCheckIn 
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            )}>
                              {isCheckIn ? 'Entrada' : 'Salida'}
                            </span>
                            <button
                              onClick={() => handleCancelBooking(event.booking.id)}
                              className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                              style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Cancelar Reserva"
                            >
                              <Trash2 className="w-4 h-4 mt-[10px]" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
