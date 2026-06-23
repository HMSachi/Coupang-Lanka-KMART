import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import {
    BarChart,
    Bar,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import {
    Activity,
    AlertTriangle,
    BarChart3,
    CalendarDays,
    Download,
    Package,
    RefreshCw,
    Search,
    ShoppingBag,
    TrendingUp,
    Users,
    WalletCards
} from 'lucide-react';
import '../styles/analytics.css';
import { API_BASE_URL } from '../../../config';

const apiUrl = API_BASE_URL;

const statusColors = {
    completed: '#22c55e',
    delivered: '#3b82f6',
    'cash received': '#06b6d4',
    pending: '#f59e0b',
    processing: '#a855f7',
    cancelled: '#ef4444',
    hold: '#f97316'
};

const channelColors = ['#38bdf8', '#22c55e', '#f59e0b'];

export default function SalesAnalyticsPage() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [orders, setOrders] = useState([]);
    const [reports, setReports] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [range, setRange] = useState('30');
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAnalytics = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const branchId = user.branch_id || 1;

            const [ordersRes, reportsRes, inventoryRes] = await Promise.all([
                fetch(`${apiUrl}/api/orders?status=ALL`, { headers }),
                fetch(`${apiUrl}/api/reports`, { headers }),
                fetch(`${apiUrl}/api/products/branch-inventory/${branchId}`, { headers })
            ]);

            const [ordersData, reportsData, inventoryData] = await Promise.all([
                ordersRes.ok ? ordersRes.json() : [],
                reportsRes.ok ? reportsRes.json() : [],
                inventoryRes.ok ? inventoryRes.json() : []
            ]);

            setOrders(Array.isArray(ordersData) ? ordersData : ordersData.data || []);
            setReports(Array.isArray(reportsData) ? reportsData : reportsData.data || []);
            setInventory(Array.isArray(inventoryData) ? inventoryData : inventoryData.data || []);
        } catch (err) {
            console.error('Sales analytics fetch failed:', err);
            setError('Unable to load analytics data. Check backend connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredOrders = useMemo(() => {
        const now = new Date();
        const rangeDays = range === 'all' ? null : Number(range);
        const floor = rangeDays ? new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000) : null;
        const text = query.trim().toLowerCase();

        return orders.filter(order => {
            const created = new Date(order.completed_at || order.created_at || order.delivery_date || Date.now());
            const matchesDate = !floor || created >= floor;
            const haystack = [
                order.order_id,
                order.customer_name,
                order.cashier_name,
                order.status,
                order.payment_method
            ].filter(Boolean).join(' ').toLowerCase();
            return matchesDate && (!text || haystack.includes(text));
        });
    }, [orders, range, query]);

    const analytics = useMemo(() => {
        const closedStatuses = ['completed', 'delivered', 'cash received'];
        const totalRevenue = filteredOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
        const completedRevenue = filteredOrders
            .filter(order => closedStatuses.includes(String(order.status || '').toLowerCase()))
            .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
        const averageOrder = filteredOrders.length ? totalRevenue / filteredOrders.length : 0;

        const statusMap = new Map();
        const channelMap = new Map();
        const cashierMap = new Map();
        const dayMap = new Map();

        filteredOrders.forEach(order => {
            const status = String(order.status || 'unknown').toLowerCase();
            statusMap.set(status, (statusMap.get(status) || 0) + 1);

            const channel = isPosOrder(order) ? 'POS / Cashier' : 'Online Web';
            channelMap.set(channel, (channelMap.get(channel) || 0) + Number(order.total_amount || 0));

            const cashier = order.cashier_name || order.cash_received_by || order.approved_by || 'Unassigned';
            const currentCashier = cashierMap.get(cashier) || { cashier, orders: 0, revenue: 0 };
            currentCashier.orders += 1;
            currentCashier.revenue += Number(order.total_amount || 0);
            cashierMap.set(cashier, currentCashier);

            const date = new Date(order.completed_at || order.created_at || Date.now());
            const key = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const day = dayMap.get(key) || { date: key, revenue: 0, orders: 0 };
            day.revenue += Number(order.total_amount || 0);
            day.orders += 1;
            dayMap.set(key, day);
        });

        const lowStock = inventory
            .filter(item => Number(item.stock_quantity || 0) <= Number(item.low_stock_threshold || 5))
            .sort((a, b) => Number(a.stock_quantity || 0) - Number(b.stock_quantity || 0));

        return {
            totalRevenue,
            completedRevenue,
            averageOrder,
            totalOrders: filteredOrders.length,
            statusData: Array.from(statusMap.entries()).map(([name, value]) => ({ name, value })),
            channelData: Array.from(channelMap.entries()).map(([name, value]) => ({ name, value })),
            cashierData: Array.from(cashierMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 6),
            dailyData: Array.from(dayMap.values()),
            lowStock,
            highValueOrders: filteredOrders.slice().sort((a, b) => Number(b.total_amount || 0) - Number(a.total_amount || 0)).slice(0, 8)
        };
    }, [filteredOrders, inventory]);

    const exportCsv = () => {
        const rows = [
            ['Order ID', 'Customer', 'Status', 'Payment', 'Channel', 'Total', 'Created'],
            ...filteredOrders.map(order => [
                order.order_id || order.id,
                order.customer_name || '',
                order.status || '',
                order.payment_method || '',
                isPosOrder(order) ? 'POS' : 'Online',
                Number(order.total_amount || 0),
                order.created_at || ''
            ])
        ];
        const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sales_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <AdminLayout>
            <div className="sales-analytics-page">
                <div className="sa-header">
                    <div>
                        <div className="sa-kicker">Branch Intelligence</div>
                        <h1>Sales Analytics</h1>
                        <p>Revenue, order flow, cashier productivity, and stock risk in one operational view.</p>
                    </div>
                    <div className="sa-header-actions">
                        <button onClick={fetchAnalytics} disabled={loading} title="Refresh analytics">
                            <RefreshCw size={16} />
                            {loading ? 'Refreshing' : 'Refresh'}
                        </button>
                        <button onClick={exportCsv} disabled={filteredOrders.length === 0} title="Export CSV">
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>

                <div className="sa-toolbar">
                    <div className="sa-search">
                        <Search size={17} />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search order, customer, cashier, status..."
                        />
                    </div>
                    <div className="sa-range">
                        <CalendarDays size={16} />
                        <select value={range} onChange={(e) => setRange(e.target.value)}>
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                            <option value="all">All time</option>
                        </select>
                    </div>
                </div>

                {error && <div className="sa-error">{error}</div>}

                <div className="sa-kpi-grid">
                    <MetricCard icon={WalletCards} label="Total Revenue" value={`LKR ${analytics.totalRevenue.toLocaleString()}`} meta={`${analytics.totalOrders} orders in scope`} />
                    <MetricCard icon={TrendingUp} label="Closed Revenue" value={`LKR ${analytics.completedRevenue.toLocaleString()}`} meta="Completed, delivered, cash received" tone="green" />
                    <MetricCard icon={ShoppingBag} label="Average Order" value={`LKR ${Math.round(analytics.averageOrder).toLocaleString()}`} meta="Across selected range" tone="blue" />
                    <MetricCard icon={AlertTriangle} label="Low Stock Alerts" value={analytics.lowStock.length.toLocaleString()} meta="At or below branch threshold" tone="amber" />
                </div>

                <div className="sa-grid">
                    <section className="sa-panel sa-wide">
                        <div className="sa-panel-head">
                            <div>
                                <h2>Revenue Trend</h2>
                                <p>Daily sales movement for the selected period</p>
                            </div>
                            <Activity size={18} />
                        </div>
                        <div className="sa-chart">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={analytics.dailyData}>
                                    <CartesianGrid stroke="#263449" vertical={false} />
                                    <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ background: '#101b2d', border: '1px solid #263449', borderRadius: 6, color: '#e5edf7' }} />
                                    <Line type="monotone" dataKey="revenue" stroke="#38bdf8" strokeWidth={3} dot={{ r: 3, fill: '#38bdf8' }} />
                                    <Line type="monotone" dataKey="orders" stroke="#22c55e" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    <section className="sa-panel">
                        <div className="sa-panel-head">
                            <div>
                                <h2>Channel Mix</h2>
                                <p>Online web vs POS revenue</p>
                            </div>
                            <BarChart3 size={18} />
                        </div>
                        <div className="sa-chart compact">
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={analytics.channelData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={3}>
                                        {analytics.channelData.map((entry, index) => (
                                            <Cell key={entry.name} fill={channelColors[index % channelColors.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#101b2d', border: '1px solid #263449', borderRadius: 6, color: '#e5edf7' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="sa-legend">
                            {analytics.channelData.map((item, index) => (
                                <div key={item.name}><span style={{ background: channelColors[index % channelColors.length] }} />{item.name}: LKR {Number(item.value).toLocaleString()}</div>
                            ))}
                        </div>
                    </section>

                    <section className="sa-panel">
                        <div className="sa-panel-head">
                            <div>
                                <h2>Status Breakdown</h2>
                                <p>Order count by workflow state</p>
                            </div>
                            <Package size={18} />
                        </div>
                        <div className="sa-status-list">
                            {analytics.statusData.length === 0 ? <EmptyLine text="No orders in selected range." /> : analytics.statusData.map(item => (
                                <div className="sa-status-row" key={item.name}>
                                    <span className="dot" style={{ background: statusColors[item.name] || '#94a3b8' }} />
                                    <strong>{item.name}</strong>
                                    <em>{item.value}</em>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="sa-panel sa-wide">
                        <div className="sa-panel-head">
                            <div>
                                <h2>Cashier Performance</h2>
                                <p>Revenue and order volume by cashier interaction</p>
                            </div>
                            <Users size={18} />
                        </div>
                        <div className="sa-chart">
                            <ResponsiveContainer width="100%" height={270}>
                                <BarChart data={analytics.cashierData}>
                                    <CartesianGrid stroke="#263449" vertical={false} />
                                    <XAxis dataKey="cashier" stroke="#94a3b8" tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ background: '#101b2d', border: '1px solid #263449', borderRadius: 6, color: '#e5edf7' }} />
                                    <Bar dataKey="revenue" fill="#38bdf8" radius={[5, 5, 0, 0]} />
                                    <Bar dataKey="orders" fill="#22c55e" radius={[5, 5, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    <section className="sa-panel">
                        <div className="sa-panel-head">
                            <div>
                                <h2>Stock Watch</h2>
                                <p>Branch inventory requiring attention</p>
                            </div>
                            <AlertTriangle size={18} />
                        </div>
                        <div className="sa-list">
                            {analytics.lowStock.slice(0, 6).map(item => (
                                <div className="sa-list-row" key={item.inventory_id || item.product_id || item.id}>
                                    <div>
                                        <strong>{item.name}</strong>
                                        <span>{item.category_name || 'Uncategorized'}</span>
                                    </div>
                                    <em>{Number(item.stock_quantity || 0)} left</em>
                                </div>
                            ))}
                            {analytics.lowStock.length === 0 && <EmptyLine text="No low-stock items for this branch." />}
                        </div>
                    </section>

                    <section className="sa-panel sa-wide">
                        <div className="sa-panel-head">
                            <div>
                                <h2>High Value Orders</h2>
                                <p>Largest transactions in the current selection</p>
                            </div>
                            <ShoppingBag size={18} />
                        </div>
                        <div className="sa-table-wrap">
                            <table className="sa-table">
                                <thead>
                                    <tr>
                                        <th>Order</th>
                                        <th>Customer</th>
                                        <th>Status</th>
                                        <th>Channel</th>
                                        <th className="right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.highValueOrders.map(order => (
                                        <tr key={order.id || order.order_id}>
                                            <td>{order.order_id || order.id}</td>
                                            <td>{order.customer_name || 'POS Customer'}</td>
                                            <td><span className="sa-chip">{order.status || 'N/A'}</span></td>
                                            <td>{isPosOrder(order) ? 'POS' : 'Online'}</td>
                                            <td className="right">LKR {Number(order.total_amount || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {analytics.highValueOrders.length === 0 && (
                                        <tr><td colSpan="5"><EmptyLine text="No orders found for this selection." /></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}

function MetricCard({ icon: Icon, label, value, meta, tone = 'default' }) {
    return (
        <section className={`sa-metric ${tone}`}>
            <div className="sa-metric-icon"><Icon size={20} /></div>
            <div>
                <span>{label}</span>
                <strong>{value}</strong>
                <p>{meta}</p>
            </div>
        </section>
    );
}

function EmptyLine({ text }) {
    return <div className="sa-empty-line">{text}</div>;
}

function isPosOrder(order) {
    const orderId = String(order.order_id || '');
    return Boolean(
        order.session_id ||
        order.register_id ||
        order.cashier_name ||
        order.shipping_method === 'In-Store' ||
        orderId.startsWith('HOLD-') ||
        orderId.startsWith('INV-')
    );
}
