export interface FlightStatus {
  flightNumber: string;
  airline: string;
  aircraft: string; // e.g., Boeing 777-300ER
  status: 'Scheduled' | 'In Air' | 'Landed' | 'Delayed' | 'Cancelled';
  
  origin: {
    code: string;
    city: string;
    name: string;
  };
  destination: {
    code: string;
    city: string;
    name: string;
  };
  stops: {
    code: string;
    city: string;
  }[];

  // Timing
  scheduledDepartureTime: Date;
  actualDepartureTime: Date | null;
  scheduledArrivalTime: Date;
  estimatedArrivalTime: Date | null;
  
  // Metrics
  totalDurationHours: number;
  timeTravelledHours: number;
  timeRemainingHours: number;
  
  totalDistanceKm: number;
  distanceTravelledKm: number;
  remainingDistanceKm: number;
}

export interface AirportSchedule {
  airportCode: string;
  type: 'Arrival' | 'Departure';
  flightNumber: string;
  airline: string;
  time: Date;
  status: string;
  otherAirportCode: string;
}

export interface WeatherInfo {
  locationCode: string;
  city: string;
  temperatureC: number;
  condition: string;
  icon: string; // FontAwesome icon class
  humidity: number;
  windSpeedKmh: number;
}
