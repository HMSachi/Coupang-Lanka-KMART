import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Play,
    Lock,
    Calculator,
    User,
    Clock,
    Monitor,
    AlertCircle,
    Info,
    CheckCircle2,
    ChevronRight,
    Search
} from 'lucide-react';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';
import Input from '../../../components/shared/Input';
import DenominationCounter from '../components/DenominationCounter';
import POSLayout from '../../../layouts/POSLayout';
import './SessionStartPage.css';

export default function SessionStartPage() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [register, setRegister] = useState('Register #01');
    const [openingBalance, setOpeningBalance] = useState(0);
    const [denominations, setDenominations] = useState({});
    const [notes, setNotes] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const handleStartSession = (e) => {
        e.preventDefault();
        setError('');

        if (step === 1) {
            setStep(2);
            return;
        }

        if (!password) {
            setError('Please enter your password to authorize the session start.');
            return;
        }

        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            const sessionData = {
                startTime: new Date().toISOString(),
                openingBalance,
                denominations,
                register,
                cashierId: user.id || 'C001',
                cashierName: user.email?.split('@')[0] || 'Unknown',
                notes,
                expectedCash: openingBalance,
                actualCash: 0,
                status: 'open'
            };

            localStorage.setItem('active_session', JSON.stringify(sessionData));
            localStorage.setItem('shift_status', 'open');

            // Initial log for cash drawer
            const logs = [
                {
                    type: 'OPENING',
                    amount: openingBalance,
                    timestamp: new Date().toISOString(),
                    desc: 'Initial opening balance'
                }
            ];
            localStorage.setItem('cash_drawer_logs', JSON.stringify(logs));

            setLoading(false);
            window.location.reload();
        }, 1500);
    };

    return (
        <POSLayout>
            <div className="session-start-container">
                <div className="session-start-content">
                    <div className="session-header">
                        <div className="session-logo">CK</div>
                        <div className="session-title">
                            <h1>Initialize Cashier Session</h1>
                            <p>Configure register and verify opening cash balance</p>
                        </div>
                    </div>

                    <div className="session-workflow-steps">
                        <div className={`workflow-step ${step >= 1 ? 'active' : ''}`}>
                            <div className="step-num">1</div>
                            <span>Denominations</span>
                        </div>
                        <div className="step-line"></div>
                        <div className={`workflow-step ${step >= 2 ? 'active' : ''}`}>
                            <div className="step-num">2</div>
                            <span>Verification</span>
                        </div>
                    </div>

                    <form onSubmit={handleStartSession} className="session-form">
                        {step === 1 ? (
                            <div className="step-content animate-fade-in">
                                <div className="session-grid">
                                    <div className="session-left-col">
                                        <Card glass title="Shift Details" padding="lg">
                                            <div className="profile-mini-card">
                                                <div className="avatar">
                                                    <User size={24} />
                                                </div>
                                                <div className="info">
                                                    <label>Cashier Profile</label>
                                                    <span>{user.email || 'cashier@coupangkmart.com'}</span>
                                                </div>
                                            </div>

                                            <div className="shift-info-grid">
                                                <div className="info-item">
                                                    <Clock size={16} />
                                                    <div>
                                                        <label>Login Time</label>
                                                        <span>{currentTime}</span>
                                                    </div>
                                                </div>
                                                <div className="info-item">
                                                    <Monitor size={16} />
                                                    <div>
                                                        <label>Terminal / Register</label>
                                                        <select
                                                            value={register}
                                                            onChange={(e) => setRegister(e.target.value)}
                                                            className="session-select"
                                                        >
                                                            <option>Register #01</option>
                                                            <option>Register #02</option>
                                                            <option>Register #03</option>
                                                            <option>Register #04</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="notes-section">
                                                <label>Session Notes (Optional)</label>
                                                <textarea
                                                    placeholder="Add any shift notes or hand-over messages here..."
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                ></textarea>
                                            </div>
                                        </Card>

                                        <div className="security-notice">
                                            <Info size={16} />
                                            <p>All opening balances are logged and sent to the admin for audit verification.</p>
                                        </div>
                                    </div>

                                    <div className="session-right-col">
                                        <Card glass title="Opening Balance Denominations" padding="lg">
                                            <DenominationCounter
                                                onTotalChange={setOpeningBalance}
                                                onDenominationsChange={setDenominations}
                                            />
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="step-content animate-slide-up">
                                <div className="confirmation-card-wrapper">
                                    <Card glass className="confirmation-card" padding="xl">
                                        <div className="conf-header">
                                            <div className="lock-icon">
                                                <Lock size={32} />
                                            </div>
                                            <h2>Verify Authorization</h2>
                                            <p>Confirm the opening balance of <strong>LKR {openingBalance.toLocaleString()}</strong> to start your shift.</p>
                                        </div>

                                        <div className="conf-summary-grid">
                                            <div className="conf-item">
                                                <label>Register</label>
                                                <span>{register}</span>
                                            </div>
                                            <div className="conf-item">
                                                <label>Cashier</label>
                                                <span>{user.email?.split('@')[0]}</span>
                                            </div>
                                            <div className="conf-item">
                                                <label>Timestamp</label>
                                                <span>{currentTime}</span>
                                            </div>
                                        </div>

                                        <div className="password-auth-field">
                                            <Input
                                                label="Confirm Identity Password"
                                                type="password"
                                                placeholder="Enter your login password"
                                                icon={Lock}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                autoFocus
                                            />
                                        </div>

                                        {error && <div className="session-error-msg">{error}</div>}

                                        <div className="conf-actions">
                                            <Button
                                                variant="secondary"
                                                type="button"
                                                onClick={() => setStep(1)}
                                                disabled={loading}
                                            >
                                                Go Back & Edit
                                            </Button>
                                            <Button
                                                variant="primary"
                                                type="submit"
                                                loading={loading}
                                            >
                                                Confirm & Start Shift
                                            </Button>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="session-footer-actions">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    type="submit"
                                    className="start-btn"
                                >
                                    Proceed to Verification <ChevronRight size={20} />
                                </Button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </POSLayout>
    );
}
