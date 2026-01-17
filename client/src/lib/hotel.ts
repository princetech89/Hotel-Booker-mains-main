export interface Room {
  id: string;
  number: string;
  floor: number;
  position: number; // Distance from lift (1-based index)
  isBooked: boolean;
}

export interface BookingResult {
  rooms: Room[];
  travelTime: number;
}

// Generate the initial state of the hotel
export function generateHotel(): Room[] {
  const rooms: Room[] = [];
  
  // Floors 1-9: Rooms X01-X10
  for (let floor = 1; floor <= 9; floor++) {
    for (let pos = 1; pos <= 10; pos++) {
      const roomNum = floor * 100 + pos;
      rooms.push({
        id: roomNum.toString(),
        number: roomNum.toString(),
        floor,
        position: pos,
        isBooked: false,
      });
    }
  }

  // Floor 10: Rooms 1001-1007
  for (let pos = 1; pos <= 7; pos++) {
    const roomNum = 1000 + pos;
    rooms.push({
      id: roomNum.toString(),
      number: roomNum.toString(),
      floor: 10,
      position: pos,
      isBooked: false,
    });
  }

  return rooms;
}

// Calculate travel time between two rooms
function getTravelTime(r1: Room, r2: Room): number {
  if (r1.floor === r2.floor) {
    return Math.abs(r1.position - r2.position);
  }
  
  // Vertical travel involved
  // Time = Walk to Lift (r1.pos) + Lift Time (diff * 2) + Walk from Lift (r2.pos)
  // Assuming lift is at position 0
  const floorDiff = Math.abs(r1.floor - r2.floor);
  return r1.position + (floorDiff * 2) + r2.position;
}

// Calculate total span cost for a set of rooms
// "Minimize total travel time between the first and last room"
export function calculateSetCost(rooms: Room[]): number {
  if (rooms.length <= 1) return 0;

  // Sort rooms to find "First" and "Last"
  // Sorting by Floor then Position gives us the linear sequence
  const sorted = [...rooms].sort((a: Room, b: Room) => {
    if (a.floor !== b.floor) return a.floor - b.floor;
    return a.position - b.position;
  });

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  return getTravelTime(first, last);
}

export function findBestBooking(
  numRooms: number,
  allRooms: Room[]
): Room[] | null {
  const availableRooms = allRooms.filter((r) => !r.isBooked);
  if (availableRooms.length < numRooms) return null;

  // STRATEGY 1: Single Floor
  // Group by floor
  const byFloor = new Map<number, Room[]>();
  for (const r of availableRooms) {
    if (!byFloor.has(r.floor)) byFloor.set(r.floor, []);
    byFloor.get(r.floor)!.push(r);
  }

  let bestSingleFloorSet: Room[] | null = null;
  let minSingleFloorCost = Infinity;

  // Convert map to array to avoid downlevelIteration issues
  const floorEntries = Array.from(byFloor.entries());

  for (const [_, floorRooms] of floorEntries) {
    if (floorRooms.length >= numRooms) {
      // Find best contiguous subset on this floor
      // Since they are on the same floor, travel time is just (Last.Pos - First.Pos)
      // Sort by position
      floorRooms.sort((a: Room, b: Room) => a.position - b.position);
      
      // Sliding window
      for (let i = 0; i <= floorRooms.length - numRooms; i++) {
        const subset = floorRooms.slice(i, i + numRooms);
        const cost = subset[subset.length - 1].position - subset[0].position;
        
        if (cost < minSingleFloorCost) {
          minSingleFloorCost = cost;
          bestSingleFloorSet = subset;
        }
      }
    }
  }

  if (bestSingleFloorSet) {
    return bestSingleFloorSet;
  }

  // STRATEGY 2: Multi-Floor Optimization
  // Heuristic: Pivot + Nearest Neighbors
  // For every available room, assume it is part of the set.
  // Find the (N-1) "closest" other available rooms to it.
  // Evaluate the cost of that set.
  // Return the global minimum.

  let bestSet: Room[] | null = null;
  let minCost = Infinity;

  // Optimize: we don't need to check EVERY room if we find a very good one, but N is small enough
  for (const pivot of availableRooms) {
    // Calculate distance from pivot to all others
    const others = availableRooms
      .filter(r => r.id !== pivot.id)
      .map(r => ({
        room: r,
        dist: getTravelTime(pivot, r)
      }));

    // Sort by distance to pivot
    others.sort((a, b) => a.dist - b.dist);

    // Take closest N-1
    if (others.length >= numRooms - 1) {
      const candidateSet = [pivot, ...others.slice(0, numRooms - 1).map(o => o.room)];
      const cost = calculateSetCost(candidateSet);

      if (cost < minCost) {
        minCost = cost;
        bestSet = candidateSet;
      }
    }
  }

  return bestSet;
}
