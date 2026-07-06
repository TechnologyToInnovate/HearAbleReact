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
  
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  
  const [workModel, setWorkModel] = useState('On-site');
  const [type, setType] = useState('Full-time');
  const [pay, setPay] = useState(''); 
  const [payRate, setPayRate] = useState('per year'); 

  const [selectedSkills, setSelectedSkills] = useState([]); 
  const [showSkillModal, setShowSkillModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 🚨 Fetch the company's default location before setting any form state
      fetchCompanyCity().then((companyLoc) => {
        if (isEditing && initialData) {
          setTitle(initialData.title || ''); 
          
          const parts = initialData.location ? initialData.location.split(', ') : [];
          if (parts.length === 2) {
            setCity(parts[0] || '');
            // Force the country to remain the company's country
            setCountry(companyLoc.country || parts[1] || '');
          } else {
            setCity(initialData.location || companyLoc.city || '');
            setCountry(companyLoc.country || '');
          }
          
          setWorkModel(initialData.work_model || 'On-site'); setType(initialData.type || 'Full-time');
          setPay(initialData.pay || ''); setPayRate(initialData.pay_rate || 'per year');
          setDescription(initialData.description || ''); setSelectedSkills(initialData.skills || []);
        } else {
          setTitle(''); setWorkModel('On-site'); setType('Full-time');
          setPay(''); setPayRate('per year'); setDescription(''); setSelectedSkills([]);
          
          // Apply the company defaults for new jobs
          setCountry(companyLoc.country || ''); 
          setCity(companyLoc.city || '');
        }
      });
    }
  }, [isOpen, initialData, isEditing, user]);

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
    const locationString = city && country ? `${city}, ${country}` : city || country || '';
    onSubmit({ title, location: locationString, work_model: workModel, type, pay, pay_rate: payRate, description, skills: selectedSkills });
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
              <input type="text" className="search-input w-full" placeholder="e.g. Senior Software Engineer" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            
            <div className="sub-card">
              <label className="mb-16 block font-bold">Job Details</label>
              
              <div className="flex-col gap-16 mb-16">
                <div>
                  <label className="text-sm mb-8 block">Job Location</label>
                  {/* 🚨 PLUG IN THE COMPONENT HERE */}
                  <LocationSelect 
                    country={country} 
                    setCountry={setCountry} 
                    city={city} 
                    setCity={setCity} 
                    disabledCountry={true} /* 🚨 Locks the country dropdown */
                  />
                </div>
              </div>
              
              <div className="form-grid-2">
                <div>
                  <label className="text-sm mb-8 block">Pay / Salary</label>
                  <div className="flex-row gap-8">
                    <input type="text" className="search-input w-full" placeholder="e.g. $80,000" value={pay} onChange={e => setPay(e.target.value)} />
                    <select className="search-input" style={{ width: '120px', flexShrink: 0 }} value={payRate} onChange={e => setPayRate(e.target.value)}>
                      <option value="per hour">per hour</option><option value="per day">per day</option>
                      <option value="per week">per week</option><option value="per month">per month</option>
                      <option value="per year">per year</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm mb-8 block">Work Model</label>
                  <select className="search-input w-full" value={workModel} onChange={e => setWorkModel(e.target.value)}>
                    <option value="On-site">On-site</option><option value="Hybrid">Hybrid</option><option value="Remote">Remote</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm mb-8 block">Employment Type</label>
                  <select className="search-input w-full" value={type} onChange={e => setType(e.target.value)}>
                    <option value="Full-time">Full-time</option><option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option><option value="Internship">Internship</option>
                  </select>
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