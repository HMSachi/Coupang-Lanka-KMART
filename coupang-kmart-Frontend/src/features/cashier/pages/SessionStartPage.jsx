import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import POSLayout from '../../../layouts/POSLayout';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';
import Input from '../../../components/shared/Input';
import DenominationCounter from '../components/DenominationCounter';
import {
    Clock,
    Monitor,
    User,
    Key,
    Info,
    ChevronRight,
    ArrowLeft,
    ShieldCheck,
    MessageSquare,
    Store
} from 'lucide-react';
import './SessionStartPage.css';

export default function SessionStartPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [openingBalance, setOpeningBalance] = useState(0);
    const [denominations, setDenominations] = useState({});
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Shift data
    const [shiftData, setShiftData] = useState({
        cashier: '',
        register: 'REGISTER_01',
        loginTime: new Date().toLocaleTimeString(),
        notes: ''
    });

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setShiftData(prev => ({ ...prev, cashier: user.name || user.email || 'Cashier' }));
    }, []);

    const handleInitialize = () => {
        setIsLoading(true);
        setError('');

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userPassword = user.password || '1234ab'; // Match user's expected password

        if (password !== userPassword) {
            setTimeout(() => {
                setError('Authentication failed. Please enter your correct login password.');
                setIsLoading(false);
            }, 1000);
            return;
        }

        setTimeout(() => {
            const session = {
                id: `SESS_${Date.now()}`,
                cashier: shiftData.cashier,
                registerId: shiftData.register,
                startTime: new Date().toISOString(),
                openingBalance,
                denominations,
                notes: shiftData.notes,
                status: 'ACTIVE'
            };

            localStorage.setItem('active_session', JSON.stringify(session));
            localStorage.setItem('shift_status', 'active');

            // Clear inventory cache to ensure fresh data for new session
            localStorage.removeItem('pos_cart');

            // Success redirect/reload
            window.location.reload();
        }, 1500);
    };

    return (
        <POSLayout>
            <div className="session-start-container">
                <div className="session-start-content">

                    {/* Unified Header */}
                    <div className="session-header animate-fade-in">
                        <div className="session-logo"><ShieldCheck size={24} /></div>
                        <div className="session-title">
                            <span className="session-eyebrow">Cashier EOD Control</span>
                            <h1>Initialize Cashier Session</h1>
                            <p>Verify terminal details and opening cash before register operations begin.</p>
                        </div>
                        <div className="session-header-meta">
                            <span>Terminal #{shiftData.register.split('_')[1]}</span>
                            <strong>LKR {openingBalance.toLocaleString()}</strong>
                        </div>
                    </div>

                    {/* Step Indicator */}
                    <div className="session-workflow-steps animate-fade-in">
                        <div className={`workflow-step ${step >= 1 ? 'active' : ''}`}>
                            <div className="step-num">1</div>
                            <span>Setup & Denominations</span>
                        </div>
                        <div className="step-line"></div>
                        <div className={`workflow-step ${step >= 2 ? 'active' : ''}`}>
                            <div className="step-num">2</div>
                            <span>Authentication</span>
                        </div>
                    </div>

                    {step === 1 ? (
                        <div className="session-grid animate-slide-up">
                            {/* Left: Configuration */}
                            <div className="config-column">
                                <Card white title="Shift Configuration" className="session-panel-card">
                                    <div className="profile-mini-card">
                                        <div className="avatar"><User size={24} /></div>
                                        <div className="info">
                                            <label>Current Cashier</label>
                                            <span>{shiftData.cashier}</span>
                                        </div>
                                    </div>

                                    <div className="shift-info-grid">
                                        <div className="info-item">
                                            <div className="icon-circ"><Clock size={16} /></div>
                                            <div className="text">
                                                <label>Session Start Time</label>
                                                <span>{shiftData.loginTime}</span>
                                            </div>
                                        </div>
                                        <div className="info-item">
                                            <div className="icon-circ"><Store size={16} /></div>
                                            <div className="text">
                                                <label>Select Register</label>
                                                <select
                                                    value={shiftData.register}
                                                    onChange={(e) => setShiftData({ ...shiftData, register: e.target.value })}
                                                >
                                                    <option value="REGISTER_01">Register #01</option>
                                                    <option value="REGISTER_02">Register #02</option>
                                                    <option value="EXPRESS_01">Express Counter 01</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="notes-section">
                                        <label><MessageSquare size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Hand-over Notes (Optional)</label>
                                        <textarea
                                            placeholder="Add any shift notes or hand-over messages here..."
                                            value={shiftData.notes}
                                            onChange={(e) => setShiftData({ ...shiftData, notes: e.target.value })}
                                        />
                                    </div>

                                    <div className="security-notice">
                                        <Info size={20} />
                                        <p>Opening balances are strictly logged and cross-verified by regional managers during EOD audits.</p>
                                    </div>
                                </Card>
                            </div>

                            {/* Right: Denominations */}
                            <div className="denoms-column">
                                <Card white title="Opening Balance Denominations" className="session-panel-card">
                                    <DenominationCounter
                                        onTotalChange={setOpeningBalance}
                                        onDenominationsChange={setDenominations}
                                    />
                                </Card>

                                <div className="session-footer-actions">
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        className="start-btn"
                                        onClick={() => setStep(2)}
                                        disabled={openingBalance <= 0}
                                    >
                                        Proceed to Initialization <ChevronRight size={18} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Step 2: Authentication */
                        <div className="confirmation-card-wrapper animate-slide-up">
                            <Card white>
                                <div className="conf-header">
                                    <div className="lock-icon"><ShieldCheck size={32} /></div>
                                    <h2>Final Verification</h2>
                                    <p>Please confirm the opening balance and enter your login password to start.</p>
                                </div>

                                <div className="conf-summary-grid">
                                    <div className="conf-item">
                                        <label>Opening</label>
                                        <span>LKR {openingBalance.toLocaleString()}</span>
                                    </div>
                                    <div className="conf-item">
                                        <label>Terminal</label>
                                        <span>{shiftData.register.split('_')[1]}</span>
                                    </div>
                                    <div className="conf-item">
                                        <label>Cashier ID</label>
                                        <span>C-{Date.now().toString().slice(-4)}</span>
                                    </div>
                                </div>

                                <div className="password-auth-field">
                                    <Input
                                        label="Security Password"
                                        type="password"
                                        placeholder="Enter your login password"
                                        icon={Key}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                {error && <div className="session-error-msg">{error}</div>}

                                <div className="conf-actions">
                                    <Button
                                        variant="secondary"
                                        fullWidth
                                        onClick={() => setStep(1)}
                                        disabled={isLoading}
                                    >
                                        <ArrowLeft size={18} /> Back
                                    </Button>
                                    <Button
                                        variant="primary"
                                        fullWidth
                                        onClick={handleInitialize}
                                        loading={isLoading}
                                    >
                                        Start Session
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </POSLayout>
    );
}
