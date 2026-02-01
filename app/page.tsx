'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface StatusItem {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  lastChecked: string;
  url: string;
}

interface CalendarEvent {
  title: string;
  start: string;
  end: string;
  location?: string;
}

interface Submission {
  id: string;
  title: string;
  course: string;
  notes: string;
  fileUrl?: string;
  fileName?: string;
  fileId?: string;
  tags: string[];
  rating: number;
  ratingCount: number;
  submittedAt: string;
  approved: boolean;
}

const PREDEFINED_TAGS = [
  'Midterm',
  'Final',
  'Study Guide',
  'Homework',
  'Project',
  'Notes',
  'Practice Problems',
  'Other'
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'home' | 'status' | 'calendar' | 'library'>('home');
  const [statusItems, setStatusItems] = useState<StatusItem[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterRating, setFilterRating] = useState<number>(0);
  const [uploadedFile, setUploadedFile] = useState<{fileId: string, fileName: string, url: string} | null>(null);
  const [selectedFileTags, setSelectedFileTags] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    course: '',
    notes: '',
    fileUrl: ''
  });

  useEffect(() => {
    if (activeTab === 'status') {
      fetchStatus();
    } else if (activeTab === 'calendar') {
      fetchCalendar();
    } else if (activeTab === 'library') {
      fetchSubmissions();
    }
  }, [activeTab]);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/uptime-check');
      const data = await response.json();
      setStatusItems(data.statuses || []);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const fetchCalendar = async () => {
    try {
      const response = await fetch('/api/calendar-get');
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Failed to fetch calendar:', error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions-public');
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only PDF and DOCX files are allowed');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setUploadedFile({
          fileId: data.fileId,
          fileName: data.filename,
          url: data.url
        });
        alert(`File uploaded: ${data.filename}`);
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('File upload failed');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.course) {
      alert('Please fill in title and course');
      return;
    }

    if (!formData.notes && !uploadedFile) {
      alert('Please provide either notes or upload a file');
      return;
    }

    try {
      const response = await fetch('/api/submit-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fileUrl: uploadedFile?.url || '',
          fileName: uploadedFile?.fileName || '',
          fileId: uploadedFile?.fileId || '',
          tags: selectedFileTags
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Submission received! It will be reviewed by an admin.');
        setFormData({ title: '', course: '', notes: '', fileUrl: '' });
        setUploadedFile(null);
        setSelectedFileTags([]);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Submission failed');
    }
  };

  const handleRating = async (submissionId: string, rating: number) => {
    try {
      const response = await fetch('/api/rate-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, rating })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Rated ${rating} stars! Average: ${data.averageRating}`);
        fetchSubmissions();
      }
    } catch (error) {
      console.error('Rating error:', error);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleFileTag = (tag: string) => {
    setSelectedFileTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => sub.tags?.includes(tag));
    const matchesRating = filterRating === 0 || sub.rating >= filterRating;
    
    return matchesSearch && matchesTags && matchesRating;
  });

  const renderStars = (rating: number, interactive: boolean = false, submissionId?: string) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => interactive && submissionId && handleRating(submissionId, star)}
            disabled={!interactive}
            className={`text-xl ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'} ${interactive ? 'hover:scale-110 transition-transform cursor-pointer' : 'cursor-default'}`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Queens College Hub</h1>
              <p className="text-gray-600">Your campus information center</p>
            </div>
            <nav className="flex gap-4">
              <button onClick={() => setActiveTab('home')} className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'home' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>Home</button>
              <button onClick={() => setActiveTab('status')} className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'status' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>Status</button>
              <button onClick={() => setActiveTab('calendar')} className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'calendar' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>Calendar</button>
              <button onClick={() => setActiveTab('library')} className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'library' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>Library</button>
              <Link href="/admin" className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all">Admin</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'home' && (
          <div className="space-y-8">
            <section className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Campus Status</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {statusItems.slice(0, 2).map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${item.status === 'operational' ? 'bg-green-500' : item.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      </div>
                      <span className="text-sm text-gray-500 capitalize">{item.status} ({item.lastChecked.split(' ')[0]})</span>
                    </div>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-2 inline-block">Visit site →</a>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Upcoming Events (Next 7 Days)</h2>
              {events.length === 0 ? (
                <p className="text-gray-600">No upcoming events in the next 7 days.</p>
              ) : (
                <div className="space-y-3">
                  {events.slice(0, 5).map((event, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="font-semibold text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-600">{new Date(event.start).toLocaleString()}</p>
                      {event.location && <p className="text-sm text-gray-500">{event.location}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Shared Notes & Exams</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-semibold text-lg">Submit Anonymously</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <input type="text" placeholder="Course (ex: ECON 229)" value={formData.course} onChange={(e) => setFormData({...formData, course: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>

                <select value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
                  <option value="">Notes</option>
                  <option value="exam">Exam</option>
                  <option value="notes">Class Notes</option>
                  <option value="study-guide">Study Guide</option>
                  <option value="other">Other</option>
                </select>

                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                  <p className="text-gray-600 mb-2">📎 Drag & drop file here or</p>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])} className="hidden" id="fileUpload" />
                  <label htmlFor="fileUpload" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer inline-block">Choose File</label>
                  <p className="text-xs text-gray-500 mt-2">PDF or DOCX (Max 10MB)</p>
                  {uploadedFile && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-700 font-medium">✓ {uploadedFile.fileName}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (Select all that apply)</label>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_TAGS.map(tag => (
                      <button key={tag} type="button" onClick={() => toggleFileTag(tag)} className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedFileTags.includes(tag) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <input type="text" placeholder="File URL (PDF link, Drive link, etc.)" value={formData.fileUrl} onChange={(e) => setFormData({...formData, fileUrl: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />

                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">Submit for Review</button>
              </form>
            </section>
          </div>
        )}

        {activeTab === 'status' && (
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Campus Status</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {statusItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.status === 'operational' ? 'bg-green-500' : item.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Status: <span className="font-medium capitalize">{item.status}</span></p>
                  <p className="text-sm text-gray-500 mb-2">Checked: {item.lastChecked}</p>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Visit site →</a>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'calendar' && (
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Upcoming Events (Next 7 Days)</h2>
            {events.length === 0 ? (
              <p className="text-gray-600">No upcoming events in the next 7 days.</p>
            ) : (
              <div className="space-y-4">
                {events.map((event, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-lg text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{new Date(event.start).toLocaleString()}</p>
                    {event.location && <p className="text-sm text-gray-500 mt-1">📍 {event.location}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'library' && (
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Approved Library</h2>
            
            <div className="mb-6 space-y-4">
              <input type="text" placeholder="🔍 Search by course, title, or type" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Tags</label>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_TAGS.map(tag => (
                    <button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedTags.includes(tag) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
                <select value={filterRating} onChange={(e) => setFilterRating(Number(e.target.value))} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value={0}>All Ratings</option>
                  <option value={4}>4+ Stars</option>
                  <option value={3}>3+ Stars</option>
                  <option value={2}>2+ Stars</option>
                </select>
              </div>
            </div>

            {filteredSubmissions.length === 0 ? (
              <p className="text-gray-600">No approved submissions yet.</p>
            ) : (
              <div className="space-y-4">
                {filteredSubmissions.map((sub) => (
                  <div key={sub.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{sub.title}</h3>
                        <p className="text-sm text-gray-600">{sub.course}</p>
                      </div>
                      <div className="text-right">
                        {renderStars(sub.rating || 0)}
                        <p className="text-xs text-gray-500 mt-1">{sub.ratingCount || 0} ratings</p>
                      </div>
                    </div>
                    
                    {sub.tags && sub.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {sub.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">{tag}</span>
                        ))}
                      </div>
                    )}

                    {sub.notes && <p className="text-gray-700 mb-3">{sub.notes}</p>}
                    
                    {sub.fileName && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">📄 {sub.fileName}</p>
                        <a href={sub.fileUrl} className="text-sm text-blue-600 hover:underline">Download File</a>
                      </div>
                    )}

                    {sub.fileUrl && !sub.fileName && (
                      <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline block mb-3">View File →</a>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</p>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Rate this:</p>
                        {renderStars(0, true, sub.id)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600">
          <p>Queens College Hub • Built for students, by students</p>
        </div>
      </footer>
    </div>
  );
}
