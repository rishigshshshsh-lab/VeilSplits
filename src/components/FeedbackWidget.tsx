import React, { useState } from 'react';
import { MessageSquare, Star, X, Send } from 'lucide-react';
import { useToast } from './Toast';

export const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      showToast('Please select a rating', 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // For MVP, we mock the submission to a backend (e.g. Supabase or Google Form endpoint)
      console.log('Feedback submitted:', { rating, comment, timestamp: new Date() });
      await new Promise(r => setTimeout(r, 1000));
      
      showToast('Thank you for your feedback!', 'success');
      setIsOpen(false);
      setRating(0);
      setComment('');
    } catch (error) {
      showToast('Failed to submit feedback', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '2rem', left: '2rem', zIndex: 9000 }}>
      {isOpen ? (
        <div className="card" style={{ width: '320px', padding: '1.5rem', animation: 'slideIn 0.2s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', margin: 0 }}>Feedback</h3>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>How was your experience?</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star 
                      size={24} 
                      fill={(hoverRating || rating) >= star ? '#fbbf24' : 'transparent'} 
                      color={(hoverRating || rating) >= star ? '#fbbf24' : 'var(--border-muted)'} 
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <textarea
                className="form-input"
                placeholder="What can we improve? (Optional)"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{ resize: 'none', fontSize: '0.9rem', padding: '0.75rem' }}
              />
            </div>
            
            <button type="submit" disabled={isSubmitting || rating === 0} className="btn btn-primary" style={{ width: '100%' }}>
              {isSubmitting ? 'Sending...' : <><Send size={16} /> Submit Feedback</>}
            </button>
          </form>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="btn btn-primary"
          style={{ borderRadius: '50px', padding: '0.75rem 1.25rem', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)' }}
        >
          <MessageSquare size={18} />
          <span>Feedback</span>
        </button>
      )}
    </div>
  );
};
