import React from 'react';
import MyBills from './MyBills'; 

function CustomerDashboard({ user }) {
    return (
        <div className="customer-dashboard">
            <h2>Welcome, {user.username}!</h2>
            <p>Here you can view your billing history.</p>
            <MyBills customerId={user.customer_id} />
        </div>
    );
}

export default CustomerDashboard;