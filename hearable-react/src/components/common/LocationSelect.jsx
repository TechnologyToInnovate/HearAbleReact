import React, { useState, useEffect } from 'react';

export default function LocationSelect({ country, setCountry, city, setCity, disabledCountry = false }) {
  const [data, setData] = useState([]);
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch the global country/city data once on mount
  useEffect(() => {
    fetch('https://countriesnow.space/api/v0.1/countries')
      .then(res => res.json())
      .then(json => {
        if (!json.error) {
          setData(json.data);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch location data:", err);
        setIsLoading(false);
      });
  }, []);

  // 🚨 2. Watch for changes to the 'country' prop (Handles asynchronous database loads!)
  useEffect(() => {
    if (data.length > 0 && country) {
      const foundCountry = data.find(c => c.country === country);
      setCities(foundCountry ? foundCountry.cities.sort() : []);
    }
  }, [country, data]);

  const handleCountryChange = (e) => {
    const selectedCountry = e.target.value;
    setCountry(selectedCountry);
    setCity(''); // Reset city when the user changes the country manually
  };

  return (
    <div className="form-grid-2">
      <div>
        <select 
          className="search-input w-full" 
          value={country} 
          onChange={handleCountryChange}
          // 🚨 3. Lock the country if the disabledCountry prop is true
          disabled={isLoading || disabledCountry}
          required
        >
          <option value="" disabled>{isLoading ? 'Loading...' : 'Select Country'}</option>
          {data.map((c, i) => (
            <option key={i} value={c.country}>{c.country}</option>
          ))}
        </select>
      </div>
      
      <div>
        <select 
          className="search-input w-full" 
          value={city} 
          onChange={(e) => setCity(e.target.value)}
          disabled={!country || cities.length === 0}
          required
        >
          <option value="" disabled>{!country ? 'Select a country first' : 'Select City'}</option>
          {cities.map((c, i) => (
            <option key={i} value={c}>{c}</option>
          ))}
        </select>
      </div>
    </div>
  );
}