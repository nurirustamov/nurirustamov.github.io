import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Card from '../components/ui/Card';
import { UsersIcon, DocumentTextIcon, CollectionIcon } from '../assets/icons';

const AdminPage = () => {
    const navLinkClasses = ({ isActive }) => 
        `flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ` + 
        (isActive ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
                <Card>
                    <h2 className="text-lg font-bold mb-4">Admin Panel</h2>
                    <nav className="space-y-1">
                        <NavLink to="/admin/users" className={navLinkClasses}>
                            <UsersIcon className="w-5 h-5 mr-3" />
                            İstifadəçi İdarəetməsi
                        </NavLink>
                        <NavLink to="/admin/articles" className={navLinkClasses}>
                            <DocumentTextIcon className="w-5 h-5 mr-3" />
                            Məqalələr
                        </NavLink>
                        <NavLink to="/admin/courses" className={navLinkClasses}>
                            <CollectionIcon className="w-5 h-5 mr-3" />
                            Kurslar
                        </NavLink>
                    </nav>
                </Card>
            </div>
            <div className="lg:col-span-3">
                <Outlet />
            </div>
        </div>
    );
};

export default AdminPage;