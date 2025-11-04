import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';
function GenerateBillForm() {
    const [meterId, setMeterId] = useState('');
    const [readingValue, setReadingValue] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const response = await axios.post(`${API_URL}/bills/generate`, {
                meter_id: meterId,
                reading_value: readingValue
            });
            setMessage(`Success! Bill #${response.data.bill_id} generated. Amount: $${response.data.amount.toFixed(2)}`);
            setMeterId('');
            setReadingValue('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to generate bill.');
            console.error(err);
        }
    };

    return (
        <div className="form-card">
            <h3>Generate New Bill</h3>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Meter ID: </label>
                    <input 
                        type="number"
                        value={meterId}
                        onChange={(e) => setMeterId(e.target.value)}
                        placeholder="e.g., 1"
                        required
                    />
                </div>
                <div>
                    <label>New Reading: </label>
                    <input 
                        type="number"
                        value={readingValue}
                        onChange={(e) => setReadingValue(e.target.value)}
                        placeholder="e.g., 1200"
                        required
                    />
                </div>
                <button type="submit">Generate Bill</button>
                {message && <p style={{ color: 'green' }}>{message}</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </form>
        </div>
    );
}

export default GenerateBillForm;