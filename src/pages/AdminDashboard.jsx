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
  Chip,
  Alert,
  Snackbar,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  QuestionMark as QuestionIcon,
  TableChart as TableIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Download as DownloadIcon,
  AddCircleOutline as AddIcon,
  RemoveCircleOutline as RemoveIcon,
  Add as AddOptionIcon,
  Close as RemoveOptionIcon,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import { getQuestions, saveQuestions, getAllSubmissions, blankQuestion } from '../firebase/firestore';
import {
  Document,
  Packer,
  Paragraph,
  Table as DocxTable,
  TableRow as DocxTableRow,
  TableCell as DocxTableCell,
  TextRun,
  WidthType,
  AlignmentType,
  HeadingLevel,
} from 'docx';
import { saveAs } from 'file-saver';

const MIN_QUESTIONS = 1;
const MAX_QUESTIONS = 10;

const QUESTION_TYPES = [
  { value: 'textfield', label: 'Text Field (single line)' },
  { value: 'textarea', label: 'Text Area (multi line)' },
  { value: 'date', label: 'Date' },
  { value: 'radio', label: 'Radio (single choice)' },
  { value: 'select', label: 'Select (dropdown)' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function groupByWeek(submissions) {
  const groups = {};
  submissions.forEach((sub) => {
    const key = sub.weekNumber;
    if (!groups[key]) groups[key] = [];
    groups[key].push(sub);
  });
  return Object.keys(groups)
    .sort((a, b) => b - a)
    .map((key) => ({ weekKey: key, rows: groups[key] }));
}

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Word Export ───────────────────────────────────────────────────────────────
function exportToWord(weekKey, rows, questions) {
  const year = Math.floor(weekKey / 100);
  const week = weekKey % 100;

  const headerCells = [
    new DocxTableCell({
      children: [new Paragraph({ children: [new TextRun({ text: 'Name', bold: true, color: 'FFFFFF' })] })],
      shading: { fill: '4F46E5' },
    }),
    ...questions.map((q) =>
      new DocxTableCell({
        children: [new Paragraph({ children: [new TextRun({ text: q.text || 'Question', bold: true, color: 'FFFFFF' })] })],
        shading: { fill: '4F46E5' },
      })
    ),
    new DocxTableCell({
      children: [new Paragraph({ children: [new TextRun({ text: 'Submitted On', bold: true, color: 'FFFFFF' })] })],
      shading: { fill: '4F46E5' },
    }),
  ];

  const dataRows = rows.map(
    (row) =>
      new DocxTableRow({
        children: [
          new DocxTableCell({
            children: [new Paragraph({ children: [new TextRun({ text: row.userName || '—' })] })],
          }),
          ...questions.map((_, i) =>
            new DocxTableCell({
              children: [new Paragraph({ children: [new TextRun({ text: row.answers?.[`q${i}`] || '—' })] })],
            })
          ),
          new DocxTableCell({
            children: [new Paragraph({ children: [new TextRun({ text: formatDate(row.createdAt) })] })],
          }),
        ],
      })
  );

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          text: `Weekly Submissions — Week ${week}, ${year}`,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        }),
        new Paragraph({ text: `Total submissions: ${rows.length}`, spacing: { after: 400 } }),
        new DocxTable({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [new DocxTableRow({ children: headerCells, tableHeader: true }), ...dataRows],
        }),
      ],
    }],
  });

  Packer.toBlob(doc).then((blob) => saveAs(blob, `Week_${week}_${year}_Submissions.docx`));
}

// ── Question Editor Row ───────────────────────────────────────────────────────
function QuestionRow({ index, question, onChange, onRemove, canRemove }) {
  const needsOptions = question.type === 'radio' || question.type === 'select';

  const handleOptionChange = (i, val) => {
    const opts = [...question.options];
    opts[i] = val;
    onChange({ ...question, options: opts });
  };

  const addOption = () => onChange({ ...question, options: [...question.options, ''] });
  const removeOption = (i) => onChange({ ...question, options: question.options.filter((_, idx) => idx !== i) });

  return (
    <Box
      sx={{
        p: 2, border: '1px solid rgba(79,70,229,0.15)',
        borderRadius: 2, bgcolor: '#FAFBFF', position: 'relative',
      }}
    >
      {/* Header row */}
      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
        <Chip
          label={`Q${index + 1}`}
          size="small"
          sx={{ fontWeight: 700, bgcolor: '#EEF2FF', color: '#4F46E5', minWidth: 36 }}
        />

        {/* Type selector */}
        <FormControl size="small" sx={{ minWidth: 190 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={question.type}
            label="Type"
            onChange={(e) => onChange({ ...question, type: e.target.value, options: [] })}
          >
            {QUESTION_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {canRemove && (
          <Tooltip title="Remove question">
            <IconButton size="small" onClick={onRemove} sx={{ ml: 'auto', color: '#EF4444' }}>
              <RemoveIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Question text */}
      <TextField
        value={question.text}
        onChange={(e) => onChange({ ...question, text: e.target.value })}
        fullWidth
        size="small"
        placeholder={`Enter question ${index + 1}…`}
        label="Question text"
      />

      {/* Options editor for radio / select */}
      {needsOptions && (
        <Box mt={1.5}>
          <Typography variant="caption" fontWeight={600} color="text.secondary" mb={0.5} display="block">
            Options
          </Typography>
          <Box display="flex" flexDirection="column" gap={0.75}>
            {question.options.map((opt, i) => (
              <Box key={i} display="flex" alignItems="center" gap={1}>
                <TextField
                  value={opt}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                  size="small"
                  fullWidth
                  placeholder={`Option ${i + 1}`}
                />
                <IconButton size="small" onClick={() => removeOption(i)} sx={{ color: '#EF4444' }}>
                  <RemoveOptionIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button
              size="small"
              startIcon={<AddOptionIcon />}
              onClick={addOption}
              sx={{ alignSelf: 'flex-start', color: '#4F46E5', textTransform: 'none' }}
            >
              Add option
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [questions, setQuestions] = useState(Array(5).fill(null).map(blankQuestion));
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsSaving, setQuestionsSaving] = useState(false);

  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    getQuestions().then((q) => {
      setQuestions(q);
      setQuestionsLoading(false);
    });
  }, []);

  const loadSubmissions = useCallback(async () => {
    setSubmissionsLoading(true);
    const data = await getAllSubmissions();
    setSubmissions(data);
    setSubmissionsLoading(false);
  }, []);

  useEffect(() => { loadSubmissions(); }, [loadSubmissions]);

  const handleQuestionChange = (idx, updated) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? updated : q)));
  };

  const addQuestion = () => {
    if (questions.length >= MAX_QUESTIONS) return;
    setQuestions((prev) => [...prev, blankQuestion()]);
  };

  const removeQuestion = (idx) => {
    if (questions.length <= MIN_QUESTIONS) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveQuestions = async () => {
    const invalid = questions.some((q) => !q.text.trim());
    if (invalid) {
      setSnackbar({ open: true, message: 'Please fill in all question texts.', severity: 'warning' });
      return;
    }
    const optionsMissing = questions.some(
      (q) => (q.type === 'radio' || q.type === 'select') && q.options.filter(Boolean).length < 2
    );
    if (optionsMissing) {
      setSnackbar({ open: true, message: 'Radio/Select questions need at least 2 options.', severity: 'warning' });
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
    <Box minHeight="100vh" sx={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)' }}>
      <Navbar />

      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
        <Box mb={4}>
          <Typography variant="h4" color="text.primary">Admin Dashboard</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Manage weekly questions and view all user submissions.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* ── Question Editor ── */}
          <Grid item xs={12} md={5}>
            <Card elevation={0} sx={{ border: '1px solid rgba(79,70,229,0.12)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Box sx={{
                    width: 36, height: 36, borderRadius: 2,
                    background: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <QuestionIcon sx={{ color: 'white', fontSize: 20 }} />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="h6">Weekly Questions</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {questions.length}/{MAX_QUESTIONS} questions · min {MIN_QUESTIONS}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" flexDirection="column" gap={2}>
                  {questionsLoading
                    ? Array(5).fill(0).map((_, i) => (
                        <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
                      ))
                    : questions.map((q, i) => (
                        <QuestionRow
                          key={i}
                          index={i}
                          question={q}
                          onChange={(updated) => handleQuestionChange(i, updated)}
                          onRemove={() => removeQuestion(i)}
                          canRemove={questions.length > MIN_QUESTIONS}
                        />
                      ))}
                </Box>

                {/* Add question */}
                {!questionsLoading && questions.length < MAX_QUESTIONS && (
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<AddIcon />}
                    onClick={addQuestion}
                    sx={{ mt: 2, borderStyle: 'dashed', borderRadius: 2, color: '#4F46E5', borderColor: '#818CF8' }}
                  >
                    Add Question ({questions.length}/{MAX_QUESTIONS})
                  </Button>
                )}

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  sx={{ mt: 2 }}
                  startIcon={questionsSaving ? null : <SaveIcon />}
                  onClick={handleSaveQuestions}
                  disabled={questionsSaving || questionsLoading}
                >
                  {questionsSaving ? 'Saving…' : 'Save Questions'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* ── Submissions Table ── */}
          <Grid item xs={12} md={7}>
            <Card elevation={0} sx={{ border: '1px solid rgba(79,70,229,0.12)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{
                      width: 36, height: 36, borderRadius: 2,
                      background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <TableIcon sx={{ color: 'white', fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6">All Submissions</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Grouped by week · hover for full text
                      </Typography>
                    </Box>
                  </Box>
                  <Button size="small" startIcon={<RefreshIcon />} onClick={loadSubmissions} variant="outlined" sx={{ borderRadius: 2 }}>
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
                  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8} sx={{ color: 'text.secondary' }}>
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
                          <Box display="flex" alignItems="center" gap={1} flex={1}>
                            <Chip label={`Week ${week}`} color="primary" size="small" sx={{ fontWeight: 700 }} />
                            <Typography variant="body2" color="text.secondary">{year}</Typography>
                            <Chip
                              icon={<PersonIcon sx={{ fontSize: '14px !important' }} />}
                              label={`${rows.length} submission${rows.length > 1 ? 's' : ''}`}
                              size="small" variant="outlined" sx={{ ml: 1 }}
                            />
                            <Box ml="auto" mr={1}>
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<DownloadIcon />}
                                onClick={(e) => { e.stopPropagation(); exportToWord(weekKey, rows, questions); }}
                                sx={{
                                  background: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)',
                                  borderRadius: 2, fontSize: '0.7rem', py: 0.5, px: 1.5,
                                  boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
                                  '&:hover': { boxShadow: '0 4px 12px rgba(79,70,229,0.45)' },
                                }}
                              >
                                Export Word
                              </Button>
                            </Box>
                          </Box>
                        </AccordionSummary>

                        <AccordionDetails sx={{ p: 0 }}>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                                  <TableCell sx={{ fontWeight: 700, minWidth: 100 }}>User</TableCell>
                                  {questions.map((q, i) => (
                                    <Tooltip key={i} title={q.text || `Question ${i + 1}`} placement="top">
                                      <TableCell sx={{ fontWeight: 700, maxWidth: 140, cursor: 'help' }}>
                                        <Typography variant="body2" fontWeight={700}
                                          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>
                                          {q.text || `Question ${i + 1}`}
                                        </Typography>
                                      </TableCell>
                                    </Tooltip>
                                  ))}
                                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {rows.map((row) => (
                                  <TableRow key={row.id} hover>
                                    <TableCell>
                                      <Box display="flex" alignItems="center" gap={1}>
                                        <Box sx={{
                                          width: 28, height: 28, borderRadius: '50%',
                                          background: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0,
                                        }}>
                                          {row.userName?.charAt(0).toUpperCase()}
                                        </Box>
                                        <Typography variant="body2" fontWeight={600}>{row.userName}</Typography>
                                      </Box>
                                    </TableCell>
                                    {questions.map((_, i) => (
                                      <TableCell key={i} sx={{ maxWidth: 140 }}>
                                        <Tooltip title={row.answers?.[`q${i}`] || ''} placement="top">
                                          <Typography variant="body2"
                                            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>
                                            {row.answers?.[`q${i}`] || '—'}
                                          </Typography>
                                        </Tooltip>
                                      </TableCell>
                                    ))}
                                    <TableCell>
                                      <Typography variant="body2" color="text.secondary">{formatDate(row.createdAt)}</Typography>
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
