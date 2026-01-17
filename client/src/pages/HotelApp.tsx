import { useState, useEffect } from "react";
import { generateHotel, findBestBooking, calculateSetCost, Room } from "@/lib/hotel";
import { HotelGrid } from "@/components/HotelGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { RefreshCcw, Shuffle, CheckCircle2, MapPin, Download, User, Phone, Mail, Clock, Info, Check, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportToCSV } from "@/lib/export";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  guestInfo: { name: string; phone: string; email: string; duration: string };
  rooms: Room[];
  cost: number;
  startTime: Date;
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}

function AnimatedCounter({ value }: { value: number }) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}

export default function HotelApp() {
  const [rooms, setRooms] = useState<Room[]>(generateHotel());
  const [numRooms, setNumRooms] = useState<string>("1");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<Room[] | null>(null);
  const [pendingCancellation, setPendingCancellation] = useState<Booking | null>(null);
  const [bookingState, setBookingState] = useState<"idle" | "loading" | "success">("idle");
  const [guestInfo, setGuestInfo] = useState({
    name: "",
    phone: "",
    email: "",
    duration: "1"
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBookClick = () => {
    const n = parseInt(numRooms);
    if (isNaN(n) || n < 1 || n > 5) {
      toast({ title: "Invalid Request", description: "Please enter 1-5 rooms.", variant: "destructive" });
      return;
    }
    if (!guestInfo.name || !guestInfo.phone) {
      toast({ title: "Missing Info", description: "Please provide guest name and phone.", variant: "destructive" });
      return;
    }

    const booking = findBestBooking(n, roomsWithBookingStatus);
    if (!booking) {
      toast({ title: "Booking Failed", description: "Not enough available rooms.", variant: "destructive" });
      return;
    }

    setPendingBooking(booking);
    setShowConfirm(true);
  };

  const confirmBooking = async () => {
    if (!pendingBooking) return;
    
    setBookingState("loading");
    
    await new Promise(resolve => setTimeout(resolve, 800));

    const cost = calculateSetCost(pendingBooking);
    const newBooking: Booking = {
      id: Date.now().toString(),
      guestInfo,
      rooms: pendingBooking,
      cost,
      startTime: new Date(),
    };

    setBookings(prev => [...prev, newBooking]);
    setSelectedBookingId(newBooking.id);
    setBookingState("success");
    setShowConfirm(false);
    setGuestInfo({ name: "", phone: "", email: "", duration: "1" });


    setTimeout(() => setBookingState("idle"), 3000);

    toast({
      title: "Reservation Confirmed",
      description: `Welcome, ${newBooking.guestInfo.name}. Your rooms are ready.`,
    });
  };

  const handleCancelClick = (room: Room) => {
    const booking = bookings.find(b => b.rooms.some(r => r.id === room.id));
    if (booking) {
      setPendingCancellation(booking);
      setShowCancelConfirm(true);
    }
  };

  const confirmCancellation = () => {
    if (!pendingCancellation) return;
    setBookings(prev => prev.filter(b => b.id !== pendingCancellation.id));
    if (selectedBookingId === pendingCancellation.id) {
      setSelectedBookingId(null);
    }
    setShowCancelConfirm(false);
    setPendingCancellation(null);
    toast({
      title: "Booking Cancelled",
      description: `Booking for ${pendingCancellation.guestInfo.name} has been cancelled.`,
    });
  };

  const handleExport = () => {
    if (!selectedBooking) return;
    exportToCSV(selectedBooking.guestInfo, selectedBooking.rooms, selectedBooking.cost);
  };

  const handleRandomize = () => {
    setRooms(generateHotel().map(r => ({ ...r, isBooked: Math.random() > 0.7 })));
    setLastBookedIds([]);
    setLastCost(null);
  };

  const handleReset = () => {
    setRooms(generateHotel());
    setBookings([]);
    setSelectedBookingId(null);
    setGuestInfo({ name: "", phone: "", email: "", duration: "1" });
  };

  const bookedRoomIds = new Set(bookings.flatMap(b => b.rooms.map(r => r.id)));
  const roomsWithBookingStatus = rooms.map(r => ({ ...r, isBooked: bookedRoomIds.has(r.id) }));

  const totalBooked = bookedRoomIds.size;
  const totalAvailable = rooms.length - totalBooked;

  const selectedBooking = bookings.find(b => b.id === selectedBookingId);

  return (
    <div className="min-h-screen bg-background text-primary font-sans p-6 md:p-12 overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Sidebar Controls */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 space-y-8"
        >
          <div className="space-y-2">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-serif font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-primary via-primary/80 to-accent"
            >
              Grand Hotel
            </motion.h1>
            <p className="text-muted-foreground font-medium tracking-wide uppercase text-[10px]">Excellence in Hospitality since 1924</p>
          </div>

          <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-2xl ring-1 ring-black/5 rounded-[2rem] overflow-hidden">
            <CardHeader className="pb-4 bg-primary/5">
              <CardTitle className="text-xl font-serif">Guest Registration</CardTitle>
              <CardDescription className="text-[11px] uppercase tracking-widest font-bold opacity-60">Personal Detail Entry</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-5">
              <div className="grid gap-4">
                <div className="group relative">
                  <User className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                  <Input 
                    placeholder="Guest Full Name" 
                    className="pl-12 h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-accent transition-all" 
                    value={guestInfo.name} 
                    onChange={e => setGuestInfo({...guestInfo, name: e.target.value})}
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Phone Number" 
                    className="pl-12 h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-accent transition-all" 
                    value={guestInfo.phone} 
                    onChange={e => setGuestInfo({...guestInfo, phone: e.target.value})}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Clock className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="number" 
                      placeholder="Nights" 
                      className="pl-12 h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-accent transition-all" 
                      value={guestInfo.duration} 
                      onChange={e => setGuestInfo({...guestInfo, duration: e.target.value})}
                    />
                  </div>
                  <div className="w-28">
                    <Input 
                      type="number" 
                      min="1" max="5" 
                      className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-accent transition-all text-center font-bold"
                      value={numRooms} 
                      onChange={e => setNumRooms(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleBookClick} 
                disabled={bookingState === "loading"}
                className={cn(
                  "w-full h-14 text-base font-bold shadow-xl transition-all duration-300 rounded-xl relative overflow-hidden",
                  bookingState === "success" ? "bg-secondary text-white" : "bg-primary hover:bg-primary/90 text-white"
                )}
              >
                <AnimatePresence mode="wait">
                  {bookingState === "loading" ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <RefreshCcw className="w-5 h-5 animate-spin" />
                    </motion.div>
                  ) : bookingState === "success" ? (
                    <motion.div key="success" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                      <Check className="w-5 h-5" /> Confirmed
                    </motion.div>
                  ) : (
                    <motion.span key="idle">Book Sanctuary</motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </CardContent>
          </Card>

          <AnimatePresence>
            {bookings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <Card className="border-none shadow-xl bg-white/80 backdrop-blur-2xl ring-1 ring-black/5 rounded-[2rem] overflow-hidden">
                  <CardHeader className="pb-4 bg-primary/5">
                    <CardTitle className="text-xl font-serif flex items-center gap-3">
                      <Users className="w-6 h-6 text-accent" />
                      <span>Active Bookings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Select onValueChange={setSelectedBookingId} value={selectedBookingId || ""}>
                      <SelectTrigger className="w-full h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-accent transition-all">
                        <SelectValue placeholder="Select a booking to view details" />
                      </SelectTrigger>
                      <SelectContent>
                        {bookings.map(b => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.guestInfo.name} - {b.rooms.length} rooms
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedBooking && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="border-none shadow-xl bg-secondary text-white rounded-[2rem] overflow-hidden">
                  <div className="px-6 py-3 flex justify-between items-center bg-black/10">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Reserved Estate</span>
                    <Button variant="ghost" size="sm" onClick={handleExport} className="h-7 text-[10px] gap-1 hover:bg-white/10 text-white">
                      <Download className="w-3 h-3" /> Export Details
                    </Button>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/10 rounded-2xl">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-serif text-lg leading-tight">{selectedBooking.guestInfo.name}</p>
                        <p className="text-xs opacity-70">Suites {selectedBooking.rooms.map(r => r.number).join(", ")}</p>
                      </div>
                    </div>
                    {selectedBooking.startTime && (
                      <div className="flex items-center justify-between p-4 bg-black/10 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-accent" />
                          <span className="text-xs font-bold tracking-tight">Booking Duration</span>
                        </div>
                        <span className="font-mono text-lg">
                          {formatDuration((currentTime.getTime() - selectedBooking.startTime.getTime()) / 1000)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between p-4 bg-black/10 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-accent" />
                        <span className="text-xs font-bold tracking-tight">Travel Duration</span>
                      </div>
                      <span className="font-serif text-lg">{selectedBooking.cost} <span className="text-[10px] font-sans font-normal opacity-70 uppercase">min</span></span>
                    </div>
                    <Button 
                      variant="destructive" 
                      className="w-full h-12 rounded-xl"
                      onClick={() => {
                        setPendingCancellation(selectedBooking);
                        setShowCancelConfirm(true);
                      }}
                    >
                      Checkout
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass p-6 rounded-[2rem] flex flex-col items-center text-center">
              <div className="text-4xl font-serif font-bold text-accent">
                <AnimatedCounter value={totalAvailable} />
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mt-1">Suites Vacant</div>
            </div>
            <div className="glass p-6 rounded-[2rem] flex flex-col items-center text-center">
              <div className="text-4xl font-serif font-bold text-primary/30">
                <AnimatedCounter value={totalBooked} />
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mt-1">Suites Occupied</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={handleRandomize} className="flex-1 h-12 rounded-xl text-[10px] uppercase font-bold tracking-widest hover:bg-primary/5">
              <Shuffle className="mr-2 h-4 w-4" /> Shuffle Estate
            </Button>
            <Button variant="ghost" onClick={handleReset} className="flex-1 h-12 rounded-xl text-[10px] uppercase font-bold tracking-widest text-destructive/60 hover:text-destructive hover:bg-destructive/5">
              <RefreshCcw className="mr-2 h-4 w-4" /> Reset Manor
            </Button>
          </div>
        </motion.div>

        {/* Main Visualization */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-8"
        >
          <HotelGrid 
            rooms={roomsWithBookingStatus} 
            lastBookedIds={selectedBooking?.rooms.map(r => r.id) || []} 
            onRoomClick={handleCancelClick} 
          />
        </motion.div>

      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md border-none shadow-2xl glass rounded-[3rem] p-10">
          <DialogHeader className="text-center">
            <DialogTitle className="text-3xl font-serif">Curated Selection</DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-[0.15em] font-bold opacity-60">
              Optimal Suite Pairing Found
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 space-y-6">
            <div className="space-y-3">
              <div className="text-[10px] uppercase tracking-widest font-bold text-accent text-center">Assigned Suites</div>
              <div className="flex flex-wrap justify-center gap-3">
                {pendingBooking?.map(r => (
                  <motion.span 
                    key={r.id} 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }}
                    className="px-5 py-2 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg"
                  >
                    {r.number}
                  </motion.span>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-primary/5 rounded-[2rem] border border-primary/10">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Guest Patron</div>
                <div className="text-lg font-serif truncate">{guestInfo.name}</div>
              </div>
              <div className="p-5 bg-primary/5 rounded-[2rem] border border-primary/10">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Travel Estimate</div>
                <div className="text-lg font-serif">{pendingBooking ? calculateSetCost(pendingBooking) : 0} <span className="text-[10px] font-sans font-normal">min</span></div>
              </div>
            </div>

            <div className="p-5 bg-accent/5 rounded-[2rem] border border-accent/20 flex gap-4 items-start">
              <div className="p-2 bg-accent/20 rounded-xl">
                <Info className="w-5 h-5 text-accent-foreground" />
              </div>
              <div className="text-[11px] text-primary/70 leading-relaxed font-medium">
                Our algorithm has prioritized adjacent placement to minimize travel duration between suites, ensuring a seamless experience for your party.
              </div>
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowConfirm(false)} className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-widest text-[11px]">Reconsider</Button>
            <Button onClick={confirmBooking} className="flex-1 h-14 rounded-2xl bg-primary text-white font-bold uppercase tracking-widest text-[11px] shadow-xl hover:shadow-primary/20">Finalize</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent className="sm:max-w-md border-none shadow-2xl glass rounded-[3rem] p-10">
          <DialogHeader className="text-center">
            <DialogTitle className="text-3xl font-serif">Cancel Booking</DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-[0.15em] font-bold opacity-60">
              For guest: {pendingCancellation?.guestInfo.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 space-y-6">
            <p className="text-center text-primary/70">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowCancelConfirm(false)} className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-widest text-[11px]">Go Back</Button>
            <Button onClick={confirmCancellation} className="flex-1 h-14 rounded-2xl bg-destructive text-white font-bold uppercase tracking-widest text-[11px] shadow-xl hover:shadow-destructive/20">Cancel Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
