import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Utility for consistent date formatting
import { formatStandardDate } from '../utils/dateUtils';
import StatusBadge from '../components/common/StatusBadge';

export default function UserResumes() {
  const { user: currentUser, role } = useAuth();
  const navigate = useNavigate();
  
  // Core state for managing the user's resumes
  const [resumes, setResumes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for the PDF upload modal and form data
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for the PDF preview modal
  const [previewUrl, setPreviewUrl] = useState(null);

  // Guard: Only standard users should be here
  useEffect(() => {
    if (!['user', 'pending_user', 'rejected_user'].includes(role)) {
      navigate('/');
      return;
    }
    if (currentUser) fetchResumes();
  }, [role, navigate, currentUser]);

  // Retrieves the list of resume records from the database for the active user
  async function fetchResumes() {
    setIsLoading(true);
    const { data } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });
      
    if (data) setResumes(data);
    setIsLoading(false);
  }

  // Handles the two-step process of uploading a PDF to Supabase Storage and saving its URL to the database
  async function handleUploadResume(e) {
    e.preventDefault();
    if (!newTitle || !selectedFile) return alert("Please provide a title and select a PDF file.");
    
    // Enforce file type validation on the client side
    if (selectedFile.type !== 'application/pdf') {
      return alert("Only PDF files are allowed.");
    }

    setIsSubmitting(true);

    try {
      // Create a unique file name using the user's ID and a timestamp to prevent overwriting
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `${currentUser.id}/${fileName}`;

      // Step 1: Upload the actual file to the Supabase 'resumes' storage bucket
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Step 2: Retrieve the public URL for the newly uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      // Step 3: Insert a new record into the database containing the title and the file URL
      const { error: dbError } = await supabase.from('resumes').insert([{ 
        user_id: currentUser.id, 
        title: newTitle, 
        file_url: publicUrl 
      }]);

      if (dbError) throw dbError;

      // Clean up form state and close modal on success
      setNewTitle('');
      setSelectedFile(null);
      setIsUploadModalOpen(false);
      
      // Refresh the UI to show the new resume
      fetchResumes();

    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload resume. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handles the removal of a resume record and attempts to clean up the associated file in storage
  async function handleDelete(id, fileUrl) {
    if (!window.confirm("Are you sure you want to delete this resume?")) return;
    
    // Step 1: Delete the record from the database
    const { error: dbError } = await supabase.from('resumes').delete().eq('id', id);
    
    if (!dbError) {
      // Optimistically update the UI
      setResumes(resumes.filter(r => r.id !== id));
      
      // Step 2: Extract the relative file path from the URL and remove the file from storage
      if (fileUrl) {
        const urlParts = fileUrl.split('/resumes/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage.from('resumes').remove([filePath]);
        }
      }
    } else {
      alert("Failed to delete resume.");
    }
  }

  return (
    <div className="page-container-wide">
      <div className="flex-between align-center mb-24">
        <h1 className="m-0">My Resumes</h1>
      </div>

      {/* --- ACTION CARDS --- */}
      <div className="flex-row-wrap gap-16 mb-32">
        <button 
          className="card flex-row align-center gap-12" 
          style={{ 
            flex: 1, minWidth: '280px', 
            cursor: role === 'user' ? 'pointer' : 'not-allowed', 
            border: '1px solid var(--border-color)', 
            background: 'var(--card-bg)', color: 'var(--text-color)', padding: '24px', 
            transition: 'all 0.2s ease', textAlign: 'left',
            opacity: role === 'user' ? 1 : 0.6
          }}
          onClick={() => {
            if (role === 'user') setIsUploadModalOpen(true);
          }}
          onMouseEnter={(e) => {
            if (role === 'user') {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'var(--primary-color)';
            }
          }}
          onMouseLeave={(e) => {
            if (role === 'user') {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }
          }}
          disabled={role !== 'user'}
          title={role !== 'user' ? "Your account must be approved to upload resumes." : ""}
        >
          <div>
            <h3 className="m-0 mb-4" style={{ fontSize: '1.2rem' }}>Upload PDF Resume</h3>
            <p className="text-secondary m-0 text-sm">Upload your existing document</p>
          </div>
        </button>

        <button 
          className="card flex-row align-center gap-12" 
          style={{ 
            flex: 1, minWidth: '280px', cursor: 'not-allowed', border: '1px solid var(--border-color)', 
            padding: '24px', position: 'relative', opacity: 0.6, background: 'var(--bg-color)',
            color: 'var(--text-color)', textAlign: 'left'
          }}
          disabled
        >
          <div className="badge badge-neutral" style={{ position: 'absolute', top: '12px', right: '12px', fontWeight: 'bold', fontSize: '0.75rem' }}>
            Coming Soon
          </div>
          <div>
            <h3 className="m-0 mb-4" style={{ fontSize: '1.2rem' }}>Create HearAble Resume</h3>
            <p className="text-secondary m-0 text-sm">Use our smart ATS-friendly builder</p>
          </div>
        </button>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '32px 0' }} />

      {/* --- RESUME LIST --- */}
      <h3 className="mb-16">Saved Resumes</h3>
      {isLoading ? <p className="text-secondary">Loading...</p> : resumes.length > 0 ? (
        <div className="flex-col gap-16">
          {resumes.map(resume => (
            <div key={resume.id} className="card p-20 flex-between align-center">
              <div>
                <h3 className="m-0 mb-4" style={{ fontSize: '1.15rem' }}>{resume.title}</h3>
                <p className="text-secondary text-sm m-0 mb-8">Uploaded: {resume.created_at ? formatStandardDate(resume.created_at) : 'Unknown Date'}</p>
                <StatusBadge status={resume.status || 'Pending'} />
              </div>
              
              <div className="flex-row gap-12">
                {resume.file_url ? (
                  <>
                    <button 
                      onClick={() => setPreviewUrl(resume.file_url)} 
                      className="btn-outline btn-sm"
                    >
                      Preview
                    </button>
                    <a href={resume.file_url} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm" style={{ textDecoration: 'none' }}>
                      Open
                    </a>
                  </>
                ) : (
                  <span className="badge badge-neutral">Old Text Format</span>
                )}
                <button onClick={() => handleDelete(resume.id, resume.file_url)} className="btn-danger btn-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center text-secondary p-32">
          <h3 className="m-0 mb-8">No Resumes Found</h3>
          <p className="m-0 text-secondary">Click the upload button above to add your first resume.</p>
        </div>
      )}

      {/* --- UPLOAD MODAL --- */}
      {isUploadModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          
          <div className="card p-0" style={{ width: '100%', maxWidth: '500px', background: 'var(--card-bg)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="m-0" style={{ fontSize: '1.25rem' }}>Upload PDF Resume</h3>
              <button onClick={() => { setIsUploadModalOpen(false); setSelectedFile(null); setNewTitle(''); }} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-color)' }}>✕</button>
            </div>
            
            <div style={{ padding: '24px' }}>
              <form onSubmit={handleUploadResume} className="flex-col gap-16">
                <div>
                  <label className="text-sm block mb-8 font-bold">Resume Title</label>
                  <input 
                    type="text" 
                    className="search-input w-full" 
                    placeholder="e.g., Senior Developer 2024" 
                    value={newTitle} 
                    onChange={(e) => setNewTitle(e.target.value)} 
                    required 
                  />
                </div>
                
                <div>
                  <label className="text-sm block mb-8 font-bold">Select File (PDF only)</label>
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    className="search-input w-full" 
                    style={{ padding: '8px', cursor: 'pointer' }}
                    onChange={(e) => setSelectedFile(e.target.files[0])} 
                    required 
                  />
                </div>
                
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" className="btn-outline" onClick={() => { setIsUploadModalOpen(false); setSelectedFile(null); setNewTitle(''); }}>Cancel</button>
                  <button type="submit" className="btn-black" disabled={isSubmitting}>
                    {isSubmitting ? 'Uploading...' : 'Upload Resume'}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* --- PREVIEW MODAL --- */}
      {previewUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          
          <div className="card p-0" style={{ width: '100%', maxWidth: '800px', height: '85vh', display: 'flex', flexDirection: 'column', background: 'var(--card-bg)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h3 className="m-0" style={{ fontSize: '1.25rem' }}>Resume Preview</h3>
              <button onClick={() => setPreviewUrl(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-color)' }}>✕</button>
            </div>
            
            <div style={{ flex: 1, backgroundColor: '#525659', width: '100%', height: '100%' }}>
              <iframe 
                src={`${previewUrl}#view=FitH`} 
                title="Resume Preview" 
                width="100%" 
                height="100%" 
                style={{ border: 'none', display: 'block' }}
              />
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}