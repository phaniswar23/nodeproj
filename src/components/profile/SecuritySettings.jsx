import { useState } from 'react';
import { GameButton } from '@/components/ui/GameButton';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Lock, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";

export const SecuritySettings = () => {
    const { signOut } = useAuth();

    // Change Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loadingPass, setLoadingPass] = useState(false);

    // Delete Account State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [loadingDelete, setLoadingDelete] = useState(false);

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error("Please fill all fields");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }


        setLoadingPass(true);
        try {
            await api.post('/auth/change-password', { currentPassword, newPassword });
            toast.success("Password updated successfully");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update password");
        } finally {
            setLoadingPass(false);
        }
    };

    const handleDeleteAccount = async () => {
        setLoadingDelete(true);
        try {
            // API: DELETE /api/account
            await api.delete('/account', { data: { password: deletePassword } });
            toast.success("Account deleted. Goodbye!");
            signOut();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete account");
            setLoadingDelete(false);
        }
    };

    return (
        <div className="space-y-8 p-1">

            {/* Change Password Section */}
            <div className="bg-[#111214] border border-white/5 rounded-xl p-6">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                        <Lock className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Change Password</h3>
                        <p className="text-sm text-gray-400">Update your password to keep your account secure.</p>
                    </div>
                </div>

                <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Current Password</label>
                        <Input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="bg-black/20 border-white/10"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">New Password</label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Confirm</label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <GameButton
                            onClick={handleChangePassword}
                            disabled={loadingPass}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                            {loadingPass ? "Updating..." : "Update Password"}
                        </GameButton>
                    </div>
                </div>
            </div>

            {/* Delete Account Section */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-500/10 rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">Delete Account</h3>
                        <p className="text-sm text-red-200/60 mb-4">
                            Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-bold rounded-lg border border-red-500/20 transition-colors flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" /> Delete Account
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent className="bg-[#111214] border-red-500/20">
                    <DialogHeader>
                        <DialogTitle className="text-red-500 font-bold flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" /> Delete Account?
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Please enter your password to confirm deletion. This will permanently erase your data.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Password Confirmation</label>
                        <Input
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            className="bg-black/20 border-red-500/20 focus:border-red-500"
                            placeholder="Enter password..."
                        />
                    </div>

                    <DialogFooter>
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="px-4 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteAccount}
                            disabled={loadingDelete || !deletePassword}
                            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingDelete ? "Deleting..." : "Confirm Deletion"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
