import { useState } from "react";
import { IoLocationOutline} from "react-icons/io5";
import { TiStar } from "react-icons/ti";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem, } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {exploreVenues} from "./exploreVenues"
import { Link } from "react-router";
const ExplorePage = () => {
const venue = exploreVenues;
const venueTypes = [
  "Hall",
  "Turf",
  "Swimming Pool",
  "Open Ground",
  "Auditorium",
  "Convention Center",
  "Resort",
  "Party Hall",
  "Conference Space",
  "Other",
];
const amenitiesList = [
  "Parking",
  "AC",
  "Dining Area",
  "Wifi",
  "Generator",
  "Sound System",
  "Stage",
  "Rooms",
  "Lift",
  "Wheelchair Access",
  "Decoration Space",
  "Catering Area",
];
const spaceAttributes = [
  "Indoor",
  "Outdoor (Garden/Lawn)",
  "Rooftop",
  "Poolside",
  "Both Indoor & Outdoor",
];

const seatingConfigs = [
  "Floating",
  "Theatre Seating",
  "Round Table",
  "Banquet Seating",
  "Standing",
];

const districtCities = {
  Thiruvananthapuram: [
    "Neyyattinkara",
    "Attingal",
  ],
  Kollam: [
    "Karunagappally",
    "Punalur",
  ],
  Pathanamthitta: [
    "Adoor",
    "Pandalam",
  ],
  Alappuzha: [
    "Cherthala",
    "Haripad",
  ],
  Ernakulam: [
    "Kochi",
    "Aluva",
  ],
};

type District = keyof typeof districtCities;

const [selectedDistrict, setSelectedDistrict] = useState<District | "">("");

const districts = Object.keys(districtCities);

const cities = selectedDistrict ? districtCities[selectedDistrict] : [];


  return (
    <section className="px-8 mb-20 mx-auto">
      <div className="grid grid-cols-[300px_1fr] gap-6 items-start">
        {/* Left Sidebar */}
         <aside className="sticky top-24">
          <div className=" max-h-[calc(100vh-7rem)] overflow-y-auto rounded-3xl border border-[var(--bg-grey)] bg-[var(--bg-tertiary)] p-6 " >
             {/* header */}
            <div className="flex items-center justify-between">
             <h2 className="text-2xl font-bold text-[var(--text-primary)]">Filters</h2>
               <Button variant="ghost" className="text-[var(--bg-green)] cursor-pointer" > Clear </Button>
             </div>
             <Separator className="my-5" />
             {/* price*/}
             <div>
               <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                 Price Range
               </h3>
               <Slider
                defaultValue={[25000]}
                max={50000}
                step={1000}
                className="cursor-pointer"
              />
              <div className="flex gap-3 mt-5">
                <div className="flex-1 rounded-2xl border border-[var(--bg-grey)] p-3">
                  <p className="text-xs text-[var(--text-secondary)]"> Min </p>
                  <p className="font-medium text-[var(--text-primary)]"> ₹0 </p>
                </div>
                <div className="flex-1 rounded-2xl border border-[var(--bg-grey)] p-3">
                  <p className="text-xs text-[var(--text-secondary)]"> Max </p>
                  <p className="font-medium text-[var(--text-primary)]"> ₹5,00,000 </p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Venue Type */}
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4"> Venue Type </h3>
              <div className="space-y-4">
                {venueTypes.map((type) => (
                <div 
                  key={type}
                  className="flex items-center gap-3">
                  <Checkbox id={type} />
                  <label htmlFor="hall">{type}</label>
                </div>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* District */}
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4"> District </h3>
              <Select  onValueChange={(value) => setSelectedDistrict(value as District) }>
                <SelectTrigger className="w-full rounded-2xl h-12 cursor-pointer">
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent>
                {districts.map((district) => (
                  <SelectItem key={district} value={district}>{district}</SelectItem>
                ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-6" />

            {/* City */}
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4"> City / Place </h3>
              <Select disabled={!selectedDistrict}>
                <SelectTrigger className="w-full rounded-2xl h-12">
                  <SelectValue placeholder={selectedDistrict ? "Select a City" : "select a district frst" }/>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                </SelectContent>
                </SelectTrigger>
              </Select>
            </div>

            <Separator className="my-6" />

            {/* Capacity */}
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4"> Capacity </h3>
              <RadioGroup className="space-y-4">
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="50" id="50" />
                  <label htmlFor="50"> 1–50 Guests </label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="100" id="100" />
                  <label htmlFor="100"> 50–100 Guests </label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="300" id="300" />
                  <label htmlFor="300"> 100–300 Guests </label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="500" id="500" />
                  <label htmlFor="500"> 300+ Guests </label>
                </div>
              </RadioGroup>
            </div>

            <Separator className="my-6" />

            {/* Space Type */}
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4"> Space Type </h3>
              <div className="space-y-4">
                {spaceAttributes.map((space) => (
                <div 
                key={space}
                className="flex items-center gap-3">
                  <Checkbox id={space} />
                  <label htmlFor={space}>{space}</label>
                </div>
                ))}
              </div>
            </div>
            <Separator className="my-6" />

            {/* seating type */}
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4"> Seat Type </h3>
              <div className="space-y-4">
                {seatingConfigs.map((seat) => (
                <div 
                key={seat}
                className="flex items-center gap-3">
                  <Checkbox id={seat} />
                  <label htmlFor={seat}>{seat}</label>
                </div>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Amenities */}
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4"> Amenities </h3>
              <div className="space-y-4">
                {amenitiesList.map((amenity) => (
                <div 
                  key={amenity}
                  className="flex items-center gap-3">
                  <Checkbox id={amenity} />
                  <label htmlFor={amenity}> {amenity} </label>
                </div>
                ))}
              </div>
            </div>
            </div>
        </aside>
        <main>
          {/* Header */}
          <div className="mb-8 mt-20">
           <div className=" sticky  top-16  z-20 bg-[var(--bg-primary)] pt-4 pb-5 " >
              <h1 className="text-4xl font-bold text-[var(--text-primary)]"> Find Your Perfect Venue </h1>
              <p className="mt-2 mb-5 text-[var(--text-secondary)]"> Discover halls, resorts, auditoriums, turfs and more for every occasion. </p>
              {/* Search */}
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  placeholder="Search venues, cities, or event types..."
                  className=" w-full rounded-2xl border border-[var(--bg-grey)] bg-[var(--bg-tertiary)] px-5 py-4 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] " />
                <Button className=" rounded-2xl h-14 px-8 bg-[var(--bg-green)] hover:opacity-90 " > Search </Button>
              </div>
            </div>
              {/* results + sort */}
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]"> 124 Venues Found </h2>
                <Select>
                  <SelectTrigger className="w-[220px] rounded-2xl h-12">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={6}
                  >
                    <SelectItem value="popular"> Most Popular </SelectItem>
                    <SelectItem value="price-low"> Price: Low to High </SelectItem>
                    <SelectItem value="price-high"> Price: High to Low </SelectItem>
                    <SelectItem value="rating"> Highest Rated </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Cards */}
              <div className="grid grid-cols-4 gap-6">
                {venue.map((venue) => (
                <div className="overflow-hidden rounded-3xl border border-[var(--bg-grey)] bg-[var(--bg-tertiary)]">
                {/* Image */}
                  <div
                      key={venue.id}
                      className="bg-[var(--bg-tertiary)] rounded-2xl overflow-hidden border border-[var(--bg-grey)] hover:shadow-lg transition duration-300"
                    >
                      <img src={venue.image} alt={venue.name} className="w-full h-56 object-cover" />
                      <div className="p-5">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]"> {venue.name} </h3>
                        <div className="flex justify-between">
                          <p className="text-sm text-[var(--text-secondary)] mt-2 flex items-center gap-1">
                            <IoLocationOutline/> {venue.place} , {venue.district}
                          </p>
                            <p className="flex items-center">
                                <TiStar color="#a8dc55"/> {venue.rating}
                            </p>
                        </div> 
                        <p className="text-sm text-[var(--text-secondary)] mt-2">Upto {venue.guests} </p>
                        <Link
                          to={`/venue/${venue.id}`}
                          className="mt-5 inline-block w-full text-center bg-[var(--bg-green)] text-white py-3 rounded-xl font-medium hover:opacity-90 transition"
                        >
                          View Details
                        </Link>
                      </div>
                  </div>
              </div>
                ))}
              </div>
          </div>
        </main>
      </div>
    </section>
  );
};

export default ExplorePage;