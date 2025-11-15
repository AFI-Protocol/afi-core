import React from 'react';
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
declare const ModalSignalReview: React.FC<ModalSignalReviewProps>;
export default ModalSignalReview;
//# sourceMappingURL=ModalSignalReview.d.ts.map