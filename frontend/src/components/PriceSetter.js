import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';
function PriceSetter() {
    const [currentPrice, setCurrentPrice] = useState(0);
    const [newPrice, setNewPrice] = useState('');
    const [message, setMessage] = useState('');

    const fetchPrice = async () => {
        try {
            const response = await axios.get(`${API_URL}/settings/price`);
            setCurrentPrice(response.data.price_per_unit);
        } catch (err) {
            console.error("Error fetching price", err);
        }
    };

    useEffect(() => {
        fetchPrice();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const response = await axios.post(`${API_URL}/settings/price`, {
                price_per_unit: newPrice
            });
            setMessage(response.data.message);
            setCurrentPrice(response.data.new_price);
            setNewPrice('');
        } catch (err) {
            setMessage('Failed to update price.');
            console.error(err);
        }
    };

    return (
        <div className="form-card">
            <h3>Set Unit Price</h3>
            <p>Current Price: <b>${Number(currentPrice).toFixed(4)}</b> per unit</p>            <form onSubmit={handleSubmit}>
                <div>
                    <label>New Price: </label>
                    <input 
                        type="number" 
                        step="0.0001" 
                        min="0"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        placeholder="e.g., 0.17"
                        required
                    />
                </div>
                <button type="submit">Update Price</button>
                {message && <p>{message}</p>}
            </form>
        </div>
    );
}

export default PriceSetter;
