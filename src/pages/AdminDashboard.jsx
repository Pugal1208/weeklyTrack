import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Snackbar,
  Skeleton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
} from '@mui/material';
import {
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  QuestionMark as QuestionIcon,
  TableChart as TableIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import { getQuestions, saveQuestions, getAllSubmissions } from '../firebase/firestore';

const QUESTION_COUNT = 5;

// Group submissions by weekNumber
function groupByWeek(submissions) {
  const groups = {};
  submissions.forEach((sub) => {
    const key = sub.weekNumber;
    if (!groups[key]) groups[key] = [];
    groups[key].push(sub);
  });
  // Sort keys descending (most recent week first)
  return Object.keys(groups)
    .sort((a, b) => b - a)
    .map((key) => ({ weekKey: key, rows: groups[key] }));
}

// Format Firestore Timestamp or null safely
function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminDashboard() {
  const [questions, setQuestions] = useState(Array(QUESTION_COUNT).fill(''));
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsSaving, setQuestionsSaving] = useState(false);

  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Load questions
  useEffect(() => {
    getQuestions().then((q) => {
      setQuestions(q.length ? q : Array(QUESTION_COUNT).fill(''));
      setQuestionsLoading(false);
    });
  }, []);

  // Load submissions
  const loadSubmissions = useCallback(async () => {
    setSubmissionsLoading(true);
    const data = await getAllSubmissions();
    setSubmissions(data);
    setSubmissionsLoading(false);
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleQuestionChange = (idx, val) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? val : q)));
  };

  const handleSaveQuestions = async () => {
    const nonEmpty = questions.filter((q) => q.trim() !== '');
    if (nonEmpty.length < QUESTION_COUNT) {
      setSnackbar({ open: true, message: 'Please fill in all 5 questions.', severity: 'warning' });
      return;
    }
    setQuestionsSaving(true);
    try {
      await saveQuestions(questions);
      setSnackbar({ open: true, message: 'Questions saved successfully!', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to save questions.', severity: 'error' });
    } finally {
      setQuestionsSaving(false);
    }
  };

  const grouped = groupByWeek(submissions);

  return (
    <Box
      minHeight="100vh"
      sx={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)' }}
    >
      <Navbar />

      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
        {/* Page Header */}
        <Box mb={4}>
          <Typography variant="h4" color="text.primary">
            Admin Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Manage weekly questions and view all user submissions.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* ── Question Editor ────────────────────────────────────────── */}
          <Grid item xs={12} md={5}>
            <Card elevation={0} sx={{ border: '1px solid rgba(79,70,229,0.12)', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <Box
                    sx={{
                      width: 36, height: 36, borderRadius: 2,
                      background: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <QuestionIcon sx={{ color: 'white', fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6">Weekly Questions</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Define the 5 questions users will answer
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" flexDirection="column" gap={2}>
                  {questionsLoading
                    ? Array(QUESTION_COUNT).fill(0).map((_, i) => (
                        <Skeleton key={i} variant="rectangular" height={56} sx={{ borderRadius: 2 }} />
                      ))
                    : questions.map((q, i) => (
                        <TextField
                          key={i}
                          label={`Question ${i + 1}`}
                          value={q}
                          onChange={(e) => handleQuestionChange(i, e.target.value)}
                          fullWidth
                          multiline
                          maxRows={3}
                          id={`question-${i + 1}`}
                          placeholder={`Enter question ${i + 1}…`}
                        />
                      ))}
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  sx={{ mt: 3 }}
                  startIcon={questionsSaving ? null : <SaveIcon />}
                  onClick={handleSaveQuestions}
                  disabled={questionsSaving || questionsLoading}
                >
                  {questionsSaving ? 'Saving…' : 'Save Questions'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* ── Submissions Table ────────────────────────────────────────── */}
          <Grid item xs={12} md={7}>
            <Card elevation={0} sx={{ border: '1px solid rgba(79,70,229,0.12)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 36, height: 36, borderRadius: 2,
                        background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <TableIcon sx={{ color: 'white', fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6">All Submissions</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Grouped by week
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={loadSubmissions}
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  >
                    Refresh
                  </Button>
                </Box>

                {submissionsLoading ? (
                  <Box display="flex" flexDirection="column" gap={2}>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
                    ))}
                  </Box>
                ) : grouped.length === 0 ? (
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    py={8}
                    sx={{ color: 'text.secondary' }}
                  >
                    <TableIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                    <Typography variant="body2">No submissions yet.</Typography>
                  </Box>
                ) : (
                  grouped.map(({ weekKey, rows }) => {
                    const year = Math.floor(weekKey / 100);
                    const week = weekKey % 100;
                    return (
                      <Accordion
                        key={weekKey}
                        defaultExpanded
                        disableGutters
                        elevation={0}
                        sx={{
                          mb: 2,
                          border: '1px solid rgba(79,70,229,0.10)',
                          borderRadius: '12px !important',
                          '&:before': { display: 'none' },
                          overflow: 'hidden',
                        }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#F1F5F9' }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={`Week ${week}`}
                              color="primary"
                              size="small"
                              sx={{ fontWeight: 700 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {year}
                            </Typography>
                            <Chip
                              icon={<PersonIcon sx={{ fontSize: '14px !important' }} />}
                              label={`${rows.length} submission${rows.length > 1 ? 's' : ''}`}
                              size="small"
                              variant="outlined"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>User</TableCell>
                                  {Array(QUESTION_COUNT).fill(0).map((_, i) => (
                                    <TableCell key={i}>Q{i + 1}</TableCell>
                                  ))}
                                  <TableCell>Date</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {rows.map((row) => (
                                  <TableRow key={row.id} hover>
                                    <TableCell>
                                      <Box display="flex" alignItems="center" gap={1}>
                                        <Box
                                          sx={{
                                            width: 28, height: 28, borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0,
                                          }}
                                        >
                                          {row.userName?.charAt(0).toUpperCase()}
                                        </Box>
                                        <Typography variant="body2" fontWeight={600}>
                                          {row.userName}
                                        </Typography>
                                      </Box>
                                    </TableCell>
                                    {Array(QUESTION_COUNT).fill(0).map((_, i) => (
                                      <TableCell key={i} sx={{ maxWidth: 120 }}>
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                          }}
                                        >
                                          {row.answers?.[`q${i}`] || '—'}
                                        </Typography>
                                      </TableCell>
                                    ))}
                                    <TableCell>
                                      <Typography variant="body2" color="text.secondary">
                                        {formatDate(row.createdAt)}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
