import { motion, AnimatePresence } from "framer-motion";
import { Room } from "@/lib/hotel";
import { cn } from "@/lib/utils";
import { ArrowUp } from "lucide-react";

interface HotelGridProps {
  rooms: Room[];
  lastBookedIds: string[];
  onRoomClick: (room: Room) => void;
}

export function HotelGrid({ rooms, lastBookedIds, onRoomClick }: HotelGridProps) {
  const floors = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  const getRoomsOnFloor = (floor: number) => 
    rooms.filter(r => r.floor === floor).sort((a, b) => a.position - b.position);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-[2rem] p-10 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 -mb-32" />
      
      <div className="flex flex-col gap-6 relative z-10">
        {floors.map((floor) => (
          <div key={floor} className="flex items-center gap-6 group/floor">
            {/* Floor Label */}
            <div className="w-20 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-0.5">Floor</span>
              <span className="font-serif text-3xl text-primary/80 group-hover/floor:text-primary transition-colors">{floor}</span>
            </div>
            
            {/* Lift Shaft */}
            <div className="w-14 h-20 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10 relative group shadow-inner">
              <motion.div 
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowUp className="w-5 h-5 text-accent/60" />
              </motion.div>
            </div>

            {/* Rooms */}
            <div className="flex-1 flex gap-3 p-3 bg-white/40 rounded-3xl border border-white/60 shadow-sm overflow-x-auto horizontal-scrollbar">
              {getRoomsOnFloor(floor).map((room) => {
                const isJustBooked = lastBookedIds.includes(room.id);
                return (
                  <motion.div
                    key={room.id}
                    layout
                    whileHover={{ 
                      scale: 1.08, 
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                      zIndex: 10
                    }}
                    animate={{
                      backgroundColor: room.isBooked 
                        ? (isJustBooked ? "hsl(var(--accent))" : "hsl(var(--primary))")
                        : "hsl(var(--card))",
                      color: room.isBooked 
                        ? (isJustBooked ? "hsl(var(--accent-foreground))" : "hsl(var(--primary-foreground))")
                        : "hsl(var(--foreground))",
                      borderColor: isJustBooked ? "hsl(var(--accent))" : "transparent",
                    }}
                    className={cn(
                      "relative w-14 h-20 rounded-2xl flex flex-col items-center justify-center text-[10px] font-semibold border transition-colors cursor-pointer",
                      !room.isBooked && "border-slate-100 shadow-sm hover:border-accent/30"
                    )}
                    onClick={() => onRoomClick(room)}
                  >
                    <span className="opacity-40 text-[8px] uppercase tracking-wider">Room</span>
                    <span className="text-base font-bold font-serif">{room.number}</span>
                    
                    <AnimatePresence>
                      {room.isBooked && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          className="absolute -top-1.5 -right-1.5"
                        >
                           <div className="w-4 h-4 gold-gradient rounded-full border-2 border-white shadow-lg" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Subtle Glow for Booked Rooms */}
                    {room.isBooked && !isJustBooked && (
                      <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-lg -z-10" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
