import { useState, useRef, useCallback } from 'react';
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
import type { VenueFilters } from '@/types/venue.types';
import { PRICE_STEPS, KERALA_DISTRICTS } from '@/constants';

const ExplorePage = () => {
  const [filters, setFilters] = useState<VenueFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRangeIndex, setPriceRangeIndex] = useState<[number, number]>([
    0,
    PRICE_STEPS.length - 1,
  ]);

  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const debouncedPriceRangeIndex = useDebounce(priceRangeIndex, 400);

  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
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

  return (
    <section className="px-8 mb-20 mx-auto">
      <div className="grid grid-cols-[300px_1fr] gap-6 items-start">
        {/* Left Sidebar */}
        <aside className="sticky pt-24">
          <div className="max-h-[calc(100vh-7rem)] overflow-y-auto rounded-3xl border border-[var(--bg-grey)] bg-[var(--bg-tertiary)] p-6">
            {/* header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">Filters</h2>
              <Button
                onClick={handleClearFilters}
                variant="ghost"
                className="text-[var(--bg-green)] cursor-pointer"
              >
                Clear
              </Button>
            </div>
            <Separator className="my-5" />

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
          <div className="mb-8 mt-20">
            <div className="sticky top-16 z-20 bg-[var(--bg-primary)] pt-4 pb-5">
              <h1 className="text-4xl font-bold text-[var(--text-primary)]">
                Find Your Perfect Venue
              </h1>
              <p className="mt-2 mb-5 text-[var(--text-secondary)]">
                Discover halls, resorts, auditoriums, turfs and more for every occasion.
              </p>

              {/* Search */}
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  placeholder="Search venues, cities, or event types..."
                  className="w-full rounded-2xl border border-[var(--bg-grey)] bg-[var(--bg-tertiary)] px-5 py-4 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
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
            {isError ? (
              <div className="text-center py-10 text-red-500">Failed to load venues.</div>
            ) : venues.length === 0 && !isLoading ? (
              <div className="text-center py-10 text-[var(--text-secondary)]">
                No venues found matching your criteria.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-6">
                {venues.map((venue, index) => {
                  const isLastItem = index === venues.length - 1;
                  return (
                    <div
                      key={venue._id}
                      ref={isLastItem ? lastVenueElementRef : null}
                      className="overflow-hidden rounded-3xl border border-[var(--bg-grey)] bg-[var(--bg-tertiary)] hover:shadow-lg transition duration-300 flex flex-col"
                    >
                      <img
                        src={venue.coverImage}
                        alt={venue.name}
                        className="w-full h-56 object-cover"
                      />
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="mb-auto">
                          <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs rounded-md mb-2">
                            {venue.venueType}
                          </span>
                          <h3
                            className="text-lg font-semibold text-[var(--text-primary)] line-clamp-1"
                            title={venue.name}
                          >
                            {venue.name}
                          </h3>
                          <div className="flex justify-between items-center mt-2">
                            <p
                              className="text-sm text-[var(--text-secondary)] flex items-center gap-1 line-clamp-1"
                              title={`${venue.city}, ${venue.district}`}
                            >
                              <IoLocationOutline className="shrink-0" /> {venue.city},{' '}
                              {venue.district}
                            </p>
                          </div>
                          <p className="text-sm text-[var(--text-secondary)] mt-2">
                            Upto {venue.maxCapacity} Guests
                          </p>
                        </div>
                        <Link
                          to={`/venue/${venue._id}`}
                          className="mt-5 inline-block w-full text-center bg-[var(--bg-green)] text-white py-3 rounded-xl font-medium hover:opacity-90 transition"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Loading indicators */}
            {isLoading && <div className="text-center py-5">Loading initial venues...</div>}
            {isFetchingNextPage && <div className="text-center py-5">Loading more...</div>}
          </div>
        </main>
      </div>
    </section>
  );
};

export default ExplorePage;
