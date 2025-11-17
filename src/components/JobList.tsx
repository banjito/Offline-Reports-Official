import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Job } from '../types';
import './JobList.css';

export function JobList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadJobs();
  }, [refreshKey]); // Re-run when refreshKey changes

  // Listen for sync completion events
  useEffect(() => {
    const handleJobsSynced = () => {
      console.log('Jobs synced event received, refreshing list...');
      setRefreshKey(k => k + 1);
    };

    window.addEventListener('jobs-synced', handleJobsSynced);
    return () => window.removeEventListener('jobs-synced', handleJobsSynced);
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.dbQuery<Job[]>('jobs', 'getAll', {});
      console.log('Load jobs result:', result);
      if (result.success && result.data) {
        setJobs(result.data);
      } else {
        console.error('Failed to load jobs:', result.error);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: Job['status']) => {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'in_progress':
      case 'in-progress':
        return 'badge-primary';
      case 'pending':
        return 'badge-warning';
      case 'cancelled':
        return 'badge-danger';
      case 'on-hold':
        return 'badge-secondary';
      default:
        return 'badge-default';
    }
  };

  const getPriorityBadgeClass = (priority?: Job['priority']) => {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="job-list-container">
        <div className="loading">Loading jobs...</div>
      </div>
    );
  }

  return (
    <div className="job-list-container">
      <div className="job-list-header">
        <h2>In Progress Jobs ({jobs.length})</h2>
        <button 
          onClick={() => setRefreshKey(k => k + 1)} 
          className="btn-secondary"
        >
          ↻ Refresh
        </button>
      </div>

      <div className="job-list">
        {jobs.length === 0 ? (
          <div className="empty-state">
            <p>No in-progress jobs</p>
            <p className="empty-state-hint">
              Click "Sync FROM DB" to download your active jobs
            </p>
          </div>
        ) : (
          jobs.map(job => (
            <div key={job.id} className="job-card">
              <div className="job-card-header">
                <div className="job-card-title">
                  <h3>{job.title}</h3>
                  <span className="job-number">#{job.job_number}</span>
                </div>
                <div className="job-card-badges">
                  {job.priority && (
                    <span className={`priority-badge ${getPriorityBadgeClass(job.priority)}`}>
                      {job.priority}
                    </span>
                  )}
                  <span className={`status-badge ${getStatusBadgeClass(job.status)}`}>
                    {job.status}
                  </span>
                  {job.is_dirty && (
                    <span className="dirty-indicator" title="Has unsynced changes">
                      ●
                    </span>
                  )}
                </div>
              </div>

              <div className="job-card-body">
                {job.description && (
                  <p className="job-description">{job.description}</p>
                )}

                <div className="job-metadata">
                  {job.customer_name && (
                    <div className="metadata-item">
                      <span className="metadata-label">Customer:</span>
                      <span className="metadata-value">
                        {job.customer_company || job.customer_name}
                      </span>
                    </div>
                  )}

                  {job.location && (
                    <div className="metadata-item">
                      <span className="metadata-label">Location:</span>
                      <span className="metadata-value">{job.location}</span>
                    </div>
                  )}

                  {job.due_date && (
                    <div className="metadata-item">
                      <span className="metadata-label">Due:</span>
                      <span className="metadata-value">
                        {new Date(job.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="job-card-actions">
                <button 
                  className="btn-primary"
                  onClick={() => navigate(`/job/${job.id}`)}
                  title="Open job to view details and work on reports"
                >
                  Open Job
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

