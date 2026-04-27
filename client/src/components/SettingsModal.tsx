import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, User, Bell, Palette, Shield } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl pointer-events-auto"
            >
              <Card className="bg-[#1a1a1a] border-white/10 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
                <CardContent className="p-0 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-blue-400" />
                    <h2 className="text-xl font-bold text-white">Settings</h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                  {/* Profile Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-4 h-4 text-blue-400" />
                      <h3 className="text-lg font-semibold text-white">Profile</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white mb-2">Username</Label>
                        <Input
                          defaultValue="Admin User"
                          className="bg-[#242424] border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white mb-2">Email</Label>
                        <Input
                          defaultValue="admin@feemanager.com"
                          className="bg-[#242424] border-white/10 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notifications Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Bell className="w-4 h-4 text-blue-400" />
                      <h3 className="text-lg font-semibold text-white">Notifications</h3>
                    </div>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-3 bg-[#242424] rounded-xl cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                        <span className="text-white">Payment reminders</span>
                        <input type="checkbox" defaultChecked className="w-5 h-5" />
                      </label>
                      <label className="flex items-center justify-between p-3 bg-[#242424] rounded-xl cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                        <span className="text-white">Email notifications</span>
                        <input type="checkbox" defaultChecked className="w-5 h-5" />
                      </label>
                      <label className="flex items-center justify-between p-3 bg-[#242424] rounded-xl cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                        <span className="text-white">SMS notifications</span>
                        <input type="checkbox" className="w-5 h-5" />
                      </label>
                    </div>
                  </div>

                  {/* Appearance Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Palette className="w-4 h-4 text-blue-400" />
                      <h3 className="text-lg font-semibold text-white">Appearance</h3>
                    </div>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-3 bg-[#242424] rounded-xl cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                        <span className="text-white">Dark mode</span>
                        <input type="checkbox" defaultChecked className="w-5 h-5" />
                      </label>
                      <label className="flex items-center justify-between p-3 bg-[#242424] rounded-xl cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                        <span className="text-white">Animations</span>
                        <input type="checkbox" defaultChecked className="w-5 h-5" />
                      </label>
                    </div>
                  </div>

                  {/* Security Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-4 h-4 text-blue-400" />
                      <h3 className="text-lg font-semibold text-white">Security</h3>
                    </div>
                    <div className="space-y-3">
                      <button className="w-full p-3 bg-[#242424] rounded-xl text-left text-white hover:bg-[#2a2a2a] transition-colors">
                        Change password
                      </button>
                      <button className="w-full p-3 bg-[#242424] rounded-xl text-left text-white hover:bg-[#2a2a2a] transition-colors">
                        Setup 2FA
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 flex-shrink-0">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-[#242424] border border-white/10 text-white rounded-xl hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        </>
      )}
    </AnimatePresence>
  );
}
