import React, { useState, useEffect } from 'react';
import './DenominationCounter.css';
import { DollarSign, Hash } from 'lucide-react';

const DENOMINATIONS = [5000, 1000, 500, 100, 50, 20, 10, 5, 2, 1];

const SAVED_DENOMS_KEY = 'eod_saved_denominations';

const DenominationCounter = ({ onTotalChange, onDenominationsChange }) => {
    const [counts, setCounts] = useState(() => {
        const saved = localStorage.getItem(SAVED_DENOMS_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
        return DENOMINATIONS.reduce((acc, denom) => ({ ...acc, [denom]: '' }), {});
    });

    useEffect(() => {
        // Run once on load to sync loaded totals
        const total = calculateTotal(counts);
        onTotalChange(total);
        onDenominationsChange(counts);
    }, []);

    const calculateTotal = (newCounts) => {
        return Object.entries(newCounts).reduce((total, [denom, count]) => {
            const countNum = parseInt(count) || 0;
            return total + (parseInt(denom) * countNum);
        }, 0);
    };

    const handleCountChange = (denom, value) => {
        // Only allow numbers
        if (value !== '' && !/^\d+$/.test(value)) return;

        const newCounts = { ...counts, [denom]: value };
        setCounts(newCounts);
        localStorage.setItem(SAVED_DENOMS_KEY, JSON.stringify(newCounts));

        const total = calculateTotal(newCounts);
        onTotalChange(total);
        onDenominationsChange(newCounts);
    };

    return (
        <div className="denomination-counter-premium">
            <div className="denom-grid">
                {DENOMINATIONS.map((denom) => (
                    <div key={denom} className="denom-row">
                        <div className="denom-label">
                            <span className="denom-prefix">LKR</span>
                            <span className="denom-value">{denom.toLocaleString()}</span>
                        </div>
                        <div className="denom-x">×</div>
                        <div className="denom-input-wrapper">
                            <input
                                type="text"
                                placeholder="0"
                                value={counts[denom]}
                                onChange={(e) => handleCountChange(denom, e.target.value)}
                                className="denom-input"
                            />
                        </div>
                        <div className="denom-result">
                            = LKR {((parseInt(counts[denom]) || 0) * denom).toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>

            <div className="denom-total-summary">
                <div className="total-label">Subtotal Breakdown</div>
                <div className="total-value">
                    <small>LKR</small>
                    <span>{calculateTotal(counts).toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
};

export default DenominationCounter;
