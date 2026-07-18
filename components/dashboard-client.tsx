'use client';

import { useState } from 'react';
import { 
  Building2, Plus, ArrowUpRight, ArrowDownRight, 
  CheckCircle2, Clock, AlertTriangle, PackagePlus, 
  DollarSign, ClipboardList, CalendarPlus, ShieldAlert, 
  Pencil, Trash2, ChevronDown, ChevronUp, FolderPlus, Sparkles
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
  updateProperty,
  deleteProperty,
  createSpace,
  updateSpaceName,
  deleteSpace,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  seedKitchenEquipment
} from '@/app/actions/pms-actions';

interface DashboardClientProps {
  properties: any[];
  spaces: any[];
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
  spaces,
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
  const [isEditPropertyOpen, setIsEditPropertyOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isNewInventoryOpen, setIsNewInventoryOpen] = useState(false);
  const [isEditInventoryOpen, setIsEditInventoryOpen] = useState(false);
  
  // Space manager states
  const [isNewSpaceOpen, setIsNewSpaceOpen] = useState(false);
  const [isEditSpaceOpen, setIsEditSpaceOpen] = useState(false);

  // Selected entities for edit
  const [selectedPropertyForEdit, setSelectedPropertyForEdit] = useState<any>(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<any>(null);
  const [selectedInventoryItemForEdit, setSelectedInventoryItemForEdit] = useState<any>(null);
  const [selectedSpaceForEdit, setSelectedSpaceForEdit] = useState<any>(null);

  // Form states
  const [propertyForm, setPropertyForm] = useState({
    name: '',
    address: '',
    colorCode: '#10b981',
  });

  const [editPropertyForm, setEditPropertyForm] = useState({
    id: '',
    name: '',
    address: '',
    colorCode: '#10b981',
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
    spaceId: '', 
    name: '',
    currentStock: '',
    minStock: '',
    unit: 'unidades',
    category: 'General', 
    subCategory: '', 
    itemType: 'OPERATIVO', 
  });

  const [editInventoryForm, setEditInventoryForm] = useState({
    id: '',
    propertyId: '',
    spaceId: '',
    name: '',
    currentStock: '',
    minStock: '',
    unit: 'unidades',
    category: 'General',
    subCategory: '',
    itemType: 'OPERATIVO',
  });

  const [newSpaceForm, setNewSpaceForm] = useState({
    propertyId: '',
    name: '',
  });

  const [editSpaceForm, setEditSpaceForm] = useState({
    id: '',
    name: '',
  });

  // Kitchen sub-categories accordion expanded states
  const [expandedKitchenSections, setExpandedKitchenSections] = useState<Record<string, boolean>>({
    'Vajilla y Cubertería': false,
    'Utensilios y Menaje': false,
    'Electrodomésticos': false,
    'Consumibles': true,
    'Otros': false,
  });

  // Collapsed states for main spaces
  const [collapsedSpaces, setCollapsedSpaces] = useState<Record<string, boolean>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleKitchenSection = (section: string) => {
    setExpandedKitchenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleSpaceCollapse = (spaceId: string) => {
    setCollapsedSpaces(prev => ({
      ...prev,
      [spaceId]: !prev[spaceId]
    }));
  };

  // Calculations for current occupancy statuses
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
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPropertyForm.id || !editPropertyForm.name || !editPropertyForm.address) return;
    setIsSubmitting(true);
    try {
      await updateProperty({
        id: editPropertyForm.id,
        name: editPropertyForm.name,
        address: editPropertyForm.address,
        colorCode: editPropertyForm.colorCode
      });
      setIsEditPropertyOpen(false);
      setSelectedPropertyForEdit(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePropertyClick = async (propertyId: string, propertyName: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar la propiedad "${propertyName}"? Se borrarán todas las reservas, finanzas, tareas, inventario y ambientes asociados.`)) {
      try {
        await deleteProperty(propertyId);
      } catch (err) {
        console.error(err);
      }
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
    if (!activePropId || !inventoryForm.name || !inventoryForm.currentStock) return;
    
    const targetSpace = spaces.find(s => s.id === inventoryForm.spaceId);
    const isKitchen = targetSpace?.name.toLowerCase() === 'cocina';
    const finalMinStock = inventoryForm.itemType === 'ACTIVO' ? 0 : parseInt(inventoryForm.minStock || '0');

    setIsSubmitting(true);
    try {
      await createInventoryItem({
        propertyId: activePropId,
        spaceId: inventoryForm.category === 'Reposición' ? undefined : inventoryForm.spaceId,
        name: inventoryForm.name,
        currentStock: parseInt(inventoryForm.currentStock),
        minStock: finalMinStock,
        unit: inventoryForm.unit,
        category: inventoryForm.category,
        subCategory: isKitchen ? inventoryForm.subCategory : undefined,
        itemType: inventoryForm.itemType
      });
      setIsNewInventoryOpen(false);
      setInventoryForm({
        propertyId: properties[0]?.id || '',
        spaceId: '',
        name: '',
        currentStock: '',
        minStock: '',
        unit: 'unidades',
        category: 'General',
        subCategory: '',
        itemType: 'OPERATIVO'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditInventorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editInventoryForm.id || !editInventoryForm.name || !editInventoryForm.currentStock) return;
    
    const targetSpace = spaces.find(s => s.id === editInventoryForm.spaceId);
    const isKitchen = targetSpace?.name.toLowerCase() === 'cocina';
    const finalMinStock = editInventoryForm.itemType === 'ACTIVO' ? 0 : parseInt(editInventoryForm.minStock || '0');

    setIsSubmitting(true);
    try {
      await updateInventoryItem({
        id: editInventoryForm.id,
        propertyId: editInventoryForm.propertyId,
        spaceId: editInventoryForm.category === 'Reposición' ? undefined : editInventoryForm.spaceId,
        name: editInventoryForm.name,
        currentStock: parseInt(editInventoryForm.currentStock),
        minStock: finalMinStock,
        unit: editInventoryForm.unit,
        category: editInventoryForm.category,
        subCategory: isKitchen ? editInventoryForm.subCategory : undefined,
        itemType: editInventoryForm.itemType
      });
      setIsEditInventoryOpen(false);
      setSelectedInventoryItemForEdit(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInventoryClick = async (itemId: string, itemName: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el insumo "${itemName}" del inventario?`)) {
      try {
        await deleteInventoryItem(itemId);
      } catch (err) {
        console.error(err);
      }
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

  // SPACE HANDLERS
  const handleNewSpaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceForm.propertyId || !newSpaceForm.name) return;
    setIsSubmitting(true);
    try {
      await createSpace({
        propertyId: newSpaceForm.propertyId,
        name: newSpaceForm.name
      });
      setIsNewSpaceOpen(false);
      setNewSpaceForm({ propertyId: '', name: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSpaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSpaceForm.id || !editSpaceForm.name) return;
    setIsSubmitting(true);
    try {
      await updateSpaceName({
        id: editSpaceForm.id,
        name: editSpaceForm.name
      });
      setIsEditSpaceOpen(false);
      setSelectedSpaceForEdit(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSpaceClick = async (spaceId: string, spaceName: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el ambiente "${spaceName}"? Todos los insumos de inventario que estén asignados a este ambiente serán eliminados también.`)) {
      try {
        await deleteSpace(spaceId);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // HOSPITALITY SEED HANDLER
  const handleSeedKitchen = async (propertyId: string, spaceId: string) => {
    setIsSubmitting(true);
    try {
      await seedKitchenEquipment({ propertyId, spaceId });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper variables for selects
  const activePropertyIdForBooking = bookingForm.propertyId || properties[0]?.id || '';
  const activePropertyIdForFinance = financeForm.propertyId || properties[0]?.id || '';
  const activePropertyIdForTask = taskForm.propertyId || properties[0]?.id || '';

  // Get dynamic spaces based on chosen property in forms
  const spacesForSelectedPropertyInNewItem = spaces.filter(s => s.propertyId === (inventoryForm.propertyId || properties[0]?.id));
  const spacesForSelectedPropertyInEditItem = spaces.filter(s => s.propertyId === (editInventoryForm.propertyId || properties[0]?.id));

  // Check if current space selected is Kitchen
  const isKitchenSelectedInNewItem = spaces.find(s => s.id === inventoryForm.spaceId)?.name.toLowerCase() === 'cocina';
  const isKitchenSelectedInEditItem = spaces.find(s => s.id === editInventoryForm.spaceId)?.name.toLowerCase() === 'cocina';

  // Filters for low stock ALERTS: strictly itemType = OPERATIVO
  const lowStockAlerts = inventory.filter(i => (i.itemType || 'OPERATIVO') === 'OPERATIVO' && i.currentStock <= i.minStock);

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
                        
                        {/* Edit/Delete overlay buttons */}
                        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setSelectedPropertyForEdit(prop);
                              setEditPropertyForm({
                                id: prop.id,
                                name: prop.name,
                                address: prop.address,
                                colorCode: prop.colorCode
                              });
                              setIsEditPropertyOpen(true);
                            }}
                            className="p-1.5 bg-background hover:bg-muted border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                            title="Editar propiedad"
                            style={{ minWidth: '32px', minHeight: '32px' }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePropertyClick(prop.id, prop.name)}
                            className="p-1.5 bg-background hover:bg-rose-50 border border-border hover:border-rose-200 rounded-lg text-muted-foreground hover:text-rose-600 transition-colors"
                            title="Eliminar propiedad"
                            style={{ minWidth: '32px', minHeight: '32px' }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex-1 mt-3">
                          <h4 className="font-bold text-base truncate pr-14">{prop.name}</h4>
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
                          style={{ minWidth: '44px', minHeight: '44px', margin: '-10px' }}
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
                {lowStockAlerts.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">Stock completo. No hay alertas.</p>
                ) : (
                  lowStockAlerts.map((item) => {
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
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Inventario de Propiedades</h3>
            <span className="text-xs text-muted-foreground">Toca un ambiente para expandir o colapsar</span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {properties.map((prop) => {
              const propSpaces = spaces.filter(s => s.propertyId === prop.id);
              const propInventory = inventory.filter(i => i.propertyId === prop.id);
              
              // Filter general restocking items (no spaceId)
              const reposicionItems = propInventory.filter(i => i.category === 'Reposición');
              const isRepoCollapsed = !!collapsedSpaces[`reposicion-${prop.id}`];

              return (
                <div key={prop.id} className="bg-card border border-border rounded-2xl p-5 space-y-6">
                  {/* Property Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
                    <h4 className="font-extrabold text-base flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: prop.colorCode }} />
                      {prop.name}
                    </h4>
                    
                    <button
                      onClick={() => {
                        setNewSpaceForm({ propertyId: prop.id, name: '' });
                        setIsNewSpaceOpen(true);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl transition-all"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>+ Ambiente</span>
                    </button>
                  </div>

                  {/* Spaces / Ambientes Grid */}
                  <div className="space-y-5">
                    {/* 1. Normal spaces */}
                    {propSpaces.map((space) => {
                      const spaceItems = propInventory.filter(i => i.spaceId === space.id && i.category !== 'Reposición');
                      const isKitchen = space.name.toLowerCase() === 'cocina';
                      const isCollapsed = !!collapsedSpaces[space.id];

                      return (
                        <div key={space.id} className="border border-border/80 rounded-xl p-4 bg-muted/10 space-y-4">
                          {/* Clickable Space Header */}
                          <div 
                            onClick={() => toggleSpaceCollapse(space.id)}
                            className="flex items-center justify-between pb-2 border-b border-border/40 cursor-pointer select-none"
                          >
                            <span className="font-bold text-sm text-foreground flex items-center gap-2 pr-4 flex-1">
                              {isCollapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />}
                              <span className="truncate">{space.name}</span>
                              <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-semibold shrink-0">
                                {spaceItems.length}
                              </span>
                            </span>
                            
                            {/* Actions area - stopped propagation to prevent collapse */}
                            <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                              {/* New item button LOCAL to this space */}
                              <button
                                onClick={() => {
                                  setInventoryForm({
                                    propertyId: prop.id,
                                    spaceId: space.id,
                                    name: '',
                                    currentStock: '',
                                    minStock: '',
                                    unit: 'unidades',
                                    category: 'General',
                                    subCategory: '',
                                    itemType: 'OPERATIVO'
                                  });
                                  setIsNewInventoryOpen(true);
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-extrabold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 px-2.5 py-1.5 rounded-lg transition-all active:scale-95"
                                style={{ minHeight: '32px' }}
                              >
                                <Plus className="w-3 h-3" />
                                <span>+ Insumo</span>
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedSpaceForEdit(space);
                                  setEditSpaceForm({ id: space.id, name: space.name });
                                  setIsEditSpaceOpen(true);
                                }}
                                className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                                title="Editar nombre del ambiente"
                                style={{ minWidth: '32px', minHeight: '32px' }}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteSpaceClick(space.id, space.name)}
                                className="p-1.5 hover:bg-rose-50 rounded text-muted-foreground hover:text-rose-600 transition-colors"
                                title="Eliminar ambiente"
                                style={{ minWidth: '32px', minHeight: '32px' }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Space items list (only rendered if NOT collapsed) */}
                          {!isCollapsed && (
                            <div className="space-y-4 pt-1 animate-fade-in">
                              {isKitchen && spaceItems.length === 0 ? (
                                /* Premium Hospitality Seeding Banner for Empty Kitchens */
                                <div className="p-5 border border-dashed border-primary/30 rounded-xl bg-primary/5 text-center space-y-4 py-6">
                                  <Sparkles className="w-8 h-8 text-primary mx-auto" />
                                  <div className="space-y-1">
                                    <h5 className="text-xs font-extrabold text-foreground">Ambiente Cocina sin Equipamiento</h5>
                                    <p className="text-[10px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                                      ¿Deseas auto-cargar la vajilla, cubertería, electrodomésticos y consumibles recomendados para un estándar de 5 estrellas en Airbnb?
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => handleSeedKitchen(prop.id, space.id)}
                                    className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary/95 transition-all disabled:opacity-50"
                                  >
                                    Cargar Equipamiento Estándar
                                  </button>
                                </div>
                              ) : isKitchen ? (
                                /* Advanced accordion group layout for Kitchen items */
                                <div className="space-y-2">
                                  {[
                                    { id: 'Vajilla y Cubertería', emoji: '🍽️', label: 'Vajilla y Cubertería' },
                                    { id: 'Utensilios y Menaje', emoji: '🍳', label: 'Utensilios y Menaje' },
                                    { id: 'Electrodomésticos', emoji: '🔌', label: 'Electrodomésticos' },
                                    { id: 'Consumibles', emoji: '🧼', label: 'Consumibles e Insumos' },
                                    { id: 'Otros', emoji: '📦', label: 'Otros Insumos de Cocina' },
                                  ].map((subGroup) => {
                                    const subGroupItems = spaceItems.filter(i => {
                                      if (subGroup.id === 'Otros') {
                                        return !i.subCategory || !['Vajilla y Cubertería', 'Utensilios y Menaje', 'Electrodomésticos', 'Consumibles'].includes(i.subCategory);
                                      }
                                      return i.subCategory === subGroup.id;
                                    });

                                    const isOpen = expandedKitchenSections[subGroup.id];

                                    return (
                                      <div key={subGroup.id} className="border border-border/50 rounded-xl overflow-hidden bg-background">
                                        {/* Sub-Category Accordion Trigger */}
                                        <button
                                          type="button"
                                          onClick={() => toggleKitchenSection(subGroup.id)}
                                          className="w-full flex items-center justify-between p-3 text-xs font-bold hover:bg-muted/30 transition-colors h-11 text-left"
                                        >
                                          <span className="flex items-center gap-2">
                                            <span>{subGroup.emoji}</span>
                                            <span>{subGroup.label}</span>
                                            <span className="text-[10px] text-muted-foreground font-semibold">
                                              ({subGroupItems.length})
                                            </span>
                                          </span>
                                          {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                        </button>

                                        {/* Sub-Category items */}
                                        {isOpen && (
                                          <div className="p-3 border-t border-border/40 divide-y divide-border/40 bg-muted/5">
                                            {subGroupItems.length === 0 ? (
                                              <p className="text-[11px] text-muted-foreground text-center py-3">No hay elementos en esta categoría.</p>
                                            ) : (
                                              subGroupItems.map(item => (
                                                <InventoryItemRow 
                                                  key={item.id} 
                                                  item={item} 
                                                  onAdjust={handleStockAdjust} 
                                                  onEdit={(it) => {
                                                    setSelectedInventoryItemForEdit(it);
                                                    setEditInventoryForm({
                                                      id: it.id,
                                                      propertyId: it.propertyId,
                                                      spaceId: it.spaceId || '',
                                                      name: it.name,
                                                      currentStock: it.currentStock.toString(),
                                                      minStock: it.minStock.toString(),
                                                      unit: it.unit,
                                                      category: it.category,
                                                      subCategory: it.subCategory || '',
                                                      itemType: it.itemType || 'OPERATIVO'
                                                    });
                                                    setIsEditInventoryOpen(true);
                                                  }}
                                                  onDelete={handleDeleteInventoryClick}
                                                  onOpenAdjust={(it) => {
                                                    setSelectedInventoryItem(it);
                                                    setIsInventoryOpen(true);
                                                  }}
                                                />
                                              ))
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                /* Flat list for normal spaces */
                                <div className="divide-y divide-border/40 bg-background rounded-xl border border-border/50 p-2">
                                  {spaceItems.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-4">Sin insumos registrados.</p>
                                  ) : (
                                    spaceItems.map(item => (
                                      <InventoryItemRow 
                                        key={item.id} 
                                        item={item} 
                                        onAdjust={handleStockAdjust} 
                                        onEdit={(it) => {
                                          setSelectedInventoryItemForEdit(it);
                                          setEditInventoryForm({
                                            id: it.id,
                                            propertyId: it.propertyId,
                                            spaceId: it.spaceId || '',
                                            name: it.name,
                                            currentStock: it.currentStock.toString(),
                                            minStock: it.minStock.toString(),
                                            unit: it.unit,
                                            category: it.category,
                                            subCategory: it.subCategory || '',
                                            itemType: it.itemType || 'OPERATIVO'
                                          });
                                          setIsEditInventoryOpen(true);
                                        }}
                                        onDelete={handleDeleteInventoryClick}
                                        onOpenAdjust={(it) => {
                                          setSelectedInventoryItem(it);
                                          setIsInventoryOpen(true);
                                        }}
                                      />
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* 2. Reposición Category (Static block) */}
                    <div className="border border-dashed border-border rounded-xl p-4 bg-muted/5 space-y-4">
                      {/* Clickable Header for Reposición */}
                      <div 
                        onClick={() => toggleSpaceCollapse(`reposicion-${prop.id}`)}
                        className="flex items-center justify-between pb-2 border-b border-border/40 cursor-pointer select-none"
                      >
                        <span className="font-extrabold text-sm text-muted-foreground flex items-center gap-2 pr-4 flex-1">
                          {isRepoCollapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />}
                          <span>📦 Reposición y Carga General</span>
                          <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-semibold shrink-0">
                            {reposicionItems.length}
                          </span>
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setInventoryForm({
                                propertyId: prop.id,
                                spaceId: '',
                                name: '',
                                currentStock: '',
                                minStock: '',
                                unit: 'unidades',
                                category: 'Reposición',
                                subCategory: '',
                                itemType: 'OPERATIVO'
                              });
                              setIsNewInventoryOpen(true);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-extrabold text-muted-foreground bg-muted hover:bg-muted-foreground/10 border border-border px-2.5 py-1.5 rounded-lg transition-all active:scale-95"
                            style={{ minHeight: '32px' }}
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Insumo</span>
                          </button>
                        </div>
                      </div>

                      {/* Reposicion List (only rendered if NOT collapsed) */}
                      {!isRepoCollapsed && (
                        <div className="divide-y divide-border/40 bg-background rounded-xl border border-border/50 p-2 animate-fade-in">
                          {reposicionItems.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-4">No hay insumos generales de reposición.</p>
                          ) : (
                            reposicionItems.map(item => (
                              <InventoryItemRow 
                                key={item.id} 
                                item={item} 
                                onAdjust={handleStockAdjust} 
                                onEdit={(it) => {
                                  setSelectedInventoryItemForEdit(it);
                                  setEditInventoryForm({
                                    id: it.id,
                                    propertyId: it.propertyId,
                                    spaceId: it.spaceId || '',
                                    name: it.name,
                                    currentStock: it.currentStock.toString(),
                                    minStock: it.minStock.toString(),
                                    unit: it.unit,
                                    category: it.category,
                                    subCategory: it.subCategory || '',
                                    itemType: it.itemType || 'OPERATIVO'
                                  });
                                  setIsEditInventoryOpen(true);
                                }}
                                onDelete={handleDeleteInventoryClick}
                                onOpenAdjust={(it) => {
                                  setSelectedInventoryItem(it);
                                  setIsInventoryOpen(true);
                                }}
                              />
                            ))
                          )}
                        </div>
                      )}
                    </div>
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

      {/* 0.1. Edit Property Drawer */}
      <Drawer
        isOpen={isEditPropertyOpen}
        onClose={() => {
          setIsEditPropertyOpen(false);
          setSelectedPropertyForEdit(null);
        }}
        title="Editar Propiedad"
      >
        {selectedPropertyForEdit && (
          <form onSubmit={handleEditPropertySubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Nombre de la Propiedad</label>
              <input
                type="text"
                required
                value={editPropertyForm.name}
                onChange={(e) => setEditPropertyForm({ ...editPropertyForm, name: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ minHeight: '44px' }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Dirección</label>
              <input
                type="text"
                required
                value={editPropertyForm.address}
                onChange={(e) => setEditPropertyForm({ ...editPropertyForm, address: e.target.value })}
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
                    onClick={() => setEditPropertyForm({ ...editPropertyForm, colorCode: color.hex })}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all active:scale-95",
                      editPropertyForm.colorCode === color.hex 
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
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        )}
      </Drawer>

      {/* 0.2. New Space Drawer */}
      <Drawer
        isOpen={isNewSpaceOpen}
        onClose={() => setIsNewSpaceOpen(false)}
        title="Crear Nuevo Ambiente"
      >
        <form onSubmit={handleNewSpaceSubmit} className="space-y-4">
          <input type="hidden" value={newSpaceForm.propertyId} />
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase font-semibold">Propiedad</label>
            <div className="p-3 bg-muted/30 border border-border rounded-xl text-sm font-bold text-foreground">
              {properties.find(p => p.id === newSpaceForm.propertyId)?.name}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">Nombre del Ambiente</label>
            <input
              type="text"
              required
              placeholder="Ej. Terraza, Cochera, Habitación 2"
              value={newSpaceForm.name}
              onChange={(e) => setNewSpaceForm({ ...newSpaceForm, name: e.target.value })}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              style={{ minHeight: '44px' }}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/95 transition-colors disabled:opacity-50 h-12 mt-4"
          >
            {isSubmitting ? 'Guardando...' : 'Crear Ambiente'}
          </button>
        </form>
      </Drawer>

      {/* 0.3. Edit Space Drawer */}
      <Drawer
        isOpen={isEditSpaceOpen}
        onClose={() => {
          setIsEditSpaceOpen(false);
          setSelectedSpaceForEdit(null);
        }}
        title="Editar Nombre del Ambiente"
      >
        {selectedSpaceForEdit && (
          <form onSubmit={handleEditSpaceSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Nuevo Nombre</label>
              <input
                type="text"
                required
                value={editSpaceForm.name}
                onChange={(e) => setEditSpaceForm({ ...editSpaceForm, name: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ minHeight: '44px' }}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/95 transition-colors disabled:opacity-50 h-12 mt-4"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        )}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Propiedad</label>
                <select
                  value={inventoryForm.propertyId}
                  onChange={(e) => {
                    const propId = e.target.value;
                    const propSpaces = spaces.filter(s => s.propertyId === propId);
                    setInventoryForm({
                      ...inventoryForm,
                      propertyId: propId,
                      spaceId: propSpaces[0]?.id || ''
                    });
                  }}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{ minHeight: '44px' }}
                >
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Destino</label>
                <select
                  value={inventoryForm.category === 'Reposición' ? 'Reposición' : 'Ambiente'}
                  onChange={(e) => {
                    const isRepo = e.target.value === 'Reposición';
                    setInventoryForm({
                      ...inventoryForm,
                      category: isRepo ? 'Reposición' : 'General',
                      spaceId: isRepo ? '' : (spacesForSelectedPropertyInNewItem[0]?.id || '')
                    });
                  }}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{ minHeight: '44px' }}
                >
                  <option value="Ambiente">Ambiente de la Casa</option>
                  <option value="Reposición">Reposición / Carga Gral.</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Type of inventory: Operational vs Active Assets */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Tipo Inventario</label>
                <select
                  value={inventoryForm.itemType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInventoryForm({
                      ...inventoryForm,
                      itemType: val,
                      minStock: val === 'ACTIVO' ? '0' : inventoryForm.minStock
                    });
                  }}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring font-semibold text-foreground"
                  style={{ minHeight: '44px' }}
                >
                  <option value="OPERATIVO">Operativo (Con Alerta)</option>
                  <option value="ACTIVO">Activo Fijo (Sin Alerta)</option>
                </select>
              </div>

              {inventoryForm.category !== 'Reposición' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Ambiente</label>
                  <select
                    value={inventoryForm.spaceId}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, spaceId: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    style={{ minHeight: '44px' }}
                  >
                    {spacesForSelectedPropertyInNewItem.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Nombre del Insumo / Activo</label>
              <input
                type="text"
                required
                placeholder={inventoryForm.itemType === 'ACTIVO' ? "Ej. Aire Acondicionado Split, Cama Matrimonial" : "Ej. Juego de sábanas, Champú"}
                value={inventoryForm.name}
                onChange={(e) => setInventoryForm({ ...inventoryForm, name: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ minHeight: '44px' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Cantidad Actual</label>
                <input
                  type="number"
                  required
                  placeholder="1"
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
                  disabled={inventoryForm.itemType === 'ACTIVO'}
                  placeholder={inventoryForm.itemType === 'ACTIVO' ? 'N/A (Activo Fijo)' : '10'}
                  value={inventoryForm.itemType === 'ACTIVO' ? '0' : inventoryForm.minStock}
                  onChange={(e) => setInventoryForm({ ...inventoryForm, minStock: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:bg-muted/30"
                  style={{ minHeight: '44px' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Unidad de Medida</label>
                <select
                  value={inventoryForm.unit}
                  onChange={(e) => setInventoryForm({ ...inventoryForm, unit: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{ minHeight: '44px' }}
                >
                  <option value="unidades">Unidades</option>
                  <option value="unidad">Unidad (Individual)</option>
                  <option value="cápsulas">Cápsulas</option>
                  <option value="paquetes">Paquetes</option>
                  <option value="rollos">Rollos</option>
                  <option value="frascos">Frascos</option>
                  <option value="bolsas">Bolsas</option>
                </select>
              </div>

              {/* Sub-Category dropdown selector (ONLY FOR KITCHEN ITEMS) */}
              {inventoryForm.category !== 'Reposición' && isKitchenSelectedInNewItem && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Clasificación Cocina</label>
                  <select
                    value={inventoryForm.subCategory}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, subCategory: e.target.value })}
                    required
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    style={{ minHeight: '44px' }}
                  >
                    <option value="">Seleccionar grupo...</option>
                    <option value="Vajilla y Cubertería">Vajilla y Cubertería</option>
                    <option value="Utensilios y Menaje">Utensilios y Menaje</option>
                    <option value="Electrodomésticos">Electrodomésticos</option>
                    <option value="Consumibles">Consumibles e Insumos</option>
                  </select>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/95 transition-colors disabled:opacity-50 h-12 mt-4"
            >
              {isSubmitting ? 'Guardando...' : 'Agregar al Sistema'}
            </button>
          </form>
        )}
      </Drawer>

      {/* 0.6. Edit Inventory Item Drawer */}
      <Drawer
        isOpen={isEditInventoryOpen}
        onClose={() => {
          setIsEditInventoryOpen(false);
          setSelectedInventoryItemForEdit(null);
        }}
        title="Modificar Insumo / Activo"
      >
        {selectedInventoryItemForEdit && (
          <form onSubmit={handleEditInventorySubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Propiedad</label>
                <select
                  value={editInventoryForm.propertyId}
                  onChange={(e) => {
                    const propId = e.target.value;
                    const propSpaces = spaces.filter(s => s.propertyId === propId);
                    setEditInventoryForm({
                      ...editInventoryForm,
                      propertyId: propId,
                      spaceId: propSpaces[0]?.id || ''
                    });
                  }}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{ minHeight: '44px' }}
                >
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Destino</label>
                <select
                  value={editInventoryForm.category === 'Reposición' ? 'Reposición' : 'Ambiente'}
                  onChange={(e) => {
                    const isRepo = e.target.value === 'Reposición';
                    setEditInventoryForm({
                      ...editInventoryForm,
                      category: isRepo ? 'Reposición' : 'General',
                      spaceId: isRepo ? '' : (spacesForSelectedPropertyInEditItem[0]?.id || '')
                    });
                  }}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{ minHeight: '44px' }}
                >
                  <option value="Ambiente">Ambiente de la Casa</option>
                  <option value="Reposición">Reposición / Carga Gral.</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Tipo Inventario</label>
                <select
                  value={editInventoryForm.itemType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditInventoryForm({
                      ...editInventoryForm,
                      itemType: val,
                      minStock: val === 'ACTIVO' ? '0' : editInventoryForm.minStock
                    });
                  }}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring font-semibold text-foreground"
                  style={{ minHeight: '44px' }}
                >
                  <option value="OPERATIVO">Operativo (Con Alerta)</option>
                  <option value="ACTIVO">Activo Fijo (Sin Alerta)</option>
                </select>
              </div>

              {editInventoryForm.category !== 'Reposición' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Ambiente</label>
                  <select
                    value={editInventoryForm.spaceId}
                    onChange={(e) => setEditInventoryForm({ ...editInventoryForm, spaceId: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    style={{ minHeight: '44px' }}
                  >
                    {spacesForSelectedPropertyInEditItem.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Nombre del Insumo / Activo</label>
              <input
                type="text"
                required
                value={editInventoryForm.name}
                onChange={(e) => setEditInventoryForm({ ...editInventoryForm, name: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ minHeight: '44px' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Cantidad Actual</label>
                <input
                  type="number"
                  required
                  value={editInventoryForm.currentStock}
                  onChange={(e) => setEditInventoryForm({ ...editInventoryForm, currentStock: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{ minHeight: '44px' }}
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Stock Mínimo (Alerta)</label>
                <input
                  type="number"
                  required
                  disabled={editInventoryForm.itemType === 'ACTIVO'}
                  placeholder={editInventoryForm.itemType === 'ACTIVO' ? 'N/A (Activo Fijo)' : '10'}
                  value={editInventoryForm.itemType === 'ACTIVO' ? '0' : editInventoryForm.minStock}
                  onChange={(e) => setEditInventoryForm({ ...editInventoryForm, minStock: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:bg-muted/30"
                  style={{ minHeight: '44px' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Unidad de Medida</label>
                <select
                  value={editInventoryForm.unit}
                  onChange={(e) => setEditInventoryForm({ ...editInventoryForm, unit: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{ minHeight: '44px' }}
                >
                  <option value="unidades">Unidades</option>
                  <option value="unidad">Unidad (Individual)</option>
                  <option value="cápsulas">Cápsulas</option>
                  <option value="paquetes">Paquetes</option>
                  <option value="rollos">Rollos</option>
                  <option value="frascos">Frascos</option>
                  <option value="bolsas">Bolsas</option>
                </select>
              </div>

              {/* Sub-Category dropdown selector (ONLY FOR KITCHEN ITEMS) */}
              {editInventoryForm.category !== 'Reposición' && isKitchenSelectedInEditItem && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Clasificación Cocina</label>
                  <select
                    value={editInventoryForm.subCategory}
                    onChange={(e) => setEditInventoryForm({ ...editInventoryForm, subCategory: e.target.value })}
                    required
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    style={{ minHeight: '44px' }}
                  >
                    <option value="">Seleccionar grupo...</option>
                    <option value="Vajilla y Cubertería">Vajilla y Cubertería</option>
                    <option value="Utensilios y Menaje">Utensilios y Menaje</option>
                    <option value="Electrodomésticos">Electrodomésticos</option>
                    <option value="Consumibles">Consumibles e Insumos</option>
                  </select>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/95 transition-colors disabled:opacity-50 h-12 mt-4"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
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

            {(selectedInventoryItem.itemType || 'OPERATIVO') === 'OPERATIVO' && selectedInventoryItem.currentStock <= selectedInventoryItem.minStock && (
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

// Sub-component for clean rendering of each inventory row
interface InventoryItemRowProps {
  item: any;
  onAdjust: (itemId: string, current: number, diff: number) => void;
  onEdit: (item: any) => void;
  onDelete: (itemId: string, itemName: string) => void;
  onOpenAdjust: (item: any) => void;
}

function InventoryItemRow({ item, onAdjust, onEdit, onDelete, onOpenAdjust }: InventoryItemRowProps) {
  const isOperational = (item.itemType || 'OPERATIVO') === 'OPERATIVO';
  const isLow = isOperational && item.currentStock <= item.minStock;
  
  return (
    <div className="flex items-center justify-between py-3 hover:bg-muted/30 transition-colors px-2 rounded-lg">
      <div className="min-w-0 pr-4 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span 
            onClick={() => onOpenAdjust(item)}
            className={cn(
              "font-bold text-xs cursor-pointer hover:underline text-foreground",
              isLow && "text-amber-600 dark:text-amber-400 font-extrabold"
            )}
          >
            {item.name}
          </span>
          
          {/* Badge for assets */}
          {!isOperational && (
            <span className="text-[9px] bg-blue-500/10 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
              Activo
            </span>
          )}
          
          {isLow && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Bajo stock" />
          )}
        </div>
        <span className="text-[10px] text-muted-foreground block">
          {isOperational ? `Mínimo: ${item.minStock} ${item.unit}` : 'Equipamiento fijo'}
        </span>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {/* stock display */}
        <div className="text-right">
          <span className={cn(
            "font-extrabold text-sm block",
            isLow ? "text-amber-600 dark:text-amber-400" : "text-foreground"
          )}>
            {item.currentStock}
          </span>
          <span className="text-[9px] text-muted-foreground block font-medium uppercase tracking-wider">{item.unit}</span>
        </div>

        {/* stock quick adjust increment/decrement */}
        <div className="flex items-center border border-border rounded-lg bg-background overflow-hidden">
          <button
            onClick={() => onAdjust(item.id, item.currentStock, -1)}
            disabled={item.currentStock <= 0}
            className="px-2 py-1 bg-background hover:bg-muted font-bold text-xs disabled:opacity-40 text-muted-foreground"
            style={{ minWidth: '28px', minHeight: '28px' }}
          >
            -
          </button>
          <button
            onClick={() => onAdjust(item.id, item.currentStock, 1)}
            className="px-2 py-1 bg-background hover:bg-muted font-bold text-xs text-muted-foreground border-l border-border"
            style={{ minWidth: '28px', minHeight: '28px' }}
          >
            +
          </button>
        </div>

        {/* item operations edit / delete */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
            title="Editar"
            style={{ minWidth: '32px', minHeight: '32px' }}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(item.id, item.name)}
            className="p-1.5 hover:bg-rose-50 rounded-md text-muted-foreground hover:text-rose-600 transition-colors"
            title="Eliminar"
            style={{ minWidth: '32px', minHeight: '32px' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
