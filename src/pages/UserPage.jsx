import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  AlertTitle,
  Skeleton,
  LinearProgress,
  Snackbar,
  Chip,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
  Lock as LockIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { getQuestions, hasSubmittedThisWeek, submitAnswers } from '../firebase/firestore';
import { getISOWeekNumber, getWeekKey } from '../hooks/useWeekNumber';

// ── Type-aware Question Input ─────────────────────────────────────────────────
function QuestionInput({ question, index, value, onChange, disabled }) {
  const { text, type, options = [] } = question;

  const label = `${index + 1}. ${text || `Question ${index + 1}`}`;

  switch (type) {
    case 'textfield':
      return (
        <Box>
          <Typography variant="body2" fontWeight={600} color="text.primary" mb={1}>{label}</Typography>
          <TextField
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            fullWidth
            placeholder="Type your answer here…"
            disabled={disabled}
            id={`answer-q${index}`}
            sx={{ '& .MuiOutlinedInput-root': { bgcolor: disabled ? '#F8FAFC' : 'white' } }}
          />
        </Box>
      );

    case 'date':
      return (
        <Box>
          <Typography variant="body2" fontWeight={600} color="text.primary" mb={1}>{label}</Typography>
          <TextField
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            fullWidth
            disabled={disabled}
            id={`answer-q${index}`}
            InputLabelProps={{ shrink: true }}
            sx={{ '& .MuiOutlinedInput-root': { bgcolor: disabled ? '#F8FAFC' : 'white' } }}
          />
        </Box>
      );

    case 'radio':
      return (
        <FormControl component="fieldset" disabled={disabled}>
          <FormLabel component="legend" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
            {label}
          </FormLabel>
          <RadioGroup
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            id={`answer-q${index}`}
          >
            {options.filter(Boolean).map((opt, i) => (
              <FormControlLabel key={i} value={opt} control={<Radio />} label={opt} />
            ))}
          </RadioGroup>
        </FormControl>
      );

    case 'select':
      return (
        <Box>
          <Typography variant="body2" fontWeight={600} color="text.primary" mb={1}>{label}</Typography>
          <FormControl fullWidth disabled={disabled}>
            <InputLabel id={`select-label-q${index}`}>Select an option</InputLabel>
            <Select
              labelId={`select-label-q${index}`}
              id={`answer-q${index}`}
              value={value || ''}
              label="Select an option"
              onChange={(e) => onChange(e.target.value)}
              sx={{ bgcolor: disabled ? '#F8FAFC' : 'white' }}
            >
              {options.filter(Boolean).map((opt, i) => (
                <MenuItem key={i} value={opt}>{opt}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      );

    case 'textarea':
    default:
      return (
        <Box>
          <Typography variant="body2" fontWeight={600} color="text.primary" mb={1}>{label}</Typography>
          <TextField
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            maxRows={5}
            placeholder="Type your answer here…"
            disabled={disabled}
            id={`answer-q${index}`}
            sx={{ '& .MuiOutlinedInput-root': { bgcolor: disabled ? '#F8FAFC' : 'white' } }}
          />
        </Box>
      );
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function UserPage() {
  const { currentUser } = useAuth();
  const userName = currentUser?.name || '';

  const today = new Date();
  const weekNumber = getISOWeekNumber(today);
  const weekKey = getWeekKey(today);
  const year = today.getFullYear();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [pageLoading, setPageLoading] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');
  const [snackOpen, setSnackOpen] = useState(false);

  // All questions must have a non-empty answer
  const allAnswered = questions.length > 0 && questions.every((_, i) => {
    const val = answers[`q${i}`];
    return val !== undefined && String(val).trim() !== '';
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [qs, submitted] = await Promise.all([
          getQuestions(),
          hasSubmittedThisWeek(userName, weekKey),
        ]);
        setQuestions(qs);
        setAlreadySubmitted(submitted);
        // Init answers
        const init = {};
        qs.forEach((_, i) => { init[`q${i}`] = ''; });
        setAnswers(init);
      } catch {
        setError('Failed to load data. Please refresh.');
      } finally {
        setPageLoading(false);
      }
    }
    if (userName) loadData();
  }, [userName, weekKey]);

  const handleChange = (key, val) => {
    setAnswers((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allAnswered) {
      setError('Please answer all questions before submitting.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await submitAnswers({ userName, answers, weekNumber: weekKey });
      setAlreadySubmitted(true);
      setSubmitSuccess(true);
      setSnackOpen(true);
    } catch {
      setError('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const noQuestions = !pageLoading && questions.every((q) => !q.text?.trim());

  return (
    <Box minHeight="100vh" sx={{ background: 'linear-gradient(135deg, #F0FDF4 0%, #EEF2FF 100%)' }}>
      <Navbar />

      <Box sx={{ maxWidth: 680, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
        {/* Page header */}
        <Box mb={4}>
          <Box display="flex" alignItems="center" gap={1.5} mb={1}>
            <Box sx={{
              width: 44, height: 44, borderRadius: 2,
              background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(14,165,233,0.3)',
            }}>
              <AssignmentIcon sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h5" color="text.primary">Weekly Check-in</Typography>
              <Typography variant="caption" color="text.secondary">
                Hi, <strong>{userName}</strong>! Please complete your weekly submission.
              </Typography>
            </Box>
          </Box>

          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip
              icon={<CalendarIcon sx={{ fontSize: '14px !important' }} />}
              label={`Week ${weekNumber} · ${year}`}
              color="primary" variant="outlined" size="small" sx={{ fontWeight: 600 }}
            />
            {alreadySubmitted && (
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                label="Submitted this week"
                color="success" size="small" sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
        </Box>

        {/* Already submitted banner */}
        {alreadySubmitted && !pageLoading && (
          <Alert severity="success" icon={<CheckCircleIcon />}
            sx={{ mb: 3, borderRadius: 3, border: '1px solid #BBF7D0' }}>
            <AlertTitle sx={{ fontWeight: 700 }}>
              {submitSuccess ? 'Submission Received!' : 'Already Submitted'}
            </AlertTitle>
            {submitSuccess
              ? `Your answers for Week ${weekNumber} have been saved. See you next week!`
              : `You've already submitted your form for Week ${weekNumber}. Come back next week!`}
          </Alert>
        )}

        <Card elevation={0} sx={{ border: '1px solid rgba(79,70,229,0.12)' }}>
          {submitting && <LinearProgress color="primary" />}
          <CardContent sx={{ p: 4 }}>
            {pageLoading ? (
              <Box display="flex" flexDirection="column" gap={3}>
                <Skeleton variant="text" width="60%" height={32} />
                {Array(5).fill(0).map((_, i) => (
                  <Box key={i}>
                    <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} />
                    <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2 }} />
                  </Box>
                ))}
                <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2 }} />
              </Box>
            ) : error && questions.length === 0 ? (
              <Alert severity="error">{error}</Alert>
            ) : noQuestions ? (
              <Alert severity="info">
                No questions have been configured by the admin yet. Please check back later.
              </Alert>
            ) : (
              <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={3}>
                <Typography variant="h6" color="text.primary">This Week's Questions</Typography>
                <Divider />

                {questions.map((q, i) => (
                  <QuestionInput
                    key={i}
                    question={q}
                    index={i}
                    value={answers[`q${i}`]}
                    onChange={(val) => handleChange(`q${i}`, val)}
                    disabled={alreadySubmitted}
                  />
                ))}

                {error && <Alert severity="error">{error}</Alert>}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={alreadySubmitted || submitting || !allAnswered}
                  startIcon={alreadySubmitted ? <LockIcon /> : submitting ? null : <SendIcon />}
                  sx={{
                    mt: 1,
                    ...(alreadySubmitted && {
                      background: '#E2E8F0 !important',
                      color: '#94A3B8 !important',
                      boxShadow: 'none !important',
                    }),
                  }}
                >
                  {alreadySubmitted ? 'Already Submitted' : submitting ? 'Submitting…' : 'Submit My Answers'}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        <Typography variant="caption" display="block" textAlign="center" mt={3} color="text.secondary">
          Submissions are locked to one per week per user.
        </Typography>
      </Box>

      <Snackbar open={snackOpen} autoHideDuration={5000} onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setSnackOpen(false)}
          sx={{ borderRadius: 2 }} icon={<CheckCircleIcon />}>
          Answers submitted successfully for Week {weekNumber}!
        </Alert>
      </Snackbar>
    </Box>
  );
}
