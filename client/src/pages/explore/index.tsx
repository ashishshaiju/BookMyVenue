import { useState, useRef, useCallback, useEffect } from 'react';
import { IoLocationOutline } from 'react-icons/io5';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router';
import { useExploreVenues } from '@/hooks/useExploreVenues';
import { useDebounce } from '@/hooks/useDebounce';
import type { PublicVenue, VenueFilters } from '@/types/venue.types';
import { PRICE_STEPS, KERALA_DISTRICTS } from '@/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Snowflake, X, Filter, Loader2 } from 'lucide-react';

const ExplorePage = () => {
  const [filters, setFilters] = useState<VenueFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [priceRangeIndex, setPriceRangeIndex] = useState<[number, number]>([
    0,
    PRICE_STEPS.length - 1,
  ]);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const debouncedPriceRangeIndex = useDebounce(priceRangeIndex, 400);

  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage, isFetching } =
    useExploreVenues({
      ...filters,
      searchTerm: debouncedSearchTerm || undefined,
      minPrice: PRICE_STEPS[debouncedPriceRangeIndex[0]],
      maxPrice: PRICE_STEPS[debouncedPriceRangeIndex[1]],
    });

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastVenueElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  const venueTypes = [
    'Hall',
    'Turf',
    'Swimming Pool',
    'Open Ground',
    'Auditorium',
    'Convention Center',
    'Resort',
    'Party Hall',
    'Conference Space',
    'Other',
  ];

  const amenitiesList = [
    'Parking',
    'AC',
    'Dining Area',
    'Wifi',
    'Generator',
    'Sound System',
    'Stage',
    'Rooms',
    'Lift',
    'Wheelchair Access',
    'Decoration Space',
    'Catering Area',
  ];

  const spaceAttributes = [
    'Indoor',
    'Outdoor (Garden/Lawn)',
    'Rooftop',
    'Poolside',
    'Both Indoor & Outdoor',
  ];

  const seatingConfigs = [
    'Floating',
    'Theatre Seating',
    'Round Table',
    'Banquet Seating',
    'Standing',
  ];

  const toggleArrayFilter = (key: keyof VenueFilters, value: string) => {
    setFilters((prev) => {
      const currentArray = (prev[key] as string[]) || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value];

      return {
        ...prev,
        [key]: newArray.length > 0 ? newArray : undefined,
      };
    });
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setPriceRangeIndex([0, PRICE_STEPS.length - 1]);
  };

  const venues = data?.pages.flatMap((page) => page.venues) || [];
  const totalVenues = data?.pages[0]?.pagination?.total || 0;

  const getStartingPrice = (venue: PublicVenue) => {
    if (venue.samePrice !== undefined) return venue.samePrice;
    if (venue.pricingRules?.length) {
      return Math.min(...venue.pricingRules.map(r => r.price));
    }
    if (venue.fixedPackages?.length) {
      return Math.min(...venue.fixedPackages.map(p => p.price));
    }
    return null;
  };

  return (
    <section className="px-8 pt-24 mb-20 mx-auto">
      <div className="flex flex-col lg:grid lg:grid-cols-[300px_1fr] gap-6 items-start">
        {/* Mobile Sidebar Overlay */}
        <div 
          className={`fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden ${isMobileFiltersOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsMobileFiltersOpen(false)}
        />
        
        {/* Left Sidebar */}
        <aside className={`
          fixed inset-y-0 top-16 left-0 z-50 w-[300px] bg-[var(--bg-primary)] h-full overflow-y-auto transition-transform duration-300
          lg:sticky lg:top-24 lg:w-auto lg:h-auto lg:bg-transparent lg:translate-x-0 lg:pt-0 lg:overflow-visible lg:self-start
          ${isMobileFiltersOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className={`
            p-6 lg:p-6 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:rounded-3xl lg:border lg:border-[var(--bg-grey)] lg:bg-[var(--bg-tertiary)]
            ${isFetching && !isLoading ? 'opacity-50 pointer-events-none' : ''}
          `}>
            {/* header */}
            <div className="flex items-center justify-between mb-4 lg:mb-0">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">Filters</h2>
              <div className="flex items-center gap-1">
                <Button
                  onClick={handleClearFilters}
                  variant="ghost"
                  className="text-[var(--bg-green)] cursor-pointer px-2"
                >
                  Clear
                </Button>
                <Button 
                  variant="ghost" 
                  className="lg:hidden text-[var(--text-secondary)] px-2" 
                  onClick={() => setIsMobileFiltersOpen(false)}
                >
                  <X size={20} />
                </Button>
              </div>
            </div>
            <Separator className="my-5 hidden lg:block" />

            {/* price */}
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">Price Range</h3>
              <Slider
                value={priceRangeIndex}
                min={0}
                max={PRICE_STEPS.length - 1}
                step={1}
                className="cursor-pointer"
                onValueChange={(val) => setPriceRangeIndex([val[0], val[1]])}
              />
              <div className="flex gap-3 mt-5">
                <div className="flex-1 rounded-2xl border border-[var(--bg-grey)] p-3">
                  <p className="text-xs text-[var(--text-secondary)]">Min</p>
                  <p className="font-medium text-[var(--text-primary)]">
                    ₹{PRICE_STEPS[priceRangeIndex[0]]}
                  </p>
                </div>
                <div className="flex-1 rounded-2xl border border-[var(--bg-grey)] p-3">
                  <p className="text-xs text-[var(--text-secondary)]">Max</p>
                  <p className="font-medium text-[var(--text-primary)]">
                    ₹{PRICE_STEPS[priceRangeIndex[1]]}
                  </p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Venue Type */}
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">Venue Type</h3>
              <div className="space-y-4">
                {venueTypes.map((type) => (
                  <div key={type} className="flex items-center gap-3">
                    <Checkbox
                      id={`type-${type}`}
                      checked={filters.venueType?.includes(type)}
                      onCheckedChange={() => toggleArrayFilter('venueType', type)}
                    />
                    <label htmlFor={`type-${type}`}>{type}</label>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* District */}
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">District</h3>
              <Select
                value={filters.district || 'all'}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, district: value === 'all' ? undefined : value }))
                }
              >
                <SelectTrigger className="w-full rounded-2xl h-12 cursor-pointer">
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  {KERALA_DISTRICTS.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-6" />

            {/* Capacity */}
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">Capacity</h3>
              <RadioGroup
                className="space-y-4"
                value={filters.capacity ? filters.capacity.toString() : 'any'}
                onValueChange={(val) =>
                  setFilters((prev) => ({
                    ...prev,
                    capacity: val === 'any' ? undefined : Number(val),
                  }))
                }
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="any" id="cap-any" />
                  <label htmlFor="cap-any">Any</label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="50" id="cap-50" />
                  <label htmlFor="cap-50">1–50 Guests</label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="100" id="cap-100" />
                  <label htmlFor="cap-100">50–100 Guests</label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="300" id="cap-300" />
                  <label htmlFor="cap-300">100–300 Guests</label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="500" id="cap-500" />
                  <label htmlFor="cap-500">300+ Guests</label>
                </div>
              </RadioGroup>
            </div>

            <Separator className="my-6" />

            {/* Space Type */}
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">Space Type</h3>
              <div className="space-y-4">
                {spaceAttributes.map((space) => (
                  <div key={space} className="flex items-center gap-3">
                    <Checkbox
                      id={`space-${space}`}
                      checked={filters.spaceAttributes?.includes(space)}
                      onCheckedChange={() => toggleArrayFilter('spaceAttributes', space)}
                    />
                    <label htmlFor={`space-${space}`}>{space}</label>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* seating type */}
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">Seat Type</h3>
              <div className="space-y-4">
                {seatingConfigs.map((seat) => (
                  <div key={seat} className="flex items-center gap-3">
                    <Checkbox
                      id={`seat-${seat}`}
                      checked={filters.seatingConfigurations?.includes(seat)}
                      onCheckedChange={() => toggleArrayFilter('seatingConfigurations', seat)}
                    />
                    <label htmlFor={`seat-${seat}`}>{seat}</label>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Amenities */}
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">Amenities</h3>
              <div className="space-y-4">
                {amenitiesList.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-3">
                    <Checkbox
                      id={`amenity-${amenity}`}
                      checked={filters.amenities?.includes(amenity)}
                      onCheckedChange={() => toggleArrayFilter('amenities', amenity)}
                    />
                    <label htmlFor={`amenity-${amenity}`}>{amenity}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main>
          {/* Header */}
          <div className="mb-8 mt-0">
            <div className={`sticky top-18 z-20 bg-[var(--bg-primary)] transition-all duration-300 ${isScrolled ? 'pt-2 pb-3' : 'pt-4 pb-5'}`}>
              <h1 className={`font-bold text-[var(--text-primary)] transition-all duration-300 ${isScrolled ? 'text-2xl' : 'text-4xl'}`}>
                Find Your Perfect Venue
              </h1>
              <div className={`transition-all duration-300 overflow-hidden ${isScrolled ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'}`}>
                <p className="mt-2 mb-5 text-[var(--text-secondary)]">
                  Discover halls, resorts, auditoriums, turfs and more for every occasion.
                </p>
              </div>

              {/* Search */}
              <div className={`flex items-center gap-3 transition-all duration-300 ${isScrolled ? 'mt-3' : ''}`}>
                <Button 
                  variant="outline" 
                  className={`lg:hidden rounded-2xl border border-[var(--bg-grey)] bg-[var(--bg-tertiary)] px-5 flex items-center justify-center gap-2 shrink-0 text-xs lg:text-sm text-[var(--text-primary)] transition-all duration-300 h-auto ${isScrolled ? 'py-3' : 'py-4'}`}
                  onClick={() => setIsMobileFiltersOpen(true)}
                >
                  <Filter size={isScrolled ? 18 : 20} />
                  Filters
                </Button>
                <input
                  type="text"
                  placeholder="Search venues, cities, or event types..."
                  className={`w-full rounded-2xl border border-[var(--bg-grey)] bg-[var(--bg-tertiary)] px-5 outline-none text-xs lg:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] transition-all duration-300 ${isScrolled ? 'py-3' : 'py-4'}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* results + sort */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {totalVenues} Venues Found
              </h2>
              <Select
                value={filters.sortBy || ''}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, sortBy: value as VenueFilters['sortBy'] }))
                }
              >
                <SelectTrigger className="w-[220px] rounded-2xl h-12">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={6}>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cards */}
            <div className="relative min-h-[300px]">
              {isFetching && !isLoading && !isFetchingNextPage && (
                <div className="absolute inset-0 z-10 bg-[var(--bg-primary)]/40 backdrop-blur-[2px] flex items-start justify-center pt-32 rounded-3xl">
                  <Loader2 className="w-12 h-12 animate-spin text-[var(--bg-green)]" />
                </div>
              )}
              {isError ? (
                <div className="flex flex-col items-center justify-center py-20 text-red-500 bg-red-50 dark:bg-red-950/20 rounded-3xl border border-red-100 dark:border-red-900">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p className="text-lg font-medium">Failed to load venues.</p>
                <p className="text-sm opacity-80">Please try adjusting your filters or try again later.</p>
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-1 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex flex-col sm:flex-row h-auto sm:min-h-[16rem] rounded-3xl border border-[var(--bg-grey)] bg-[var(--bg-tertiary)] overflow-hidden">
                    <Skeleton className="w-full sm:w-[40%] h-52 sm:h-auto shrink-0" />
                    <div className="flex-1 p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <Skeleton className="h-6 w-1/2" />
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-3/4 mb-4" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-16 border rounded-md" />
                          <Skeleton className="h-6 w-16 border rounded-md" />
                        </div>
                      </div>
                      <div className="flex justify-between items-end mt-4">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-28 rounded-xl" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : venues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)] bg-[var(--bg-tertiary)] rounded-3xl border border-[var(--bg-grey)]">
                <p className="text-lg font-medium">No venues found matching your criteria.</p>
                <Button variant="link" onClick={handleClearFilters} className="mt-2 text-[var(--bg-green)]">
                  Clear all filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {venues.map((venue, index) => {
                  const isLastItem = index === venues.length - 1;
                  const price = getStartingPrice(venue);
                  
                  return (
                    <div
                      key={venue._id}
                      ref={isLastItem ? lastVenueElementRef : null}
                      className="group overflow-hidden rounded-3xl border border-[var(--bg-grey)] bg-[var(--bg-tertiary)] hover:shadow-lg transition duration-300 flex flex-col sm:flex-row sm:min-h-[16rem]"
                    >
                      {/* Left Image */}
                      <div className="w-full sm:w-[40%] h-52 sm:h-64 shrink-0 overflow-hidden flex">
                        <img
                          src={venue.coverImage}
                          alt={venue.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      </div>
                      
                      {/* Right Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between overflow-hidden">
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h3
                              className="text-xl font-bold text-[var(--text-primary)] line-clamp-1 uppercase"
                              title={venue.name}
                            >
                              {venue.name}
                            </h3>
                            <span className="shrink-0 inline-block px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] font-bold tracking-wider rounded-full border border-orange-200 dark:border-orange-800">
                              {venue.venueType}
                            </span>
                          </div>
                          
                          <p
                            className="text-sm text-[var(--text-secondary)] flex items-center gap-1 line-clamp-1 mb-4"
                            title={`${venue.city}, ${venue.district}`}
                          >
                            <IoLocationOutline className="shrink-0 text-gray-400" size={16} /> {venue.city}, {venue.district}
                          </p>
                          
                          {/* Amenities Tags */}
                          {venue.amenities && venue.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-1">
                              {venue.amenities.slice(0, 3).map((amenity, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-[var(--bg-grey)] rounded-md text-[var(--text-secondary)]">
                                  {amenity === 'AC' && <Snowflake size={12} />}
                                  {amenity}
                                </span>
                              ))}
                              {venue.amenities.length > 3 && (
                                <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium border border-[var(--bg-grey)] rounded-md text-[var(--text-secondary)]">
                                  + {venue.amenities.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap justify-between items-end gap-4 mt-2 pt-2 border-t border-[var(--bg-grey)]/50">
                          <div className="flex flex-col">
                            {price !== null ? (
                              <>
                                <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-0.5">Starts From</span>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-xl font-bold text-[var(--text-primary)]">₹ {price.toLocaleString()}</span>
                                  {venue.slotDuration ? (
                                    <span className="text-xs text-[var(--text-secondary)]">/ {venue.slotDuration} mins</span>
                                  ) : (
                                    <span className="text-xs text-[var(--text-secondary)]">/ slot</span>
                                  )}
                                </div>
                                <span className="text-xs text-[var(--bg-green)] font-medium mt-1">
                                  {venue.bookingType === 'fixedBooking' ? 'Fixed Packages Available' : 'Flexible Booking'}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm text-[var(--text-secondary)]">Price on request</span>
                            )}
                          </div>
                          
                          <Link
                            to={`/venue/${venue._id}`}
                            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold transition shadow-md hover:shadow-lg"
                          >
                            Book Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
            
            {/* Infinite Scroll Loader */}
            {isFetchingNextPage && (
              <div className="mt-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </main>
      </div>
    </section>
  );
};

export default ExplorePage;
