import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import SkillBadge from '../common/SkillBadge';
import AddSkillModal from './AddSkillModal'; 
import LocationSelect from '../common/LocationSelect';

export default function JobFormModal({ isOpen, onClose, onSubmit, initialData, isEditing, isSubmitting }) {
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState('Philippines');
  const [city, setCity] = useState('');
  const [workModel, setWorkModel] = useState('On-site');
  const [type, setType] = useState('Full-time');
  
  const [currency, setCurrency] = useState('PHP');
  const [minPay, setMinPay] = useState(''); 
  const [maxPay, setMaxPay] = useState(''); 
  const [payRate, setPayRate] = useState('per month'); 

  const [closingDate, setClosingDate] = useState('');
  const [maxEmployees, setMaxEmployees] = useState(1);

  const [selectedSkills, setSelectedSkills] = useState([]); 
  const [showSkillModal, setShowSkillModal] = useState(false);

  const today = new Date();
  const minDateStr = today.toISOString().split('T')[0];
  
  const defaultDateObj = new Date(today);
  defaultDateObj.setDate(today.getDate() + 7);
  const defaultDateStr = defaultDateObj.toISOString().split('T')[0];

  const maxDateObj = new Date(today);
  maxDateObj.setMonth(today.getMonth() + 3);
  const maxDateStr = maxDateObj.toISOString().split('T')[0];

  useEffect(() => {
    if (isOpen) {
      fetchCompanyCity().then((companyLoc) => {
        if (isEditing && initialData) {
          setTitle(initialData.title || ''); 
          
          const parts = initialData.location ? initialData.location.split(', ') : [];
          if (parts.length > 0) {
            setCity(parts[0] || '');
          } else {
            setCity(initialData.location || companyLoc.city || '');
          }
          
          setWorkModel(initialData.work_model || 'On-site'); 
          setType(initialData.type || 'Full-time');
          
          if (initialData.pay) {
            let payText = initialData.pay;
            let loadedCurrency = 'PHP';
            
            if (payText.startsWith('PHP ')) {
              loadedCurrency = 'PHP';
              payText = payText.replace('PHP ', '');
            } else if (payText.startsWith('USD ') || payText.startsWith('$ ')) {
              loadedCurrency = 'USD';
              payText = payText.replace(/USD |\$ /, '');
            }
            
            const payParts = payText.split(' - ');
            setMinPay(payParts[0] ? payParts[0].replace(/\D/g, '') : '');
            setMaxPay(payParts[1] ? payParts[1].replace(/\D/g, '') : '');
            setCurrency(loadedCurrency);
          } else {
            setMinPay('');
            setMaxPay('');
            setCurrency('PHP');
          }
          
          setPayRate(initialData.pay_rate || 'per month');
          setDescription(initialData.description || ''); 
          setSelectedSkills(initialData.skills || []);
          
          setClosingDate(initialData.closing_date ? new Date(initialData.closing_date).toISOString().split('T')[0] : defaultDateStr);
          setMaxEmployees(initialData.max_employees || 1);
        } else {
          setTitle(''); 
          setWorkModel('On-site'); 
          setType('Full-time');
          setCurrency('PHP');
          setMinPay(''); 
          setMaxPay('');
          setPayRate('per month'); 
          setDescription(''); 
          setSelectedSkills([]);
          setCity(companyLoc.city || '');
          
          setClosingDate(defaultDateStr);
          setMaxEmployees(1);
        }
      });
    }
  }, [isOpen, initialData, isEditing, user, defaultDateStr]);

  async function fetchCompanyCity() {
    if (!user) return { city: '', country: '' };
    
    const { data } = await supabase
      .from('companies')
      .select('locations(city, country)')
      .eq('id', user.id)
      .maybeSingle();
      
    if (data && data.locations) {
      return {
        country: data.locations.country || '',
        city: data.locations.city || ''
      };
    }
    return { city: '', country: '' };
  }

  const handleAddSkill = (skillObj) => {
    if (skillObj && !selectedSkills.some(s => s.id === skillObj.id)) {
      setSelectedSkills([...selectedSkills, skillObj]);
    }
    setShowSkillModal(false);
  };

  const handleRemoveSkill = (idToRemove) => {
    setSelectedSkills(selectedSkills.filter(s => s.id !== idToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 🚨 NEW: Validate that maximum pay is greater than minimum pay
    if (minPay && maxPay) {
      if (parseInt(maxPay, 10) <= parseInt(minPay, 10)) {
        alert("The maximum pay must be higher than the minimum pay.");
        return; 
      }
    }

    const locationString = city ? (country ? `${city}, ${country}` : city) : '';
    
    let payString = '';
    if (minPay && maxPay) {
      payString = `${currency} ${minPay} - ${maxPay}`;
    } else if (minPay) {
      payString = `${currency} ${minPay}`;
    }

    onSubmit({ 
      title, 
      location: locationString, 
      work_model: workModel, 
      type, 
      pay: payString, 
      pay_rate: payRate, 
      description, 
      skills: selectedSkills,
      closing_date: closingDate,
      max_employees: maxEmployees
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <AddSkillModal 
        isOpen={showSkillModal} 
        onClose={() => setShowSkillModal(false)} 
        onAddSkill={handleAddSkill} 
        existingSkills={selectedSkills.map(s => s.name)} 
      />

      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2 className="m-0">{isEditing ? 'Edit Job Posting' : 'Post a New Job'}</h2>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="flex-col gap-24">
            <div>
              <label className="mb-8 block font-bold">Job Title *</label>
              <input type="text" className="search-input w-full" placeholder="Job Title" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            
            <div className="sub-card">
              <label className="mb-16 block font-bold">Job Details</label>
              
              <div className="flex-col gap-16 mb-16">
                <div>
                  <label className="text-sm mb-8 block">Job Location</label>
                  <LocationSelect country={country} setCountry={setCountry} city={city} setCity={setCity} />
                </div>
              </div>
              
              <div className="form-grid-2 mb-16">
                <div>
                  <label className="text-sm mb-8 block">Work Model</label>
                  <select className="search-input w-full" value={workModel} onChange={e => setWorkModel(e.target.value)}>
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm mb-8 block">Employment Type</label>
                  <select className="search-input w-full" value={type} onChange={e => setType(e.target.value)}>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>

              <div className="mb-16">
                <label className="text-sm mb-8 block">Pay / Salary Range</label>
                <div className="flex-row gap-8 align-center">
                  <select className="search-input" style={{ width: '90px', flexShrink: 0 }} value={currency} onChange={e => setCurrency(e.target.value)}>
                    <option value="PHP">₱ PHP</option>
                    <option value="USD">$ USD</option>
                  </select>
                  
                  <input 
                    type="text" 
                    className="search-input w-full" 
                    placeholder="Min" 
                    value={minPay} 
                    onChange={e => setMinPay(e.target.value.replace(/\D/g, ''))} 
                  />
                  
                  <span className="font-medium text-secondary">to</span>
                  
                  <input 
                    type="text" 
                    className="search-input w-full" 
                    placeholder="Max" 
                    value={maxPay} 
                    onChange={e => setMaxPay(e.target.value.replace(/\D/g, ''))} 
                  />
                  
                  <select className="search-input" style={{ width: '130px', flexShrink: 0 }} value={payRate} onChange={e => setPayRate(e.target.value)}>
                    <option value="per hour">per hour</option>
                    <option value="per day">per day</option>
                    <option value="per week">per week</option>
                    <option value="per month">per month</option>
                    <option value="per year">per year</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2" style={{ marginTop: '16px' }}>
                <div>
                  <label className="text-sm mb-8 block">Application Deadline *</label>
                  <input 
                    type="date" 
                    className="search-input w-full" 
                    value={closingDate}
                    onChange={e => setClosingDate(e.target.value)}
                    min={minDateStr}
                    max={maxDateStr}
                    required
                  />
                  <p className="text-secondary m-0 mt-4" style={{ fontSize: '0.75rem' }}>Max duration is 3 months.</p>
                </div>
                <div>
                  <label className="text-sm mb-8 block">Openings (Max Hires) *</label>
                  <input 
                    type="number" 
                    className="search-input w-full" 
                    value={maxEmployees}
                    onChange={e => setMaxEmployees(Number(e.target.value))}
                    min="1"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-8 block font-bold">Job Description *</label>
              <textarea className="search-input w-full" value={description} onChange={e => setDescription(e.target.value)} style={{ height: '160px', resize: 'vertical' }} placeholder="Describe the role, responsibilities, and qualifications..." required />
            </div>

            <div className="sub-card">
              <div className="flex-between align-center mb-16">
                <div>
                  <label className="block font-bold">Required Skills</label>
                  <p className="text-sm text-secondary m-0 mt-4">Select skills to help our matching algorithm find candidates.</p>
                </div>
                <button type="button" className="btn-outline btn-sm" onClick={() => setShowSkillModal(true)}>+ Add Skill</button>
              </div>
              
              <div className="flex-row-wrap gap-8">
                {selectedSkills.length > 0 ? (
                  selectedSkills.map((skill) => <SkillBadge key={skill.id} skill={skill} onRemove={() => handleRemoveSkill(skill.id)} />)
                ) : (
                  <span className="text-sm text-secondary italic">No skills added yet. Click "+ Add Skill" to select from the list.</span>
                )}
              </div>
            </div>
            
            <div className="divider m-0 mt-8 flex-row" style={{ justifyContent: 'flex-end', paddingTop: '24px' }}>
              <button type="submit" className="btn-black w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Post Job')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}