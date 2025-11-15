import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Box,
  Button,
  Divider,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// 🧠 Placeholder type — will map to SignalSchema later
type SignalData = {
  id: string;
  symbol: string;
  market: string;
  action: string;
  timeframe: string;
  strength: number;
  analysis?: {
    confidence?: number;
    summary?: string;
  };
  note?: string;
  [key: string]: any;
};

type ModalSignalReviewProps = {
  open: boolean;
  onClose: () => void;
  signal?: SignalData;
  isLoading?: boolean;
};

const ModalSignalReview: React.FC<ModalSignalReviewProps> = ({
  open,
  onClose,
  signal,
  isLoading = false,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Signal Review</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent dividers>
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : signal ? (
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Symbol
            </Typography>
            <Typography variant="body1" gutterBottom>
              {signal.symbol} / {signal.market}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary">
              Action
            </Typography>
            <Typography variant="body1" gutterBottom>
              {signal.action} — {signal.timeframe}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary">
              Signal Strength
            </Typography>
            <Typography variant="body1" gutterBottom>
              {signal.strength}
            </Typography>

            {signal.analysis?.summary && (
              <>
                <Typography variant="subtitle2" color="text.secondary">
                  AI Analysis
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {signal.analysis.summary}
                </Typography>
              </>
            )}

            {signal.note && (
              <>
                <Typography variant="subtitle2" color="text.secondary">
                  Validator Note
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {signal.note}
                </Typography>
              </>
            )}
          </Box>
        ) : (
          <Typography color="text.secondary">No signal data available.</Typography>
        )}
      </DialogContent>

      <DialogActions>
        {/* Placeholder for future workflow buttons */}
        <Button onClick={onClose}>Close</Button>
        <Button color="primary" variant="contained" disabled>
          Finalize Signal (Coming Soon)
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalSignalReview;
