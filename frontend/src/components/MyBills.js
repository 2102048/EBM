import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';
function MyBills({ customerId }) {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBills = async () => {
            if (!customerId) {
                setError('No customer ID found for this user.');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const response = await axios.get(`${API_URL}/customers/${customerId}/bills`);
                setBills(response.data);
                setError(null);
            } catch (err) {
                setError('Failed to fetch bills.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchBills();
    }, [customerId]); 

    if (loading) return <p>Loading your bills...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div className="my-bills">
            <h3>Your Billing History</h3>
            {bills.length === 0 ? (
                <p>You have no bills yet.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Bill ID</th>
                            <th>Bill Date</th>
                            <th>Due Date</th>
                            <th>Units Consumed</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bills.map(bill => (
                            <tr key={bill.bill_id}>
                                <td>{bill.bill_id}</td>
                                <td>{bill.bill_date}</td>
                                <td>{bill.due_date}</td>
                                <td>{bill.units_consumed}</td>
                                <td>${bill.amount.toFixed(2)}</td>
                                <td style={{ color: bill.status === 'Unpaid' ? 'red' : 'green' }}>
                                    {bill.status}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default MyBills;