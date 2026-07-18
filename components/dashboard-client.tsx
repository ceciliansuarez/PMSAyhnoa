'use client';

import { useState } from 'react';
import { 
  Building2, Plus, ArrowUpRight, ArrowDownRight, 
  CheckCircle2, Clock, AlertTriangle, PackagePlus, 
  DollarSign, ClipboardList, CalendarPlus, ShieldAlert, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Drawer from './drawer';
import { 
  adjustInventoryStock, 
  recordFinanceTransaction, 
  createOrUpdateBooking, 
  updateTaskStatus, 
  createTask,
  createProperty,
  createInventoryItem
} from '@/app/actions/pms-actions';

interface DashboardClientProps {
  properties: any[];
  bookings: any[];
  inventory: any[];
  finances: any[];
  tasks: any[];
  kpis: {
    grossIncome: number;
    totalExpenses: number;
    netProfit: number;
  };
}

export default function DashboardClient({
  properties,
  bookings,
  inventory,
  finances,
  tasks,
  kpis
}: DashboardClientProps) {
  // Tabs: 'summary' | 'tasks' | 'inventory' | 'finances'
  const [activeTab, setActiveTab] = useState<'summary' | 'tasks' | 'inventory' | 'finances'>('summary');
  
  // Drawer visibility states
  const [isPropertyOpen, setIsPropertyOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isNewInventoryOpen, setIsNewInventoryOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<any>(null);

  // Form states
  const [propertyForm, setPropertyForm] = useState({
    name: '',
    address: '',
    colorCode: '#10b981', // Default emerald
  });

  const [bookingForm, setBookingForm] = useState({
    propertyId: properties[0]?.id || '',
    guestName: '',
    checkIn: '',
    checkOut: '',
    totalRevenue: '',
    platform: 'Airbnb',
    status: 'CONFIRMED'
  });

  const [financeForm, setFinanceForm] = useState({
    propertyId: properties[0]?.id || '',
    type: 'EXPENSE',
    category: 'Limpieza',
    amount: '',
    description: '',
  });

  const [taskForm, setTaskForm] = useState({
    propertyId: properties[0]?.id || '',
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    type: 'CLEANING',
    status: 'PENDING'
  });

  const [inventoryForm, setInventoryForm] = useState({
    propertyId: properties[0]?.id || '',
    name: '',
    currentStock: '',
    minStock: '',
    unit: 'unidades',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculations for current statuses
  const getPropertyStatus = (propertyId: string, propBookings: any[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkoutToday = propBookings.find(b => {
      const outDate = new Date(b.checkOut);
      outDate.setHours(0, 0, 0, 0);
      return outDate.getTime() === today.getTime() && b.status === 'CONFIRMED';
    });

    if (checkoutToday) {
      return { label: 'Check-out hoy', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20', guest: checkoutToday.guestName };
    }

    const activeBooking = propBookings.find(b => {
      const inDate = new Date(b.checkIn);
      inDate.setHours(0, 0, 0, 0);
      const outDate = new Date(b.checkOut);
      outDate.setHours(0, 0, 0, 0);
      return today >= inDate && today < outDate && b.status === 'CONFIRMED';
    });

    if (activeBooking) {
      return { label: 'Ocupada', color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20', guest: activeBooking.guestName };
    }

    return { label: 'Libre', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20', guest: null };
  };

  // HANDLERS
  const handlePropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyForm.name || !propertyForm.address) return;
    setIsSubmitting(true);
    try {
      await createProperty({
        name: propertyForm.name,
        address: propertyForm.address,
        colorCode: propertyForm.colorCode
      });
      setIsPropertyOpen(false);
      setPropertyForm({
        name: '',
        address: '',
        colorCode: '#10b981'
      });
      
      // Update form default selected property if it was empty
      const updatedProps = [...properties];
      const newPropId = updatedProps.length > 0 ? updatedProps[0].id : '';
      setBookingForm(prev => prev.propertyId ? prev : { ...prev, propertyId: newPropId });
      setFinanceForm(prev => prev.propertyId ? prev : { ...prev, propertyId: newPropId });
      setTaskForm(prev => prev.propertyId ? prev : { ...prev, propertyId: newPropId });
      setInventoryForm(prev => prev.propertyId ? prev : { ...prev, propertyId: newPropId });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activePropId = bookingForm.propertyId || properties[0]?.id;
    if (!activePropId || !bookingForm.guestName || !bookingForm.checkIn || !bookingForm.checkOut || !bookingForm.totalRevenue) return;
    setIsSubmitting(true);
    try {
      await createOrUpdateBooking({
        propertyId: activePropId,
        guestName: bookingForm.guestName,
        checkIn: bookingForm.checkIn,
        checkOut: bookingForm.checkOut,
        totalRevenue: parseFloat(bookingForm.totalRevenue),
        platform: bookingForm.platform,
        status: bookingForm.status
      });
      setIsBookingOpen(false);
      setBookingForm({
        propertyId: properties[0]?.id || '',
        guestName: '',
        checkIn: '',
        checkOut: '',
        totalRevenue: '',
        platform: 'Airbnb',
        status: 'CONFIRMED'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activePropId = financeForm.propertyId || properties[0]?.id;
    if (!activePropId || !financeForm.amount || !financeForm.category) return;
    setIsSubmitting(true);
    try {
      await recordFinanceTransaction({
        propertyId: activePropId,
        type: financeForm.type,
        category: financeForm.category,
        amount: parseFloat(financeForm.amount),
        description: financeForm.description
      });
      setIsFinanceOpen(false);
      setFinanceForm({
        propertyId: properties[0]?.id || '',
        type: 'EXPENSE',
        category: 'Limpieza',
        amount: '',
        description: '',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activePropId = taskForm.propertyId || properties[0]?.id;
    if (!activePropId || !taskForm.title || !taskForm.dueDate) return;
    setIsSubmitting(true);
    try {
      await createTask({
        propertyId: activePropId,
        title: taskForm.title,
        description: taskForm.description,
        dueDate: taskForm.dueDate,
        type: taskForm.type,
        status: taskForm.status
      });
      setIsTaskOpen(false);
      setTaskForm({
        propertyId: properties[0]?.id || '',
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        type: 'CLEANING',
        status: 'PENDING'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInventorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activePropId = inventoryForm.propertyId || properties[0]?.id;
    if (!activePropId || !inventoryForm.name || !inventoryForm.currentStock || !inventoryForm.minStock) return;
    setIsSubmitting(true);
    try {
      await createInventoryItem({
        propertyId: activePropId,
        name: inventoryForm.name,
        currentStock: parseInt(inventoryForm.currentStock),
        minStock: parseInt(inventoryForm.minStock),
        unit: inventoryForm.unit
      });
      setIsNewInventoryOpen(false);
      setInventoryForm({
        propertyId: properties[0]?.id || '',
        name: '',
        currentStock: '',
        minStock: '',
        unit: 'unidades'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockAdjust = async (itemId: string, current: number, diff: number) => {
    const nextVal = current + diff;
    if (nextVal < 0) return;
    try {
      await adjustInventoryStock(itemId, nextVal);
      if (selectedInventoryItem && selectedInventoryItem.id === itemId) {
        setSelectedInventoryItem({ ...selectedInventoryItem, currentStock: nextVal });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await updateTaskStatus(taskId, nextStatus);
    } catch (err) {
      console.error(err);
    }
  };

  // Ensure default selects are populated after properties load
  const activePropertyIdForBooking = bookingForm.propertyId || properties[0]?.id || '';
  const activePropertyIdForFinance = financeForm.propertyId || properties[0]?.id || '';
  const activePropertyIdForTask = taskForm.propertyId || properties[0]?.id || '';
  const activePropertyIdForInventory = inventoryForm.propertyId || properties[0]?.id || '';

  return (
    <div className="space-y-6">
      {/* Header and Quick Buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Centro de Control</h2>
          <p className="text-sm text-muted-foreground">Monitoreo y administración de tus 3 departamentos.</p>
        </div>
        <div className="grid grid-cols-3 md:flex gap-2">
          <button
            onClick={() => setIsBookingOpen(true)}
            className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl text-xs md:text-sm font-semibold transition-all active:scale-95 h-11"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Reserva</span>
          </button>
          <button
            onClick={() => setIsFinanceOpen(true)}
            className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 px-3 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border rounded-xl text-xs md:text-sm font-semibold transition-all active:scale-95 h-11"
          >
            <DollarSign className="w-4 h-4" />
            <span>Finanzas</span>
          </button>
          <button
            onClick={() => setIsTaskOpen(true)}
            className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 px-3 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border rounded-xl text-xs md:text-sm font-semibold transition-all active:scale-95 h-11"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Tarea</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-border space-x-4">
        {[
          { id: 'summary', name: 'Inicio' },
          { id: 'tasks', name: 'Tareas' },
          { id: 'inventory', name: 'Inventario' },
          { id: 'finances', name: 'Finanzas' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "pb-3 text-sm font-semibold transition-colors border-b-2 px-1 relative -mb-[2px] h-11",
              activeTab === tab.id 
                ? "border-primary text-foreground" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* SUMMARY PANEL */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column: Properties */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  Propiedades
                </h3>
                {properties.length < 3 ? (
                  <button
                    onClick={() => setIsPropertyOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline h-10 px-3 hover:bg-muted/50 rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Registrar Propiedad</span>
                  </button>
                ) : (
                  <span className="text-[10px] bg-muted text-muted-foreground px-2.5 py-1 rounded-lg font-semibold border border-border">
                    Límite de 3 Propiedades
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {properties.length === 0 ? (
                  <div className="md:col-span-3 bg-card border border-dashed border-border rounded-2xl p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                    <Building2 className="w-8 h-8 text-muted-foreground/50" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">No hay propiedades registradas</p>
                      <p className="text-xs mt-1">Registra tu primer departamento para comenzar a operarlo.</p>
                    </div>
                    <button
                      onClick={() => setIsPropertyOpen(true)}
                      className="mt-2 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl text-xs hover:bg-primary/95 transition-all"
                    >
                      Registrar Propiedad
                    </button>
                  </div>
                ) : (
                  properties.map((prop) => {
                    const status = getPropertyStatus(prop.id, prop.bookings);
                    return (
                      <div 
                        key={prop.id} 
                        className="group relative flex flex-col bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all duration-300"
                      >
                        {/* Color indicator stripe */}
                        <div 
                          className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
                          style={{ backgroundColor: prop.colorCode }}
                        />
                        <div className="flex-1 mt-2">
                          <h4 className="font-bold text-base truncate">{prop.name}</h4>
                          <p className="text-xs text-muted-foreground truncate mb-4">{prop.address}</p>
                        </div>
                        
                        {/* Dynamic status badge */}
                        <div className="flex flex-col gap-2 pt-3 border-t border-border/60">
                          <span className={cn(
                            "inline-flex items-center justify-between text-xs font-semibold px-2.5 py-1 rounded-lg border",
                            status.color
                          )}>
                            <span>{status.label}</span>
                          </span>
                          {status.guest && (
                            <div className="text-[11px] text-muted-foreground">
                              Huésped: <span className="font-semibold text-foreground">{status.guest}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Today's Critical Tasks */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-muted-foreground" />
                  Tareas del Día
                </h3>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-md font-medium">
                  {tasks.filter(t => t.status !== 'COMPLETED').length} pendientes
                </span>
              </div>
              <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
                {tasks.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    No hay tareas registradas.
                  </div>
                ) : (
                  tasks.slice(0, 4).map((task) => {
                    const prop = properties.find(p => p.id === task.propertyId);
                    return (
                      <div 
                        key={task.id} 
                        className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors"
                      >
                        <button
                          onClick={() => toggleTask(task.id, task.status)}
                          className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border border-muted-foreground/30 flex items-center justify-center hover:border-primary active:scale-90 transition-all"
                          style={{ minWidth: '44px', minHeight: '44px', margin: '-10px' }} // touch padding
                        >
                          <div className="w-8 h-8 flex items-center justify-center">
                            {task.status === 'COMPLETED' ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                            ) : (
                              <div className="w-2.5 h-2.5 rounded-full bg-transparent group-hover:bg-primary/20" />
                            )}
                          </div>
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className={cn(
                              "font-semibold text-sm truncate",
                              task.status === 'COMPLETED' && "line-through text-muted-foreground"
                            )}>
                              {task.title}
                            </h4>
                            <span 
                              className="w-2 h-2 rounded-full shrink-0" 
                              style={{ backgroundColor: prop?.colorCode || '#ccc' }}
                              title={prop?.name}
                            />
                          </div>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className={cn(
                              "text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded",
                              task.type === 'CLEANING' 
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                            )}>
                              {task.type === 'CLEANING' ? 'Limpieza' : 'Mantenimiento'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: KPIs & Low stock */}
          <div className="space-y-6">
            {/* KPIs */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Balance Mensual</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border/60">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    Ingresos Brutos
                  </span>
                  <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                    ${kpis.grossIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/60">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <ArrowDownRight className="w-4 h-4 text-rose-500" />
                    Gastos Totales
                  </span>
                  <span className="font-bold text-lg text-rose-600 dark:text-rose-400">
                    ${kpis.totalExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-bold text-foreground">Utilidad Neta</span>
                  <span className={cn(
                    "font-extrabold text-xl",
                    kpis.netProfit >= 0 ? "text-primary" : "text-rose-500"
                  )}>
                    ${kpis.netProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Low Inventory Alert */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                Alertas de Inventario
              </h3>
              <div className="space-y-3">
                {inventory.filter(i => i.currentStock <= i.minStock).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">Stock completo. No hay alertas.</p>
                ) : (
                  inventory.filter(i => i.currentStock <= i.minStock).map((item) => {
                    const prop = properties.find(p => p.id === item.propertyId);
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => {
                          setSelectedInventoryItem(item);
                          setIsInventoryOpen(true);
                        }}
                        className="flex items-center justify-between p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer transition-colors active:scale-[0.98]"
                      >
                        <div className="min-w-0 pr-2">
                          <h4 className="font-semibold text-xs truncate text-amber-700 dark:text-amber-300">{item.name}</h4>
                          <p className="text-[10px] text-muted-foreground truncate">{prop?.name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-xs text-amber-700 dark:text-amber-400">
                            {item.currentStock} / {item.minStock}
                          </span>
                          <span className="text-[9px] block text-muted-foreground">{item.unit}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TASKS PANEL */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Gestión de Tareas</h3>
            <button 
              onClick={() => setIsTaskOpen(true)}
              className="flex items-center gap-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border px-3 py-1.5 rounded-lg text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Tarea</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['PENDING', 'IN_PROGRESS', 'COMPLETED'].map((status) => {
              const statusTasks = tasks.filter(t => t.status === status);
              return (
                <div key={status} className="bg-card border border-border rounded-2xl p-5 space-y-4">
                  <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    <span>
                      {status === 'PENDING' && 'Pendientes'}
                      {status === 'IN_PROGRESS' && 'En Progreso'}
                      {status === 'COMPLETED' && 'Completadas'}
                    </span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-md font-medium text-foreground">
                      {statusTasks.length}
                    </span>
                  </h4>
                  <div className="space-y-3">
                    {statusTasks.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">Sin tareas en esta etapa.</p>
                    ) : (
                      statusTasks.map(task => {
                        const prop = properties.find(p => p.id === task.propertyId);
                        return (
                          <div 
                            key={task.id} 
                            className="p-3 border border-border rounded-xl bg-muted/20 flex flex-col gap-2 hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-semibold text-xs leading-normal">{task.title}</h5>
                              <span 
                                className="w-2.5 h-2.5 rounded-full shrink-0" 
                                style={{ backgroundColor: prop?.colorCode || '#ccc' }} 
                                title={prop?.name}
                              />
                            </div>
                            {task.description && (
                              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{task.description}</p>
                            )}
                            <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-1">
                              <span className="text-[10px] text-muted-foreground">
                                Vence: {new Date(task.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                              </span>
                              <div className="flex gap-1.5">
                                {status !== 'PENDING' && (
                                  <button
                                    onClick={() => updateTaskStatus(task.id, 'PENDING')}
                                    className="text-[9px] bg-secondary hover:bg-muted px-2 py-1 rounded font-semibold transition-all"
                                  >
                                    Pendiente
                                  </button>
                                )}
                                {status !== 'IN_PROGRESS' && (
                                  <button
                                    onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                                    className="text-[9px] bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 px-2 py-1 rounded font-semibold transition-all"
                                  >
                                    Iniciar
                                  </button>
                                )}
                                {status !== 'COMPLETED' && (
                                  <button
                                    onClick={() => updateTaskStatus(task.id, 'COMPLETED')}
                                    className="text-[9px] bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 px-2 py-1 rounded font-semibold transition-all"
                                  >
                                    Terminar
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* INVENTORY PANEL */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Inventario de Propiedades</h3>
            {properties.length > 0 && (
              <button
                onClick={() => setIsNewInventoryOpen(true)}
                className="flex items-center gap-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 h-10"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Insumo</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {properties.map((prop) => {
              const propInventory = inventory.filter(i => i.propertyId === prop.id);
              return (
                <div key={prop.id} className="bg-card border border-border rounded-2xl p-5 space-y-4">
                  <h4 className="font-bold text-sm flex items-center gap-2 pb-2 border-b border-border/60">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: prop.colorCode }} />
                    {prop.name}
                  </h4>
                  <div className="space-y-3">
                    {propInventory.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Sin inventario registrado.</p>
                    ) : (
                      propInventory.map(item => {
                        const isLow = item.currentStock <= item.minStock;
                        return (
                          <div 
                            key={item.id} 
                            onClick={() => {
                              setSelectedInventoryItem(item);
                              setIsInventoryOpen(true);
                            }}
                            className={cn(
                              "p-3 rounded-xl border border-border hover:bg-muted/40 cursor-pointer transition-all flex items-center justify-between active:scale-[0.98]",
                              isLow && "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
                            )}
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-semibold text-xs block truncate">{item.name}</span>
                              <span className="text-[10px] text-muted-foreground">Mínimo: {item.minStock} {item.unit}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={cn(
                                "font-bold text-sm",
                                isLow ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                              )}>
                                {item.currentStock}
                              </span>
                              <span className="text-[9px] block text-muted-foreground">{item.unit}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FINANCES PANEL */}
      {activeTab === 'finances' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Registro de Transacciones</h3>
            <button 
              onClick={() => setIsFinanceOpen(true)}
              className="flex items-center gap-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border px-3 py-1.5 rounded-lg text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Flujo</span>
            </button>
          </div>
          
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border text-muted-foreground text-xs font-semibold uppercase">
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Propiedad</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4">Descripción</th>
                    <th className="p-4 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {finances.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">
                        No hay transacciones registradas este mes.
                      </td>
                    </tr>
                  ) : (
                    finances.map((rec) => {
                      const prop = properties.find(p => p.id === rec.propertyId);
                      const isIncome = rec.type === 'INCOME';
                      return (
                        <tr key={rec.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-4 whitespace-nowrap text-xs text-muted-foreground">
                            {new Date(rec.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 font-medium text-xs">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: prop?.colorCode || '#ccc' }} />
                              {prop?.name}
                            </span>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className="text-xs bg-muted px-2 py-0.5 rounded font-medium">{rec.category}</span>
                          </td>
                          <td className="p-4 text-xs text-muted-foreground max-w-xs truncate" title={rec.description}>
                            {rec.description || '-'}
                          </td>
                          <td className={cn(
                            "p-4 text-right font-bold whitespace-nowrap text-xs md:text-sm",
                            isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          )}>
                            {isIncome ? '+' : '-'}${rec.amount.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DRAWERS (SLIDE-UP MODALS) */}

      {/* 0. Property Registration Drawer */}
      <Drawer
        isOpen={isPropertyOpen}
        onClose={() => setIsPropertyOpen(false)}
        title="Registrar Nueva Propiedad"
      >
        <form onSubmit={handlePropertySubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">Nombre de la Propiedad</label>
            <input
              type="text"
              required
              placeholder="Ej. Loft La Condesa"
              value={propertyForm.name}
              onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              style={{ minHeight: '44px' }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">Dirección</label>
            <input
              type="text"
              required
              placeholder="Ej. Av. Mazatlán 142, CDMX"
              value={propertyForm.address}
              onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              style={{ minHeight: '44px' }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">Tema de Color</label>
            <div className="grid grid-cols-5 gap-2 pt-1">
              {[
                { name: 'Esmeralda', hex: '#10b981' },
                { name: 'Índigo', hex: '#6366f1' },
                { name: 'Cielo', hex: '#0ea5e9' },
                { name: 'Rosa', hex: '#f43f5e' },
                { name: 'Ámbar', hex: '#f59e0b' }
              ].map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => setPropertyForm({ ...propertyForm, colorCode: color.hex })}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all active:scale-95",
                    propertyForm.colorCode === color.hex 
                      ? "border-primary scale-110 shadow-sm" 
                      : "border-transparent hover:border-muted-foreground/30"
                  )}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/95 transition-colors disabled:opacity-50 h-12 mt-4"
          >
            {isSubmitting ? 'Guardando...' : 'Registrar Propiedad'}
          </button>
        </form>
      </Drawer>

      {/* 0.5. New Inventory Item Drawer */}
      <Drawer
        isOpen={isNewInventoryOpen}
        onClose={() => setIsNewInventoryOpen(false)}
        title="Agregar Nuevo Insumo"
      >
        {properties.length === 0 ? (
          <div className="space-y-4 text-center py-4">
            <div className="p-4 border border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400 text-xs rounded-xl font-medium">
              Por favor, primero registra una propiedad antes de agregar insumos al inventario.
            </div>
            <button
              onClick={() => {
                setIsNewInventoryOpen(false);
                setIsPropertyOpen(true);
              }}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/95 transition-colors h-12"
            >
              Registrar Propiedad
            </button>
          </div>
        ) : (
          <form onSubmit={handleInventorySubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Propiedad</label>
              <select
                value={activePropertyIdForInventory}
                onChange={(e) => setInventoryForm({ ...inventoryForm, propertyId: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ minHeight: '44px' }}
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Nombre del Insumo</label>
              <input
                type="text"
                required
                placeholder="Ej. Cápsulas de Café"
                value={inventoryForm.name}
                onChange={(e) => setInventoryForm({ ...inventoryForm, name: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ minHeight: '44px' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Stock Actual</label>
                <input
                  type="number"
                  required
                  placeholder="20"
                  value={inventoryForm.currentStock}
                  onChange={(e) => setInventoryForm({ ...inventoryForm, currentStock: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{ minHeight: '44px' }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Stock Mínimo (Alerta)</label>
                <input
                  type="number"
                  required
                  placeholder="10"
                  value={inventoryForm.minStock}
                  onChange={(e) => setInventoryForm({ ...inventoryForm, minStock: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{ minHeight: '44px' }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Unidad de Medida</label>
              <select
                value={inventoryForm.unit}
                onChange={(e) => setInventoryForm({ ...inventoryForm, unit: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ minHeight: '44px' }}
              >
                <option value="unidades">Unidades</option>
                <option value="cápsulas">Cápsulas</option>
                <option value="paquetes">Paquetes</option>
                <option value="rollos">Rollos</option>
                <option value="frascos">Frascos</option>
                <option value="bolsas">Bolsas</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/95 transition-colors disabled:opacity-50 h-12 mt-4"
            >
              {isSubmitting ? 'Guardando...' : 'Agregar Insumo'}
            </button>
          </form>
        )}
      </Drawer>

      {/* 1. Booking Drawer */}
      <Drawer
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        title="Crear Nueva Reserva"
      >
        {properties.length === 0 ? (
          <div className="space-y-4 text-center py-4">
            <div className="p-4 border border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400 text-xs rounded-xl font-medium">
              Por favor, primero registra una propiedad en la pantalla principal antes de añadir reservas.
            </div>
            <button
              onClick={() => {
                setIsBookingOpen(false);
                setIsPropertyOpen(true);
              }}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/95 transition-colors h-12"
            >
              Registrar Propiedad
            </button>
          </div>
        ) : (
          <form onSubmit={handleBookingSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Propiedad</label>
              <select
                value={activePropertyIdForBooking}
                onChange={(e) => setBookingForm({ ...bookingForm, propertyId: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ minHeight: '44px' }}
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Nombre del Huésped</label>
              <input
                type="text"
                required
                placeholder="Ej. Juan Pérez"
                value={bookingForm.guestName}
                onChange={(e) => setBookingForm({ ...bookingForm, guestName: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ minHeight: '44px' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Check-In</label>
                <input
                  type="date"
                  required
                  value={bookingForm.checkIn}
                  onChange={(e) => setBookingForm({ ...bookingForm, checkIn: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{ minHeight: '44px' }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Check-Out</label>
                <input
                  type="date"
                  required
                  value={bookingForm.checkOut}
                  onChange={(e) => setBookingForm({ ...bookingForm, checkOut: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{ minHeight: '44px' }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Ingresos ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={bookingForm.totalRevenue}
                  onChange={(e) => setBookingForm({ ...bookingForm, totalRevenue: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{ minHeight: '44px' }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Plataforma</label>
                <select
                  value={bookingForm.platform}
                  onChange={(e) => setBookingForm({ ...bookingForm, platform: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{ minHeight: '44px' }}
                >
                  <option value="Airbnb">Airbnb</option>
                  <option value="Booking.com">Booking.com</option>
                  <option value="Directo">Directo</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Estado</label>
              <select
                value={bookingForm.status}
                onChange={(e) => setBookingForm({ ...bookingForm, status: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ minHeight: '44px' }}
              >
                <option value="CONFIRMED">Confirmada</option>
                <option value="PENDING">Pendiente</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/95 transition-colors disabled:opacity-50 h-12 mt-4"
            >
              {isSubmitting ? 'Guardando...' : 'Crear Reserva'}
            </button>
          </form>
        )}
      </Drawer>

      {/* 2. Finance Drawer */}
      <Drawer
        isOpen={isFinanceOpen}
        onClose={() => setIsFinanceOpen(false)}
        title="Registrar Ingreso u Gasto"
      >
        {properties.length === 0 ? (
          <div className="space-y-4 text-center py-4">
            <div className="p-4 border border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400 text-xs rounded-xl font-medium">
              Por favor, primero registra una propiedad en la pantalla principal antes de añadir transacciones financieras.
            </div>
            <button
              onClick={() => {
                setIsFinanceOpen(false);
                setIsPropertyOpen(true);
              }}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/95 transition-colors h-12"
            >
              Registrar Propiedad
            </button>
          </div>
        ) : (
          <form onSubmit={handleFinanceSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Propiedad</label>
              <select
                value={activePropertyIdForFinance}
                onChange={(e) => setFinanceForm({ ...financeForm, propertyId: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ minHeight: '44px' }}
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Tipo</label>
                <select
                  value={financeForm.type}
                  onChange={(e) => setFinanceForm({ ...financeForm, type: e.target.value, category: e.target.value === 'INCOME' ? 'Reserva' : 'Limpieza' })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{ minHeight: '44px' }}
                >
                  <option value="EXPENSE">Gasto (-)</option>
                  <option value="INCOME">Ingreso (+)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Categoría</label>
                {financeForm.type === 'INCOME' ? (
                  <select
                    value={financeForm.category}
                    onChange={(e) => setFinanceForm({ ...financeForm, category: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    style={{ minHeight: '44px' }}
                  >
                    <option value="Reserva">Reserva</option>
                    <option value="Otros">Otros</option>
                  </select>
                ) : (
                  <select
                    value={financeForm.category}
                    onChange={(e) => setFinanceForm({ ...financeForm, category: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    style={{ minHeight: '44px' }}
                  >
                    <option value="Limpieza">Limpieza</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Servicios">Servicios</option>
                    <option value="Otros">Otros</option>
                  </select>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Monto ($ USD)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={financeForm.amount}
                onChange={(e) => setFinanceForm({ ...financeForm, amount: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ minHeight: '44px' }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Descripción / Nota</label>
              <input
                type="text"
                placeholder="Ej. Pago servicio internet Izzi"
                value={financeForm.description}
                onChange={(e) => setFinanceForm({ ...financeForm, description: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ minHeight: '44px' }}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/95 transition-colors disabled:opacity-50 h-12 mt-4"
            >
              {isSubmitting ? 'Guardando...' : 'Registrar Transacción'}
            </button>
          </form>
        )}
      </Drawer>

      {/* 3. Task Drawer */}
      <Drawer
        isOpen={isTaskOpen}
        onClose={() => setIsTaskOpen(false)}
        title="Crear Nueva Tarea"
      >
        {properties.length === 0 ? (
          <div className="space-y-4 text-center py-4">
            <div className="p-4 border border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400 text-xs rounded-xl font-medium">
              Por favor, primero registra una propiedad en la pantalla principal antes de añadir tareas.
            </div>
            <button
              onClick={() => {
                setIsTaskOpen(false);
                setIsPropertyOpen(true);
              }}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/95 transition-colors h-12"
            >
              Registrar Propiedad
            </button>
          </div>
        ) : (
          <form onSubmit={handleTaskSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Propiedad</label>
              <select
                value={activePropertyIdForTask}
                onChange={(e) => setTaskForm({ ...taskForm, propertyId: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ minHeight: '44px' }}
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Título de la Tarea</label>
              <input
                type="text"
                required
                placeholder="Ej. Comprar papel higiénico"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ minHeight: '44px' }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Detalles / Instrucciones</label>
              <textarea
                placeholder="Instrucciones adicionales para el staff..."
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring h-20 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Fecha Límite</label>
                <input
                  type="date"
                  required
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{ minHeight: '44px' }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Categoría</label>
                <select
                  value={taskForm.type}
                  onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{ minHeight: '44px' }}
                >
                  <option value="CLEANING">Limpieza</option>
                  <option value="MAINTENANCE">Mantenimiento</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/95 transition-colors disabled:opacity-50 h-12 mt-4"
            >
              {isSubmitting ? 'Guardando...' : 'Crear Tarea'}
            </button>
          </form>
        )}
      </Drawer>

      {/* 4. Stock Adjustment Drawer */}
      <Drawer
        isOpen={isInventoryOpen}
        onClose={() => {
          setIsInventoryOpen(false);
          setSelectedInventoryItem(null);
        }}
        title="Ajustar Nivel de Stock"
      >
        {selectedInventoryItem && (
          <div className="space-y-6 text-center py-4">
            <div>
              <h3 className="font-bold text-lg text-foreground">{selectedInventoryItem.name}</h3>
              <p className="text-xs text-muted-foreground">
                {properties.find(p => p.id === selectedInventoryItem.propertyId)?.name}
              </p>
            </div>

            <div className="flex items-center justify-center gap-6">
              {/* Decrement Button */}
              <button
                onClick={() => handleStockAdjust(selectedInventoryItem.id, selectedInventoryItem.currentStock, -1)}
                disabled={selectedInventoryItem.currentStock <= 0}
                className="w-14 h-14 rounded-2xl bg-secondary text-secondary-foreground hover:bg-muted border border-border flex items-center justify-center text-2xl font-bold transition-all active:scale-90 disabled:opacity-40"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                -
              </button>

              <div className="min-w-[5rem]">
                <div className="text-4xl font-extrabold text-primary">{selectedInventoryItem.currentStock}</div>
                <div className="text-xs text-muted-foreground font-semibold mt-1 uppercase tracking-wider">
                  {selectedInventoryItem.unit}
                </div>
              </div>

              {/* Increment Button */}
              <button
                onClick={() => handleStockAdjust(selectedInventoryItem.id, selectedInventoryItem.currentStock, 1)}
                className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center text-2xl font-bold transition-all active:scale-90"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                +
              </button>
            </div>

            {selectedInventoryItem.currentStock <= selectedInventoryItem.minStock && (
              <div className="p-3 border border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400 text-xs rounded-xl flex items-center justify-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Nivel crítico. Requiere reabastecimiento mínimo de {selectedInventoryItem.minStock} {selectedInventoryItem.unit}.</span>
              </div>
            )}
            
            <button
              onClick={() => {
                setIsInventoryOpen(false);
                setSelectedInventoryItem(null);
              }}
              className="w-full bg-secondary text-secondary-foreground hover:bg-muted border border-border font-semibold py-3 rounded-xl transition-colors h-12 mt-6"
            >
              Listo
            </button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
