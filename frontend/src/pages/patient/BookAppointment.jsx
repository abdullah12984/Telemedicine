// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Calendar as CalendarIcon, Search, Clock, MapPin, Stethoscope, Loader2 } from "lucide-react";
// import { Calendar } from "@/components/ui/calendar";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { format } from "date-fns";
// import { cn } from "@/lib/utils";
// import { getAvailableProviders, bookAppointment } from "../../services/patientService";

// const BookAppointment = () => {
//   const navigate = useNavigate();
//   const [step, setStep] = useState(1);
//   const [date, setDate] = useState(new Date());
//   const [selectedProvider, setSelectedProvider] = useState(null);
//   const [selectedTime, setSelectedTime] = useState(null);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedSpecialty, setSelectedSpecialty] = useState("all");
//   const [appointmentReason, setAppointmentReason] = useState("");
//   const [providers, setProviders] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [bookingLoading, setBookingLoading] = useState(false);

//   useEffect(() => {
//     const fetchProviders = async () => {
//       setLoading(true);
//       try {
//         const response = await getAvailableProviders(selectedSpecialty);
//         setProviders(response.data || []);
//       } catch (error) {
//         console.error('Failed to fetch providers:', error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchProviders();
//   }, [selectedSpecialty]);

//   const filteredProviders = providers.filter(provider => {
//     const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//                           provider.specialty.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchesSearch;
//   });

//   const handleProviderSelect = (provider) => {
//     setSelectedProvider(provider);
//     setStep(2);
//   };

//   const handleTimeSelect = (time) => {
//     setSelectedTime(time);
//     setStep(3);
//   };

//   const handleConfirmBooking = async () => {
//     setBookingLoading(true);
//     try {
//       const appointmentData = {
//         providerId: selectedProvider.id,
//         appointmentDate: date.toISOString().split('T')[0],
//         startTime: selectedTime,
//         endTime: selectedTime,
//         reason: appointmentReason,
//         type: 'VIRTUAL'
//       };
//       await bookAppointment(appointmentData);
//       navigate("/dashboard/patient/appointments");
//     } catch (error) {
//       alert(error.message || 'Failed to book appointment. Please try again.');
//     } finally {
//       setBookingLoading(false);
//     }
//   };

//   // ✅ Helper to get available times as string array
//   const getAvailableTimes = (provider) => {
//     if (!provider.availableTimes || provider.availableTimes.length === 0) {
//       return ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
//     }
//     // If availableTimes contains objects with start property
//     if (typeof provider.availableTimes[0] === 'object') {
//       return provider.availableTimes.map(t => t.start || t.time || "09:00");
//     }
//     return provider.availableTimes;
//   };

//   return (
//     <div className="space-y-6">
//       <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
//         <h2 className="text-2xl font-bold">Book an Appointment</h2>
//         <p className="text-blue-100 mt-1">Find and schedule with the best healthcare providers</p>
//       </div>

//       <div className="flex items-center justify-between max-w-2xl mx-auto">
//         {[1, 2, 3].map((stepNum) => (
//           <div key={stepNum} className="flex items-center">
//             <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
//               step >= stepNum ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
//             }`}>
//               {stepNum}
//             </div>
//             {stepNum < 3 && (
//               <div className={`w-16 h-1 mx-2 ${
//                 step > stepNum ? "bg-blue-600" : "bg-gray-200"
//               }`} />
//             )}
//           </div>
//         ))}
//       </div>

//       <Card>
//         <CardContent className="pt-6">
//           {step === 1 && (
//             <div className="space-y-6">
//               <div className="flex gap-4">
//                 <div className="flex-1 relative">
//                   <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//                   <Input
//                     placeholder="Search by doctor name or specialty..."
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     className="pl-10"
//                   />
//                 </div>
//                 <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
//                   <SelectTrigger className="w-48">
//                     <SelectValue placeholder="Filter by specialty" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">All Specialties</SelectItem>
//                     <SelectItem value="Cardiology">Cardiology</SelectItem>
//                     <SelectItem value="Dermatology">Dermatology</SelectItem>
//                     <SelectItem value="Neurology">Neurology</SelectItem>
//                     <SelectItem value="Orthopedics">Orthopedics</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               {loading ? (
//                 <div className="flex justify-center py-12">
//                   <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   {filteredProviders.length === 0 ? (
//                     <div className="text-center py-12 text-gray-500">
//                       <p>No providers found</p>
//                     </div>
//                   ) : (
//                     filteredProviders.map((provider) => (
//                       <div
//                         key={provider.id}
//                         className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
//                         onClick={() => handleProviderSelect(provider)}
//                       >
//                         <div className="flex items-center gap-4">
//                           <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
//                             {provider.name?.charAt(0) || 'D'}
//                           </div>
//                           <div>
//                             <h3 className="font-semibold text-lg">{provider.name}</h3>
//                             <div className="flex items-center gap-2 text-sm text-gray-600">
//                               <Stethoscope className="h-4 w-4" />
//                               <span>{provider.specialty}</span>
//                               <span className="text-gray-300">|</span>
//                               <MapPin className="h-4 w-4" />
//                               <span>{provider.location}</span>
//                             </div>
//                             <div className="flex items-center gap-1 mt-1">
//                               <span className="text-yellow-500">★</span>
//                               <span className="text-sm font-medium">{provider.rating || 4.5}</span>
//                               <span className="text-sm text-gray-500">({provider.experience || 5} years exp)</span>
//                             </div>
//                           </div>
//                         </div>
//                         <Button variant="outline">Select</Button>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               )}
//             </div>
//           )}

//           {step === 2 && selectedProvider && (
//             <div className="space-y-6">
//               <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
//                 <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
//                   {selectedProvider.name?.charAt(0) || 'D'}
//                 </div>
//                 <div>
//                   <h3 className="font-semibold text-lg">{selectedProvider.name}</h3>
//                   <p className="text-sm text-gray-600">{selectedProvider.specialty}</p>
//                   <p className="text-sm text-gray-500">{selectedProvider.location}</p>
//                 </div>
//               </div>

//               <div className="grid md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <Label>Select Date</Label>
//                   <Popover>
//                     <PopoverTrigger>
//   <div className="w-full cursor-pointer">
//     <div className={cn(
//       "w-full flex items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm font-normal ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
//       !date && "text-muted-foreground"
//     )}>
//       <CalendarIcon className="mr-2 h-4 w-4" />
//       {date ? format(date, "PPP") : "Pick a date"}
//     </div>
//   </div>
// </PopoverTrigger>
//                     <PopoverContent className="w-auto p-0">
//                       <Calendar
//                         mode="single"
//                         selected={date}
//                         onSelect={setDate}
//                         initialFocus
//                         disabled={(date) => date < new Date()}
//                       />
//                     </PopoverContent>
//                   </Popover>
//                 </div>

//                 <div className="space-y-2">
//                   <Label>Select Time</Label>
//                   <div className="grid grid-cols-2 gap-2">
//                     {getAvailableTimes(selectedProvider).map((time, index) => (
//                       <Button
//                         key={`${time}-${index}`}
//                         variant={selectedTime === time ? "default" : "outline"}
//                         className="justify-start"
//                         onClick={() => handleTimeSelect(time)}
//                       >
//                         <Clock className="mr-2 h-4 w-4" />
//                         {time}
//                       </Button>
//                     ))}
//                   </div>
//                 </div>
//               </div>

//               <div className="flex gap-4">
//                 <Button variant="outline" onClick={() => setStep(1)}>
//                   Back
//                 </Button>
//                 <Button
//                   className="flex-1 bg-blue-600 hover:bg-blue-700"
//                   disabled={!selectedTime}
//                   onClick={() => setStep(3)}
//                 >
//                   Continue
//                 </Button>
//               </div>
//             </div>
//           )}

//           {step === 3 && selectedProvider && selectedTime && (
//             <div className="space-y-6">
//               <div className="bg-green-50 border border-green-200 rounded-lg p-4">
//                 <h3 className="font-semibold text-green-800">Appointment Summary</h3>
//                 <div className="mt-2 space-y-1 text-sm">
//                   <p><span className="font-medium">Provider:</span> {selectedProvider.name}</p>
//                   <p><span className="font-medium">Specialty:</span> {selectedProvider.specialty}</p>
//                   <p><span className="font-medium">Date:</span> {format(date, "PPP")}</p>
//                   <p><span className="font-medium">Time:</span> {selectedTime}</p>
//                   <p><span className="font-medium">Location:</span> {selectedProvider.location}</p>
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="reason">Reason for Appointment</Label>
//                 <textarea
//                   id="reason"
//                   className="w-full min-h-[100px] p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   placeholder="Please describe your symptoms or reason for visiting..."
//                   value={appointmentReason}
//                   onChange={(e) => setAppointmentReason(e.target.value)}
//                 />
//               </div>

//               <div className="flex gap-4">
//                 <Button variant="outline" onClick={() => setStep(2)}>
//                   Back
//                 </Button>
//                 <Button
//                   className="flex-1 bg-green-600 hover:bg-green-700"
//                   onClick={handleConfirmBooking}
//                   disabled={bookingLoading}
//                 >
//                   {bookingLoading ? (
//                     <>
//                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                       Booking...
//                     </>
//                   ) : (
//                     'Confirm Appointment'
//                   )}
//                 </Button>
//               </div>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default BookAppointment;



import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  Search,
  Clock,
  MapPin,
  Stethoscope,
  Loader2,
  User,
  Star,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  getAvailableProviders,
  getProviderSlots,
  bookAppointment,
} from "../../services/patientService";

const BookAppointment = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [date, setDate] = useState(new Date());
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [appointmentReason, setAppointmentReason] = useState("");
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Fetch providers
  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        const response = await getAvailableProviders(selectedSpecialty);
        setProviders(response.data || []);
        setFilteredProviders(response.data || []);
      } catch (error) {
        console.error("Failed to fetch providers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProviders();
  }, [selectedSpecialty]);

  // Filter providers by search
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = providers.filter(
        (provider) =>
          provider.name?.toLowerCase().includes(query) ||
          provider.specialty?.toLowerCase().includes(query)
      );
      setFilteredProviders(filtered);
    } else {
      setFilteredProviders(providers);
    }
  }, [searchQuery, providers]);

  // ✅ Fetch slots when provider or date changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedProvider || !date) return;

      setSlotsLoading(true);
      try {
        const dateStr = format(date, "yyyy-MM-dd");
        const response = await getProviderSlots(selectedProvider.id, dateStr);
        setSlots(response.data || []);
      } catch (error) {
        console.error("Failed to fetch slots:", error);
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchSlots();
  }, [selectedProvider, date]);

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
    setSelectedSlot(null);
    setStep(2);
  };

  const handleSlotSelect = (slot) => {
    if (slot.status === "booked") return;
    setSelectedSlot(slot);
  };

  const handleConfirmBooking = async () => {
    if (!selectedProvider || !selectedSlot || !date) {
      alert("Please select a provider, date, and time slot");
      return;
    }

    setBookingLoading(true);
    try {
      const appointmentData = {
        providerId: selectedProvider.id,
        appointmentDate: format(date, "yyyy-MM-dd"),
        startTime: selectedSlot.time,
        endTime: selectedSlot.endTime,
        reason: appointmentReason || "General consultation",
        type: "VIRTUAL",
      };

      const response = await bookAppointment(appointmentData);

      if (response.success) {
        alert("✅ Appointment booked successfully!");
        navigate("/dashboard/patient/appointments");
      } else {
        alert(response.message || "Failed to book appointment");
      }
    } catch (error) {
      console.error("❌ Booking error:", error);
      alert(error.message || "Failed to book appointment. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const availableCount = slots.filter((s) => s.status === "available").length;
  const bookedCount = slots.filter((s) => s.status === "booked").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold">Book an Appointment</h2>
        <p className="text-blue-100 mt-1">
          Find and schedule with the best healthcare providers
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {[1, 2, 3].map((stepNum) => (
          <div key={stepNum} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                step >= stepNum
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {stepNum}
            </div>
            {stepNum < 3 && (
              <div
                className={`w-16 h-1 mx-2 transition-all duration-300 ${
                  step > stepNum ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* Step 1: Select Provider */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by doctor name or specialty..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="w-full md:w-48">
                  <Select
                    value={selectedSpecialty}
                    onValueChange={setSelectedSpecialty}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specialties</SelectItem>
                      <SelectItem value="Cardiology">Cardiology</SelectItem>
                      <SelectItem value="Dermatology">Dermatology</SelectItem>
                      <SelectItem value="Neurology">Neurology</SelectItem>
                      <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                      <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                      <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : filteredProviders.length === 0 ? (
                <div className="text-center py-12">
                  <User className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">No providers found</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {filteredProviders.map((provider) => (
                    <div
                      key={provider.id}
                      className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => handleProviderSelect(provider)}
                    >
                      <div className="flex items-start gap-4 w-full md:w-auto">
                        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl flex-shrink-0">
                          {provider.name?.charAt(0) || "D"}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {provider.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                            <Stethoscope className="h-4 w-4" />
                            <span>{provider.specialty}</span>
                            <span className="text-gray-300">|</span>
                            <MapPin className="h-4 w-4" />
                            <span>{provider.location || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-medium">
                                {provider.rating || 4.5}
                              </span>
                            </div>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500">
                              {provider.experience || 0} years exp
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="mt-3 md:mt-0 w-full md:w-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProviderSelect(provider);
                        }}
                      >
                        Select
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Date & Slot */}
          {step === 2 && selectedProvider && (
            <div className="space-y-6">
              {/* Selected Provider */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                  {selectedProvider.name?.charAt(0) || "D"}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedProvider.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedProvider.specialty}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedProvider.location || "N/A"}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Date Picker */}
                <div className="space-y-2">
                  <Label>Select Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="w-full cursor-pointer" role="button" tabIndex={0}>
                        <div
                          className={cn(
                            "w-full flex items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : "Pick a date"}
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(newDate) => {
                          setDate(newDate);
                          setSelectedSlot(null);
                        }}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  {date && (
                    <p className="text-xs text-gray-500">
                      Day: {new Date(date).toLocaleDateString("en-US", { weekday: "long" })}
                    </p>
                  )}

                  {/* Slot Counts */}
                  {slots.length > 0 && (
                    <div className="flex items-center gap-3 mt-3 text-xs">
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        {availableCount} Available
                      </span>
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-3 w-3" />
                        {bookedCount} Booked
                      </span>
                    </div>
                  )}
                </div>

                {/* Slots Grid */}
                <div className="space-y-2">
                  <Label>Select Time Slot</Label>
                  {slotsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed rounded-lg bg-gray-50">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500 font-medium">
                        No slots available
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Please select a different date
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                      {slots.map((slot, index) => {
                        const isBooked = slot.status === "booked";
                        const isSelected = selectedSlot?.time === slot.time;

                        return (
                          <button
                            key={`${slot.time}-${index}`}
                            type="button"
                            disabled={isBooked}
                            onClick={() => handleSlotSelect(slot)}
                            className={cn(
                              "flex flex-col items-start gap-1 p-2 rounded-md border text-sm transition-all text-left",
                              isBooked &&
                                "bg-red-50 border-red-200 text-red-400 cursor-not-allowed opacity-70",
                              !isBooked &&
                                !isSelected &&
                                "bg-white border-gray-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer",
                              isSelected &&
                                "bg-blue-600 border-blue-600 text-white shadow-md"
                            )}
                          >
                            <div className="flex items-center gap-1 w-full">
                              <Clock className="h-3 w-3" />
                              <span className="font-medium">{slot.time}</span>
                            </div>
                            <span
                              className={cn(
                                "text-[10px] font-semibold uppercase",
                                isBooked && "text-red-500",
                                !isBooked && !isSelected && "text-green-600",
                                isSelected && "text-blue-100"
                              )}
                            >
                              {isBooked ? "Booked" : isSelected ? "Selected" : "Available"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!selectedSlot}
                  onClick={() => setStep(3)}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && selectedProvider && selectedSlot && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-3">
                  Appointment Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-green-100">
                    <span className="text-gray-600">Provider</span>
                    <span className="font-medium">{selectedProvider.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-green-100">
                    <span className="text-gray-600">Specialty</span>
                    <span className="font-medium">{selectedProvider.specialty}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-green-100">
                    <span className="text-gray-600">Date</span>
                    <span className="font-medium">{format(date, "PPP")}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-green-100">
                    <span className="text-gray-600">Time</span>
                    <span className="font-medium">
                      {selectedSlot.time} - {selectedSlot.endTime}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Location</span>
                    <span className="font-medium">Virtual Consultation</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Appointment</Label>
                <textarea
                  id="reason"
                  className="w-full min-h-[100px] p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your symptoms or reason for visiting..."
                  value={appointmentReason}
                  onChange={(e) => setAppointmentReason(e.target.value)}
                />
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleConfirmBooking}
                  disabled={bookingLoading}
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    "Confirm Appointment"
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookAppointment;