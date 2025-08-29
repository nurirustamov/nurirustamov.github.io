import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';

const AssignmentModal = ({ isOpen, onClose, onAssign, allUsers, studentGroups, itemTitle }) => {
    const [assignTo, setAssignTo] = useState('user'); // 'user' or 'group'
    const [selectedId, setSelectedId] = useState('');
    const [dueDate, setDueDate] = useState('');

    // Reset form state when modal is closed or reopened
    useEffect(() => {
        if (!isOpen) {
            // A short delay to prevent user from seeing the reset before the modal fades out
            setTimeout(() => {
                setAssignTo('user');
                setSelectedId('');
                setDueDate('');
            }, 200);
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (!selectedId) {
            alert('Zəhmət olmasa, tələbə və ya qrup seçin.');
            return;
        }
        onAssign({
            assignToType: assignTo,
            assignToId: selectedId,
            dueDate: dueDate || null
        });
        onClose();
    };

    const students = allUsers.filter(u => u.role !== 'admin');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`"${itemTitle}" üçün tapşırıq təyin et`}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Kimə təyin edilsin?</label>
                    <select value={assignTo} onChange={(e) => { setAssignTo(e.target.value); setSelectedId(''); }} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                        <option value="user">Fərdi Tələbəyə</option>
                        <option value="group">Qrupa</option>
                    </select>
                </div>

                {assignTo === 'user' ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tələbə seçin</label>
                        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                            <option value="" disabled>Tələbə...</option>
                            {students.map(user => (
                                <option key={user.id} value={user.id}>{user.first_name} {user.last_name} ({user.email})</option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Qrup seçin</label>
                        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                            <option value="" disabled>Qrup...</option>
                            {studentGroups.map(group => (
                                <option key={group.id} value={group.id}>{group.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700">Son tarix (istəyə bağlı)</label>
                    <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                <Button onClick={handleSubmit}>Təyin et</Button>
            </div>
        </Modal>
    );
};

export default AssignmentModal;