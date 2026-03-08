import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Maintenance.css';

const Maintenance = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        try {
            const response = await api.get('/rooms'); // For now, list rooms to show something operational
            // In a real scenario, this would be /maintenance-tasks
            setTasks(response.data);
        } catch (err) {
            console.error('Failed to fetch maintenance data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    return (
        <div className="maintenance-page">
            <div className="page-header">
                <div>
                    <h1>Maintenance Management</h1>
                    <p>Track room repairs, equipment servicing, and facility upkeep.</p>
                </div>
                <button className="btn-primary">+ New Task</button>
            </div>

            <div className="premium-card table-container">
                {loading ? (
                    <div className="loading">Loading maintenance records...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Asset / Room</th>
                                <th>Issue Description</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map((task) => (
                                <tr key={task.id}>
                                    <td>
                                        <div className="asset-info">
                                            <span className="bold">Room {task.roomNumber}</span>
                                            <span className="sub-text">Floor {task.floor}</span>
                                        </div>
                                    </td>
                                    <td>General inspection and routine maintenance</td>
                                    <td><span className="badge-priority low">Low</span></td>
                                    <td><span className="status-badge available">Operational</span></td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn">View Details</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Maintenance;
