import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';
function LoginPage({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault(); 
        setError(null);
        try {
            const response = await axios.post(`${API_URL}/login`, {
                username,
                password
            });
            onLogin(response.data); // Pass user data up to App.js
        } catch (err) {
            setError('Invalid username or password.');
            console.error(err);
        }
    };

    return (
        <div className="login-form">
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Username: </label>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        required 
                    />
                </div>
                <div>
                    <label>Password: </label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                </div>
                <button type="submit">Login</button>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                
                <div style={{ marginTop: '20px', fontSize: '0.9em', background: '#f4f4f4', padding: '10px', borderRadius: '4px' }}>
                  <p><b>Admin Login:</b> admin / adminpass</p>
                  <p><b>Customer Login:</b> johndoe / customerpass</p>
                </div>
            </form>
        </div>
    );
}

export default LoginPage;