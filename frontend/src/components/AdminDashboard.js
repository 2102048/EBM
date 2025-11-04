import React from 'react';
import CustomerList from './CustomerList';
import PriceSetter from './PriceSetter'; 
import GenerateBillForm from './GenerateBillForm';

function AdminDashboard({ user }) {
    return (
        <div className="admin-dashboard">
            <h2>Welcome, Admin ({user.username})!</h2>
            <p>Here you can manage customers and system settings.</p>
            
            <div className="admin-dashboard-forms">
                <PriceSetter />
                <GenerateBillForm />
            </div>
            
            <hr style={{ margin: '20px 0' }} />
            
            <CustomerList />
        </div>
    );
}

export default AdminDashboard;