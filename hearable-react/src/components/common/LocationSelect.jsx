import React, { useState, useMemo, useRef, useEffect } from 'react';

export default function LocationSelect({ country, setCountry, city, setCity }) {
  const [isOpen, setIsOpen] = useState(false);
  const [phCities, setPhCities] = useState([]);
  const dropdownRef = useRef(null);

  // 1. Automatically set the country for the database so you don't have to change your other files
  useEffect(() => {
    if (country !== 'Philippines') {
      setCountry('Philippines');
    }
  }, [country, setCountry]);

  // 2. Fetch the strict, official list of Philippine Cities & Municipalities on mount
  useEffect(() => {
    async function fetchPHLocations() {
      try {
        const res = await fetch('https://psgc.gitlab.io/api/cities-municipalities/');
        const data = await res.json();
        
        // Extract just the names and sort them alphabetically A-Z
        const sortedCities = data.map(place => place.name).sort();
        setPhCities(sortedCities);
      } catch (error) {
        console.error("Failed to fetch Philippine locations:", error);
      }
    }
    fetchPHLocations();
  }, []);

  // 3. Filter the city list based on what the user types in the text box
  const filteredCities = useMemo(() => {
    if (!city) return phCities;
    return phCities.filter(c => c.toLowerCase().includes(city.toLowerCase()));
  }, [city, phCities]);

  // 4. Close the dropdown automatically if the user clicks outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={dropdownRef}>
      
      {/* The Text Box */}
      <input 
        type="text" 
        className="search-input w-full" 
        value={city} 
        onChange={(e) => {
          setCity(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={phCities.length === 0 ? "Loading Philippine cities..." : "Type or select a city/municipality..."}
        disabled={phCities.length === 0}
        required
        autoComplete="off"
      />
      
      {/* The Small, Scrollable Choice Box */}
      {isOpen && filteredCities.length > 0 && (
        <ul style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          maxHeight: '180px', /* STRICT LIMIT: Keeps the box small */
          overflowY: 'auto',  /* Enables normal vertical scrolling */
          backgroundColor: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-color, #e5e7eb)',
          borderRadius: '8px',
          marginTop: '4px',
          padding: 0,
          listStyle: 'none',
          zIndex: 50,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          {filteredCities.map((cityName, i) => (
            <li 
              key={`${cityName}-${i}`} 
              onClick={() => {
                setCity(cityName);
                setIsOpen(false); // Close dropdown when an item is clicked
              }}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                borderBottom: '1px solid var(--border-color, #f3f4f6)'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--hover-bg, #f9fafb)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              {cityName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}